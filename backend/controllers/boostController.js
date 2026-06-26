const Post = require('../models/Post');
const User = require('../models/User');
const { hasId } = require('../utils/id');

exports.boostPost = async (req, res) => {
  try {
    const { duration, budget } = req.body;
    const post = await Post.findById(req.params.postId);

    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const hours = parseInt(duration) || 24;
    post.isBoosted = true;
    post.boostEndsAt = new Date(Date.now() + hours * 3600000);
    await post.save();

    res.json({
      message: 'Post boosted successfully',
      boostEndsAt: post.boostEndsAt,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.unboostPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    post.isBoosted = false;
    post.boostEndsAt = null;
    await post.save();

    res.json({ message: 'Post unboosted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createSponsored = async (req, res) => {
  try {
    const { sponsorName, sponsorUrl } = req.body;
    const post = await Post.findById(req.params.postId);

    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    post.isSponsored = true;
    post.sponsorName = sponsorName || '';
    post.sponsorUrl = sponsorUrl || '';
    await post.save();

    res.json({ message: 'Sponsored content added', post });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getBoostedFeed = async (req, res) => {
  try {
    const boostedPosts = await Post.find({
      isBoosted: true,
      boostEndsAt: { $gt: new Date() },
      visibility: 'public',
    })
      .populate('author', 'name profilePhoto isCreator isVerified')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({ posts: boostedPosts });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.recordImpression = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (!post.analytics) post.analytics = {};
    post.analytics.impressions = (post.analytics.impressions || 0) + 1;
    if (!post.analytics.seenBy) post.analytics.seenBy = [];
    if (!hasId(post.analytics.seenBy, req.user._id)) {
      post.analytics.reach = (post.analytics.reach || 0) + 1;
      post.analytics.seenBy.push(req.user._id);
    }
    await post.save();

    res.json({ recorded: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.recordClick = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (!post.analytics) post.analytics = {};
    post.analytics.clicks = (post.analytics.clicks || 0) + 1;
    await post.save();

    res.json({ recorded: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
