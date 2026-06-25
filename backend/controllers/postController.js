const Post = require('../models/Post');
const Reaction = require('../models/Reaction');
const Comment = require('../models/Comment');
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
    const { text, feeling, taggedUsers, visibility, postedInType, postedInRefId } = req.body;

    if (!text && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ message: 'Post must have text or media' });
    }

    let media = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file =>
        uploadToCloudinary(file.buffer, 'jolshaa/posts')
      );
      media = await Promise.all(uploadPromises);
    }

    const tagged = taggedUsers ? JSON.parse(taggedUsers) : [];

    const postedIn = {
      type: postedInType || 'profile',
      refId: postedInRefId || null
    };

    const post = await Post.create({
      author: req.user._id,
      text: text || '',
      media,
      feeling: feeling || null,
      taggedUsers: tagged,
      visibility: visibility || 'public',
      postedIn
    });

    await post.populate('author', 'name profilePhoto');

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get user's groups and followed pages
    const Group = require('../models/Group');
    const Page = require('../models/Page');

    const userGroups = await Group.find({ members: req.user._id }).select('_id');
    const userPages = await Page.find({ followers: req.user._id }).select('_id');

    const groupIds = userGroups.map(g => g._id);
    const pageIds = userPages.map(p => p._id);

    const feedQuery = {
      $or: [
        { author: req.user._id },
        { visibility: 'public' },
        { 'postedIn.type': 'group', 'postedIn.refId': { $in: groupIds } },
        { 'postedIn.type': 'page', 'postedIn.refId': { $in: pageIds } }
      ]
    };

    const posts = await Post.find(feedQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name profilePhoto')
      .populate('taggedUsers', 'name profilePhoto');

    const total = await Post.countDocuments(feedQuery);

    const postIds = posts.map(p => p._id);

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

    const postsWithMeta = posts.map(post => ({
      ...post.toObject(),
      reactions: reactionMap[post._id.toString()] || { count: 0, myReaction: null },
      commentCount: commentMap[post._id.toString()] || 0
    }));

    res.json({
      posts: postsWithMeta,
      page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
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
    if (text !== undefined) post.text = text;
    if (feeling !== undefined) post.feeling = feeling;
    if (visibility !== undefined) post.visibility = visibility;
    post.isEdited = true;

    await post.save();
    await post.populate('author', 'name profilePhoto');

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.reactToPost = async (req, res) => {
  try {
    const { type } = req.body;
    const validTypes = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];

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

    res.json({ message: 'Reaction added', myReaction: type });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
