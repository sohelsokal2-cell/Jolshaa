const Story = require('../models/Story');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const { hasId } = require('../utils/id');

const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

exports.createStory = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Media file is required' });
    }

    const { visibility } = req.body;
    const storyVisibility = visibility || req.query.visibility || 'friends';
    const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    const result = await uploadToCloudinary(req.file.buffer, 'jolshaa/stories');

    const story = await Story.create({
      author: req.user._id,
      media: result.secure_url,
      mediaType,
      visibility: storyVisibility
    });

    await story.populate('author', 'name profilePhoto');

    res.status(201).json({ story });
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getStoriesFeed = async (req, res) => {
  try {
    // Get blocked users
    const currentUser = await User.findById(req.user._id).select('blockedUsers');
    const blockedIds = currentUser.blockedUsers || [];

    // Get users who hid stories from current user
    const hiddenFromUsers = await User.find({ storyHiddenFrom: req.user._id }).select('_id');
    const hiddenFromIds = hiddenFromUsers.map(u => u._id);

    const stories = await Story.find({
      author: { $ne: req.user._id, $nin: [...blockedIds, ...hiddenFromIds] }
    })
      .populate('author', 'name profilePhoto')
      .populate('viewers', '_id')
      .sort({ createdAt: -1 });

    // Group stories by author
    const grouped = {};
    stories.forEach((story) => {
      const authorId = story.author._id.toString();
      if (!grouped[authorId]) {
        grouped[authorId] = {
          author: story.author,
          stories: [],
          latestStory: story,
        };
      }
      grouped[authorId].stories.push({
        _id: story._id,
        media: story.media,
        mediaType: story.mediaType,
        createdAt: story.createdAt,
        viewCount: story.viewers.length,
        hasViewed: story.viewers.some(
          (v) => v._id.toString() === req.user._id.toString()
        ),
        reactions: story.reactions,
        replyCount: story.replies.length,
      });
    });

    // Sort groups: unseen first, then seen
    const feed = Object.values(grouped).sort((a, b) => {
      const aHasUnseen = a.stories.some((s) => !s.hasViewed);
      const bHasUnseen = b.stories.some((s) => !s.hasViewed);
      if (aHasUnseen && !bHasUnseen) return -1;
      if (!aHasUnseen && bHasUnseen) return 1;
      return b.latestStory.createdAt - a.latestStory.createdAt;
    });

    // Also get current user's own stories
    const myStories = await Story.find({ author: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      myStories: myStories.map((s) => ({
        _id: s._id,
        media: s.media,
        mediaType: s.mediaType,
        createdAt: s.createdAt,
        viewCount: s.viewers.length,
        reactions: s.reactions,
        replyCount: s.replies.length,
      })),
      feed,
    });
  } catch (error) {
    console.error('Get stories feed error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserStories = async (req, res) => {
  try {
    // Check block status
    const targetUser = await User.findById(req.params.userId).select('blockedUsers');
    if (targetUser && hasId(targetUser.blockedUsers, req.user._id)) {
      return res.status(403).json({ message: 'User not found' });
    }
    const currentUser = await User.findById(req.user._id).select('blockedUsers');
    if (currentUser && hasId(currentUser.blockedUsers, req.params.userId)) {
      return res.status(403).json({ message: 'You have blocked this user' });
    }

    const stories = await Story.find({ author: req.params.userId })
      .populate('author', 'name profilePhoto')
      .populate('viewers', '_id')
      .sort({ createdAt: -1 });

    const storiesWithViewStatus = stories.map((story) => ({
      _id: story._id,
      media: story.media,
      mediaType: story.mediaType,
      createdAt: story.createdAt,
      author: story.author,
      viewCount: story.viewers.length,
      hasViewed: story.viewers.some(
        (v) => v._id.toString() === req.user._id.toString()
      ),
      reactions: story.reactions,
      replyCount: story.replies.length,
    }));

    res.json({ stories: storiesWithViewStatus });
  } catch (error) {
    console.error('Get user stories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.viewStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    if (!hasId(story.viewers, req.user._id)) {
      story.viewers.push(req.user._id);
      await story.save();
    }

    res.json({ message: 'Story viewed' });
  } catch (error) {
    console.error('View story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    if (story.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await story.deleteOne();
    res.json({ message: 'Story deleted' });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.reactToStory = async (req, res) => {
  try {
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ message: 'Emoji is required' });

    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    const existingIndex = story.reactions.findIndex(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (existingIndex >= 0) {
      if (story.reactions[existingIndex].emoji === emoji) {
        story.reactions.splice(existingIndex, 1);
      } else {
        story.reactions[existingIndex].emoji = emoji;
      }
    } else {
      story.reactions.push({ user: req.user._id, emoji });
    }

    await story.save();
    res.json({ reactions: story.reactions });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.replyToStory = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Reply text is required' });

    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    story.replies.push({ user: req.user._id, text });
    await story.save();

    await story.populate('replies.user', 'name profilePhoto');

    const newReply = story.replies[story.replies.length - 1];

    res.status(201).json({ reply: newReply });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getStoryReplies = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate('replies.user', 'name profilePhoto');

    if (!story) return res.status(404).json({ message: 'Story not found' });

    res.json({ replies: story.replies });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
