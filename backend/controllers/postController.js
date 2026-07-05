const Post = require('../models/Post');
const Reaction = require('../models/Reaction');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const cloudinary = require('../config/cloudinary');

const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });
};

exports.createPost = async (req, res) => {
  try {
    const User = require('../models/User');
    const currentUser = await User.findById(req.user._id).select('restrictions');
    const now = new Date();
    const postRestricted = currentUser.restrictions?.find(r => r.type === 'post' && (!r.expiresAt || r.expiresAt > now));
    if (postRestricted) {
      return res.status(403).json({ message: 'You are restricted from creating posts', restricted: true });
    }

    const { text, feeling, taggedUsers, visibility, postedInType, postedInRefId, contentWarning, communityLabel, footnotes } = req.body;
    const trimmedText = typeof text === 'string' ? text.trim().substring(0, 5000) : '';

    if (!trimmedText && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ message: 'Post must have text or media' });
    }

    // Duplicate post detection: same text within last 5 minutes
    if (trimmedText) {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      const duplicate = await Post.findOne({
        author: req.user._id,
        text: trimmedText,
        createdAt: { $gte: fiveMinAgo }
      });
      if (duplicate) {
        return res.status(409).json({ message: 'Duplicate post detected. Please wait before posting the same content again.' });
      }
    }

    // Spam check: more than 3 links
    const linkCount = (trimmedText.match(/https?:\/\//g) || []).length;
    if (linkCount > 3) {
      return res.status(400).json({ message: 'Posts with more than 3 links are not allowed' });
    }

    let media = [];
    if (req.files && req.files.length > 0) {
      const altTexts = req.body.altTexts ? JSON.parse(req.body.altTexts) : [];
      const captions = req.body.mediaCaptions ? JSON.parse(req.body.mediaCaptions) : [];
      const uploadPromises = req.files.map(file =>
        uploadToCloudinary(file.buffer, 'jolshaa/posts')
      );
      const urls = await Promise.all(uploadPromises);
      media = urls.map((url, i) => ({
        url,
        altText: altTexts[i] || '',
        caption: captions[i] || '',
      }));
    }

    const tagged = taggedUsers ? JSON.parse(taggedUsers) : [];

    // Limit tagged users to 20
    if (tagged.length > 20) {
      return res.status(400).json({ message: 'Cannot tag more than 20 users' });
    }

    const postedIn = {
      type: postedInType || 'profile',
      refId: postedInRefId || null
    };

    const hashtags = trimmedText
      ? [...new Set((trimmedText.match(/#(\w+)/g) || []).map((t) => t.slice(1).toLowerCase()))]
      : [];

    const post = await Post.create({
      author: req.user._id,
      text: trimmedText,
      media,
      feeling: feeling || null,
      taggedUsers: tagged,
      visibility: visibility || 'public',
      postedIn,
      hashtags,
      contentWarning: contentWarning || 'none',
      communityLabel: communityLabel || '',
      footnotes: footnotes || '',
    });

    await post.populate('author', 'name profilePhoto');

    // Notify tagged users
    if (tagged.length > 0) {
      const { getIO } = require('../socket');
      for (const taggedUserId of tagged) {
        if (taggedUserId.toString() === req.user._id.toString()) continue;
        const notification = await Notification.create({
          recipient: taggedUserId,
          sender: req.user._id,
          type: 'tag',
          relatedPost: post._id
        });
        getIO().to(`user:${taggedUserId}`).emit('newNotification', {
          ...notification.toObject(),
          sender: { _id: req.user._id, name: req.user.name, profilePhoto: req.user.profilePhoto }
        });
      }
    }

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const FeedRanker = require('../services/feedRanker');
    const rankedResult = await FeedRanker.getRankedFeed(req.user._id, page, limit);

    const postIds = rankedResult.posts.map(p => p._id);

    const reactions = await Reaction.aggregate([
      { $match: { targetType: 'Post', targetId: { $in: postIds } } },
      { $group: { _id: '$targetId', count: { $sum: 1 }, types: { $push: '$type' } } }
    ]);

    const reactionMap = {};
    reactions.forEach(r => {
      reactionMap[r._id.toString()] = { count: r.count, myReaction: null };
    });

    const myReactions = await Reaction.find({
      targetType: 'Post',
      targetId: { $in: postIds },
      user: req.user._id
    });

    myReactions.forEach(r => {
      const key = r.targetId.toString();
      if (reactionMap[key]) reactionMap[key].myReaction = r.type;
    });

    const commentCounts = await Comment.aggregate([
      { $match: { post: { $in: postIds } } },
      { $group: { _id: '$post', count: { $sum: 1 } } }
    ]);

    const commentMap = {};
    commentCounts.forEach(c => {
      commentMap[c._id.toString()] = c.count;
    });

    const postsWithMeta = rankedResult.posts.map(post => ({
      ...post,
      reactions: reactionMap[post._id.toString()] || { count: 0, myReaction: null },
      commentCount: commentMap[post._id.toString()] || 0
    }));

    res.json({
      posts: postsWithMeta,
      page,
      totalPages: rankedResult.totalPages,
      hasMore: rankedResult.hasMore
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own posts' });
    }

    const { text, feeling, visibility } = req.body;
    if (text !== undefined) post.text = String(text).trim().substring(0, 5000);
    if (feeling !== undefined) post.feeling = feeling;
    if (visibility !== undefined) post.visibility = visibility;
    post.isEdited = true;

    await post.save();
    await post.populate('author', 'name profilePhoto');

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }

    await Post.findByIdAndDelete(req.params.id);
    await Comment.deleteMany({ post: req.params.id });
    await Reaction.deleteMany({ targetType: 'Post', targetId: req.params.id });

    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.inviteCollaborator = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the author can invite collaborators' });
    }

    const alreadyInvited = post.collaborators.some(
      c => c.user.toString() === userId
    );
    if (alreadyInvited) {
      return res.status(400).json({ message: 'User already invited' });
    }

    post.collaborators.push({
      user: userId,
      role: role || 'editor',
      invitedAt: new Date(),
    });
    await post.save();

    const Notification = require('../models/Notification');
    const notification = await Notification.create({
      recipient: userId,
      sender: req.user._id,
      type: 'collaboration_invite',
      relatedPost: post._id,
    });

    const { getIO } = require('../socket');
    getIO().to(`user:${userId}`).emit('newNotification', {
      ...notification.toObject(),
      sender: { _id: req.user._id, name: req.user.name, profilePhoto: req.user.profilePhoto }
    });

    res.json({ message: 'Collaborator invited' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.acceptCollaboration = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const collab = post.collaborators.find(
      c => c.user.toString() === req.user._id.toString()
    );
    if (!collab) return res.status(403).json({ message: 'Not invited' });

    collab.acceptedAt = new Date();
    await post.save();

    res.json({ message: 'Collaboration accepted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeCollaborator = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the author can remove collaborators' });
    }

    post.collaborators = post.collaborators.filter(
      c => c.user.toString() !== req.params.userId
    );
    await post.save();

    res.json({ message: 'Collaborator removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.reactToPost = async (req, res) => {
  try {
    const { type } = req.body;
    const validTypes = ['like', 'love', 'haha', 'wow', 'sad', 'angry', 'fire', 'clap', 'think', 'care'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid reaction type' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const existing = await Reaction.findOne({
      user: req.user._id,
      targetType: 'Post',
      targetId: req.params.id
    });

    if (existing) {
      if (existing.type === type) {
        await existing.deleteOne();
        return res.json({ message: 'Reaction removed', myReaction: null });
      }
      existing.type = type;
      await existing.save();
      return res.json({ message: 'Reaction updated', myReaction: type });
    }

    await Reaction.create({
      user: req.user._id,
      targetType: 'Post',
      targetId: req.params.id,
      type
    });

    // Notify post author (skip self)
    if (post.author.toString() !== req.user._id.toString()) {
      const notification = await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: 'reaction',
        relatedPost: post._id
      });
      const { getIO } = require('../socket');
      getIO().to(`user:${post.author}`).emit('newNotification', {
        ...notification.toObject(),
        sender: { _id: req.user._id, name: req.user.name, profilePhoto: req.user.profilePhoto }
      });
    }

    res.json({ message: 'Reaction added', myReaction: type });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.sharePost = async (req, res) => {
  try {
    const originalPost = await Post.findById(req.params.id);
    if (!originalPost) return res.status(404).json({ message: 'Post not found' });

    const { text } = req.body;
    const trimmedText = typeof text === 'string' ? text.trim() : '';

    const post = await Post.create({
      author: req.user._id,
      text: trimmedText,
      visibility: 'public',
      sharedPost: originalPost._id
    });

    await post.populate('author', 'name profilePhoto');
    await post.populate({
      path: 'sharedPost',
      populate: { path: 'author', select: 'name profilePhoto' }
    });

    // Notify original post author (skip self)
    if (originalPost.author.toString() !== req.user._id.toString()) {
      const notification = await Notification.create({
        recipient: originalPost.author,
        sender: req.user._id,
        type: 'reaction',
        relatedPost: originalPost._id
      });
      const { getIO } = require('../socket');
      getIO().to(`user:${originalPost.author}`).emit('newNotification', {
        ...notification.toObject(),
        sender: { _id: req.user._id, name: req.user.name, profilePhoto: req.user.profilePhoto }
      });
    }

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.toggleSavePost = async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    const postId = req.params.id;

    const index = user.savedPosts.findIndex((id) => id.toString() === postId.toString());
    if (index === -1) {
      user.savedPosts.push(postId);
    } else {
      user.savedPosts.splice(index, 1);
    }
    await user.save();

    res.json({ isSaved: index === -1, savedCount: user.savedPosts.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSavedPosts = async (req, res) => {
  try {
    const User = require('../models/User');
    // Only allow fetching own saved posts
    if (req.params.userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const user = await User.findById(req.user._id)
      .populate({
        path: 'savedPosts',
        populate: { path: 'author', select: 'name profilePhoto' },
      });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ posts: user.savedPosts });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMemories = async (req, res) => {
  try {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;

    const memories = await Post.aggregate([
      {
        $match: {
          author: req.user._id,
          $expr: {
            $and: [
              { $eq: [{ $dayOfMonth: '$createdAt' }, day] },
              { $eq: [{ $month: '$createdAt' }, month] },
            ],
          },
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: 50 },
    ]);

    await Post.populate(memories, { path: 'author', select: 'name profilePhoto' });

    res.json({ posts: memories });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTrendingPosts = async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 86400000);

    const posts = await Post.aggregate([
      { $match: { createdAt: { $gte: twentyFourHoursAgo }, visibility: 'public' } },
      {
        $lookup: {
          from: 'reactions',
          localField: '_id',
          foreignField: 'targetId',
          as: 'reactionsArr',
          pipeline: [{ $match: { targetType: 'Post' } }],
        },
      },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'post',
          as: 'commentsArr',
        },
      },
      {
        $addFields: {
          score: {
            $add: [
              { $size: '$reactionsArr' },
              { $multiply: [{ $size: '$commentsArr' }, 2] },
            ],
          },
        },
      },
      { $sort: { score: -1 } },
      { $limit: 30 },
    ]);

    await Post.populate(posts, [
      { path: 'author', select: 'name profilePhoto' },
    ]);

    res.json({ posts });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTrendingHashtags = async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 86400000);

    const hashtags = await Post.aggregate([
      { $match: { createdAt: { $gte: twentyFourHoursAgo } } },
      { $unwind: '$hashtags' },
      { $group: { _id: '$hashtags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    res.json({ hashtags });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.schedulePost = async (req, res) => {
  try {
    const { scheduledAt, visibility, content, media } = req.body;
    if (!scheduledAt) return res.status(400).json({ message: 'Scheduled time is required' });

    const scheduleDate = new Date(scheduledAt);
    if (scheduleDate <= new Date()) return res.status(400).json({ message: 'Scheduled time must be in the future' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });

    if (content) post.text = content;
    if (visibility) post.visibility = visibility;
    if (media) post.media = media;

    post.scheduledAt = scheduleDate;
    post.status = 'scheduled';
    post.isPublished = false;

    await post.save();
    res.json({ post, message: 'Post scheduled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPublicPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name profilePhoto')
      .populate('sharedPost');

    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.visibility !== 'public') {
      return res.status(403).json({ message: 'Post is not public' });
    }

    res.json({
      post: {
        ...post.toObject(),
        likeCount: post.reactions?.length || 0,
        commentCount: post.comments?.length || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
