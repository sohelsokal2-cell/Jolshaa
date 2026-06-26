const Page = require('../models/Page');
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

exports.createPage = async (req, res) => {
  try {
    const { name, description, category } = req.body;

    if (!name) return res.status(400).json({ message: 'Page name is required' });
    if (!category) return res.status(400).json({ message: 'Category is required' });

    let profilePhoto = null;
    let coverPhoto = null;

    if (req.files) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer, 'jolshaa/pages');
        if (file.fieldname === 'profilePhoto') profilePhoto = url;
        if (file.fieldname === 'coverPhoto') coverPhoto = url;
      }
    }

    const page = await Page.create({
      name,
      description: description || '',
      category,
      profilePhoto,
      coverPhoto,
      creator: req.user._id,
      admins: [req.user._id],
      followers: [req.user._id]
    });

    await page.populate('creator', 'name profilePhoto');
    await page.populate('admins', 'name profilePhoto');

    res.status(201).json(page);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getPages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const search = req.query.search;
    const category = req.query.category;

    const query = {};
    if (search) query.$text = { $search: search };
    if (category) query.category = category;

    const pages = await Page.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('creator', 'name profilePhoto');

    const total = await Page.countDocuments(query);

    const pagesWithStatus = pages.map(pg => ({
      ...pg.toObject(),
      followerCount: pg.followers.length,
      isFollowing: pg.followers.some(f => f.toString() === req.user._id.toString()),
      isAdmin: pg.admins.some(a => a.toString() === req.user._id.toString())
    }));

    res.json({
      pages: pagesWithStatus,
      page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getPage = async (req, res) => {
  try {
    const pg = await Page.findById(req.params.id)
      .populate('creator', 'name profilePhoto')
      .populate('admins', 'name profilePhoto')
      .populate('featuredPost');

    if (!pg) return res.status(404).json({ message: 'Page not found' });

    const userId = req.user._id.toString();

    let featuredPostData = null;
    if (pg.featuredPost) {
      featuredPostData = pg.featuredPost.toObject();
      const [fReactions, fMyReaction, fComments] = await Promise.all([
        Reaction.aggregate([
          { $match: { targetType: 'Post', targetId: pg.featuredPost._id } },
          { $group: { _id: null, count: { $sum: 1 } } }
        ]),
        Reaction.findOne({ targetType: 'Post', targetId: pg.featuredPost._id, user: req.user._id }),
        Comment.countDocuments({ post: pg.featuredPost._id })
      ]);
      featuredPostData.reactions = {
        count: fReactions[0]?.count || 0,
        myReaction: fMyReaction?.type || null
      };
      featuredPostData.commentCount = fComments;
      const author = await require('../models/User').findById(pg.featuredPost.author).select('name profilePhoto');
      featuredPostData.author = author;
    }

    res.json({
      ...pg.toObject(),
      followerCount: pg.followers.length,
      isFollowing: pg.followers.some(f => f._id.toString() === userId),
      isAdmin: pg.admins.some(a => a._id.toString() === userId),
      isCreator: pg.creator._id.toString() === userId,
      featuredPost: featuredPostData
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updatePage = async (req, res) => {
  try {
    const pg = await Page.findById(req.params.id);
    if (!pg) return res.status(404).json({ message: 'Page not found' });

    const userId = req.user._id.toString();
    if (!pg.admins.some(a => a.toString() === userId)) {
      return res.status(403).json({ message: 'Only admins can update the page' });
    }

    const { name, description, category } = req.body;
    if (name !== undefined) pg.name = name;
    if (description !== undefined) pg.description = description;
    if (category !== undefined) pg.category = category;

    if (req.files) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer, 'jolshaa/pages');
        if (file.fieldname === 'profilePhoto') pg.profilePhoto = url;
        if (file.fieldname === 'coverPhoto') pg.coverPhoto = url;
      }
    }

    await pg.save();
    await pg.populate('creator', 'name profilePhoto');
    await pg.populate('admins', 'name profilePhoto');

    res.json(pg);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deletePage = async (req, res) => {
  try {
    const pg = await Page.findById(req.params.id);
    if (!pg) return res.status(404).json({ message: 'Page not found' });

    if (pg.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the creator can delete the page' });
    }

    await Post.deleteMany({ 'postedIn.type': 'page', 'postedIn.refId': pg._id });
    await Page.findByIdAndDelete(pg._id);

    res.json({ message: 'Page deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.followPage = async (req, res) => {
  try {
    const pg = await Page.findById(req.params.id);
    if (!pg) return res.status(404).json({ message: 'Page not found' });

    const userId = req.user._id.toString();
    const isFollowing = pg.followers.some(f => f.toString() === userId);

    if (isFollowing) {
      pg.followers = pg.followers.filter(f => f.toString() !== userId);
      await pg.save();
      return res.json({ message: 'Unfollowed page', isFollowing: false });
    }

    pg.followers.push(req.user._id);
    await pg.save();
    res.json({ message: 'Following page', isFollowing: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getPageFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({
      'postedIn.type': 'page',
      'postedIn.refId': req.params.id
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name profilePhoto')
      .populate('taggedUsers', 'name profilePhoto');

    const total = await Post.countDocuments({
      'postedIn.type': 'page',
      'postedIn.refId': req.params.id
    });

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

exports.createPagePost = async (req, res) => {
  try {
    const pg = await Page.findById(req.params.id);
    if (!pg) return res.status(404).json({ message: 'Page not found' });

    const userId = req.user._id.toString();
    if (!pg.admins.some(a => a.toString() === userId)) {
      return res.status(403).json({ message: 'Only admins can post on this page' });
    }

    const { text, feeling, taggedUsers } = req.body;

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

    const post = await Post.create({
      author: req.user._id,
      text: text || '',
      media,
      feeling: feeling || null,
      taggedUsers: tagged,
      visibility: 'public',
      postedIn: { type: 'page', refId: pg._id }
    });

    await post.populate('author', 'name profilePhoto');

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.featurePost = async (req, res) => {
  try {
    const pg = await Page.findById(req.params.id);
    if (!pg) return res.status(404).json({ message: 'Page not found' });

    if (!pg.admins.some(a => a.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Only admins can feature posts' });
    }

    const { postId } = req.params;
    if (pg.featuredPost && pg.featuredPost.toString() === postId) {
      pg.featuredPost = null;
      await pg.save();
      return res.json({ message: 'Post unfeatured', featuredPost: null });
    }

    pg.featuredPost = postId;
    await pg.save();
    res.json({ message: 'Post featured', featuredPost: postId });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getPageInsights = async (req, res) => {
  try {
    const pg = await Page.findById(req.params.id);
    if (!pg) return res.status(404).json({ message: 'Page not found' });

    if (!pg.admins.some(a => a.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Only admins can view insights' });
    }

    const posts = await Post.find({ 'postedIn.type': 'page', 'postedIn.refId': pg._id })
      .select('createdAt');

    const postIds = await Post.find({ 'postedIn.type': 'page', 'postedIn.refId': pg._id }).select('_id');

    const reactions = await Reaction.aggregate([
      { $match: { targetType: 'Post', targetId: { $in: postIds.map(p => p._id) } } },
      { $group: { _id: '$targetId', count: { $sum: 1 } } }
    ]);

    const commentCounts = await Comment.aggregate([
      { $match: { post: { $in: postIds.map(p => p._id) } } },
      { $group: { _id: '$post', count: { $sum: 1 } } }
    ]);

    const totalReactions = reactions.reduce((sum, r) => sum + r.count, 0);
    const totalComments = commentCounts.reduce((sum, c) => sum + c.count, 0);

    const followerGrowth = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStr = date.toISOString().split('T')[0];
      followerGrowth.push({ date: dayStr, count: pg.followers.length });
    }

    res.json({
      totalFollowers: pg.followers.length,
      totalPosts: posts.length,
      totalReactions,
      totalComments,
      avgReactionsPerPost: posts.length > 0 ? (totalReactions / posts.length).toFixed(1) : 0,
      avgCommentsPerPost: posts.length > 0 ? (totalComments / posts.length).toFixed(1) : 0,
      followerGrowth
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
