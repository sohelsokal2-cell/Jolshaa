const Story = require('../models/Story');
const cloudinary = require('../config/cloudinary');

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

    const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    const result = await uploadToCloudinary(req.file.buffer, 'jolshaa/stories');

    const story = await Story.create({
      author: req.user._id,
      media: result.secure_url,
      mediaType,
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
    const stories = await Story.find({ author: { $ne: req.user._id } })
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

    if (!story.viewers.includes(req.user._id)) {
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
