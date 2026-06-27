const Topic = require('../models/Topic');
const Hashtag = require('../models/Hashtag');
const PinnedContent = require('../models/PinnedContent');
const FeaturedContent = require('../models/FeaturedContent');
const ContentApproval = require('../models/ContentApproval');
const Post = require('../models/Post');
const Ad = require('../models/Ad');
const Page = require('../models/Page');
const Group = require('../models/Group');
const User = require('../models/User');
const AdminAction = require('../models/AdminAction');
const mongoose = require('mongoose');

const logAction = async (admin, action, details = {}) => {
  try {
    await AdminAction.create({ admin, action, targetType: 'Content', targetId: null, targetName: 'content', details });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};

// ============================================================
// TRENDING TOPIC CONTROL
// ============================================================

exports.getTrendingTopics = async (req, res) => {
  try {
    const topics = await Topic.find({ isActive: true })
      .sort({ trendingScore: -1, postCount: -1 })
      .limit(30)
      .lean();
    res.json({ topics });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateTrendingScore = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { trendingScore, isTrending } = req.body;

    const topic = await Topic.findByIdAndUpdate(topicId, {
      trendingScore: trendingScore ?? undefined,
      isTrending: isTrending ?? undefined,
    }, { new: true });

    res.json({ topic });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.recalculateTrending = async (req, res) => {
  try {
    // Recalculate trending scores based on recent post activity
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const topicActivity = await Post.aggregate([
      { $match: { createdAt: { $gte: oneDayAgo }, topics: { $exists: true, $ne: [] } } },
      { $unwind: '$topics' },
      { $group: { _id: '$topics', postCount: { $sum: 1 }, totalReactions: { $sum: { $size: '$reactions' } } } },
      { $project: { _id: 1, postCount: 1, totalReactions: 1, score: { $add: ['$postCount', { $multiply: ['$totalReactions', 3] }] } } },
      { $sort: { score: -1 } },
      { $limit: 50 },
    ]);

    // Update topics
    for (const activity of topicActivity) {
      await Topic.findOneAndUpdate(
        { name: activity._id },
        { trendingScore: activity.score, isTrending: activity.score > 5 },
        { upsert: true }
      );
    }

    // Reset topics not in trending
    await Topic.updateMany(
      { name: { $nin: topicActivity.map(a => a._id) } },
      { trendingScore: 0, isTrending: false }
    );

    await logAction(req.user._id, 'content.trending.recalculate');
    res.json({ message: 'Trending recalculated', topicsUpdated: topicActivity.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// HASHTAG MANAGEMENT
// ============================================================

exports.getHashtags = async (req, res) => {
  try {
    const { sort = 'postCount', limit = 50 } = req.query;
    const hashtags = await Hashtag.find()
      .sort({ [sort]: -1 })
      .limit(parseInt(limit))
      .lean();
    res.json({ hashtags });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateHashtag = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, isBanned, postCount } = req.body;
    const update = {};
    if (description !== undefined) update.description = description;
    if (isBanned !== undefined) update.isBanned = isBanned;
    if (postCount !== undefined) update.postCount = postCount;

    const hashtag = await Hashtag.findByIdAndUpdate(id, update, { new: true });
    res.json({ hashtag });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteHashtag = async (req, res) => {
  try {
    await Hashtag.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.syncHashtagCounts = async (req, res) => {
  try {
    // Recalculate postCount for all hashtags from actual posts
    const counts = await Post.aggregate([
      { $unwind: '$hashtags' },
      { $group: { _id: { $toLower: '$hashtags' }, count: { $sum: 1 } } },
    ]);

    for (const c of counts) {
      await Hashtag.findOneAndUpdate(
        { name: c._id },
        { postCount: c.count },
        { upsert: true }
      );
    }

    // Set count to 0 for hashtags not in any post
    const activeNames = counts.map(c => c._id);
    await Hashtag.updateMany(
      { name: { $nin: activeNames } },
      { postCount: 0 }
    );

    await logAction(req.user._id, 'content.hashtag.sync');
    res.json({ message: 'Hashtag counts synced', hashtags: counts.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// TOPIC / CATEGORY MANAGEMENT
// ============================================================

exports.getTopics = async (req, res) => {
  try {
    const topics = await Topic.find().sort({ order: 1, name: 1 }).lean();
    res.json({ topics });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createTopic = async (req, res) => {
  try {
    const { name, displayName, description, icon, keywords, order } = req.body;
    const topic = await Topic.create({
      name, displayName, description, icon, keywords, order,
      createdBy: req.user._id,
    });
    await logAction(req.user._id, 'content.topic.create', { topic: name });
    res.status(201).json({ topic });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'Topic already exists' });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const { displayName, description, icon, keywords, isActive, order, coverImage } = req.body;
    const update = {};
    if (displayName !== undefined) update.displayName = displayName;
    if (description !== undefined) update.description = description;
    if (icon !== undefined) update.icon = icon;
    if (coverImage !== undefined) update.coverImage = coverImage;
    if (keywords !== undefined) update.keywords = keywords;
    if (isActive !== undefined) update.isActive = isActive;
    if (order !== undefined) update.order = order;

    const topic = await Topic.findByIdAndUpdate(id, update, { new: true });
    res.json({ topic });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteTopic = async (req, res) => {
  try {
    await Topic.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.reorderTopics = async (req, res) => {
  try {
    const { orders } = req.body;
    const ops = orders.map(({ id, order }) => Topic.findByIdAndUpdate(id, { order }));
    await Promise.all(ops);
    res.json({ message: 'Reordered' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// PINNED POST MANAGEMENT
// ============================================================

exports.getPinnedPosts = async (req, res) => {
  try {
    const { scope } = req.query;
    const query = { isActive: true };
    if (scope) query.scope = scope;

    const pinned = await PinnedContent.find(query)
      .populate('post', 'text author createdAt')
      .populate('post.author', 'name profilePhoto')
      .populate('pinnedBy', 'name')
      .sort({ order: 1, createdAt: -1 })
      .lean();

    res.json({ pinned });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.pinPost = async (req, res) => {
  try {
    const { postId, scope, targetId, reason, expiresAt } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Check if already pinned in this scope
    const existing = await PinnedContent.findOne({
      post: postId, scope: scope || 'global', targetId: targetId || null, isActive: true,
    });
    if (existing) return res.status(400).json({ message: 'Post already pinned in this scope' });

    const pinned = await PinnedContent.create({
      post: postId,
      pinnedBy: req.user._id,
      scope: scope || 'global',
      targetId: targetId || null,
      scopeModel: scope === 'group' ? 'Group' : scope === 'page' ? 'Page' : scope === 'profile' ? 'User' : null,
      reason,
      expiresAt: expiresAt || null,
    });

    // Update post isPinned
    await Post.findByIdAndUpdate(postId, { isPinned: true });

    await logAction(req.user._id, 'content.pin', { postId, scope });
    res.status(201).json({ pinned });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.unpinPost = async (req, res) => {
  try {
    const { id } = req.params;
    const pinned = await PinnedContent.findById(id);
    if (!pinned) return res.status(404).json({ message: 'Not found' });

    pinned.isActive = false;
    await pinned.save();

    // Check if post has other active pins
    const otherPins = await PinnedContent.countDocuments({ post: pinned.post, isActive: true, _id: { $ne: id } });
    if (otherPins === 0) {
      await Post.findByIdAndUpdate(pinned.post, { isPinned: false });
    }

    await logAction(req.user._id, 'content.unpin', { pinnedId: id });
    res.json({ message: 'Unpinned' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// SPONSORED POST REVIEW
// ============================================================

exports.getSponsoredPosts = async (req, res) => {
  try {
    const { status, page = 1, limit = 30 } = req.query;
    const query = {};
    if (status) query.status = status;

    const total = await Ad.countDocuments(query);
    const ads = await Ad.find(query)
      .populate('advertiser', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    res.json({ ads, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.reviewAd = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const ad = await Ad.findByIdAndUpdate(id, {
      status,
      ...(adminNote ? { adminNote } : {}),
    }, { new: true }).populate('advertiser', 'name email');

    // Create approval record
    await ContentApproval.findOneAndUpdate(
      { targetType: 'Ad', targetId: id, status: 'pending' },
      {
        status: status === 'active' ? 'approved' : 'rejected',
        adminNote,
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      },
      { upsert: true }
    );

    await logAction(req.user._id, 'content.ad.review', { adId: id, status });
    res.json({ ad });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getBoostedPosts = async (req, res) => {
  try {
    const boosted = await Post.find({ isBoosted: true })
      .populate('author', 'name profilePhoto')
      .sort({ boostEndsAt: -1 })
      .limit(50)
      .lean();

    res.json({ boosted });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.reviewBoost = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    if (action === 'reject') {
      await Post.findByIdAndUpdate(id, { isBoosted: false, boostEndsAt: null });
    }

    await logAction(req.user._id, 'content.boost.review', { postId: id, action });
    res.json({ message: `Boost ${action}d` });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// FEATURED CONTENT CONTROL
// ============================================================

exports.getFeaturedContent = async (req, res) => {
  try {
    const { category, isActive } = req.query;
    const query = {};
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const featured = await FeaturedContent.find(query)
      .populate('post', 'text author media createdAt')
      .populate('post.author', 'name profilePhoto')
      .populate('curatedBy', 'name')
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    res.json({ featured });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addFeaturedContent = async (req, res) => {
  try {
    const { postId, category, title, description, priority, expiresAt } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const featured = await FeaturedContent.create({
      post: postId,
      curatedBy: req.user._id,
      category: category || 'editor_pick',
      title,
      description,
      priority: priority || 0,
      expiresAt: expiresAt || null,
    });

    await logAction(req.user._id, 'content.feature.add', { postId, category });
    res.status(201).json({ featured });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateFeaturedContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, title, description, priority, isActive, expiresAt } = req.body;
    const update = {};
    if (category !== undefined) update.category = category;
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (priority !== undefined) update.priority = priority;
    if (isActive !== undefined) update.isActive = isActive;
    if (expiresAt !== undefined) update.expiresAt = expiresAt;

    const featured = await FeaturedContent.findByIdAndUpdate(id, update, { new: true });
    res.json({ featured });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeFeaturedContent = async (req, res) => {
  try {
    await FeaturedContent.findByIdAndDelete(req.params.id);
    res.json({ message: 'Removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// PAGES / GROUPS APPROVAL
// ============================================================

exports.getPendingApprovals = async (req, res) => {
  try {
    const { type } = req.query;
    const query = { status: 'pending' };
    if (type) query.type = type;

    const approvals = await ContentApproval.find(query)
      .populate('submittedBy', 'name email')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Enrich with target data
    for (const approval of approvals) {
      if (approval.targetType === 'Page') {
        approval.target = await Page.findById(approval.targetId).select('name category isVerified').lean();
      } else if (approval.targetType === 'Group') {
        approval.target = await Group.findById(approval.targetId).select('name privacy memberCount').lean();
      } else if (approval.targetType === 'Ad') {
        approval.target = await Ad.findById(approval.targetId).select('title status budget').lean();
      }
    }

    res.json({ approvals });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.handleApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const approval = await ContentApproval.findByIdAndUpdate(id, {
      status,
      adminNote,
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
    }, { new: true });

    // Apply the approval action
    if (approval.targetType === 'Page' && status === 'approved') {
      await Page.findByIdAndUpdate(approval.targetId, { isVerified: true });
    } else if (approval.targetType === 'Page' && status === 'rejected') {
      await Page.findByIdAndUpdate(approval.targetId, { isVerified: false });
    } else if (approval.targetType === 'Group' && status === 'approved') {
      await Group.findByIdAndUpdate(approval.targetId, { isApproved: true });
    } else if (approval.targetType === 'Ad' && status === 'approved') {
      await Ad.findByIdAndUpdate(approval.targetId, { status: 'active' });
    } else if (approval.targetType === 'Ad' && status === 'rejected') {
      await Ad.findByIdAndUpdate(approval.targetId, { status: 'rejected' });
    }

    await logAction(req.user._id, 'content.approval.handle', { approvalId: id, status, type: approval.type });
    res.json({ approval });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.submitForApproval = async (req, res) => {
  try {
    const { type, targetType, targetId, metadata } = req.body;

    const existing = await ContentApproval.findOne({
      targetType, targetId, status: { $in: ['pending', 'needs_info'] },
    });
    if (existing) return res.status(400).json({ message: 'Already submitted for approval' });

    const approval = await ContentApproval.create({
      type,
      targetType,
      targetId,
      submittedBy: req.user._id,
      metadata,
    });

    res.status(201).json({ approval });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPageVerificationQueue = async (req, res) => {
  try {
    const pages = await Page.find({ isVerified: false })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Check for existing approval requests
    for (const page of pages) {
      page.approvalRequest = await ContentApproval.findOne({
        targetType: 'Page', targetId: page._id, status: 'pending',
      }).lean();
    }

    res.json({ pages });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getGroupApprovalQueue = async (req, res) => {
  try {
    const groups = await Group.find({ isApproved: { $ne: true } })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ groups });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// RECOMMENDATIONS TUNING
// ============================================================

exports.getRecommendationConfig = async (req, res) => {
  try {
    // Return current recommendation weights
    const config = {
      feedRanker: {
        friendBonus: 30,
        followingBonus: 20,
        reactionWeight: 3,
        commentWeight: 5,
        shareWeight: 4,
        mediaBonus: 5,
        boostedBonus: 50,
        announcementBonus: 25,
        recencyHalfLifeHours: 6,
        randomFactor: 2,
      },
      contentPreferences: {
        minTextLength: 10,
        mediaPreferred: true,
        trendingBoost: 1.5,
      },
    };

    res.json({ config });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateRecommendationConfig = async (req, res) => {
  try {
    const { feedRanker, contentPreferences } = req.body;

    // In a real app, save to SystemSetting or a dedicated config
    // For now, just log and return
    await logAction(req.user._id, 'content.recommendations.update', {
      feedRanker,
      contentPreferences,
    });

    res.json({ message: 'Recommendation config updated', config: { feedRanker, contentPreferences } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getRecommendationStats = async (req, res) => {
  try {
    const [totalPosts, boostedPosts, sponsoredPosts, featuredPosts, totalTopics, activeTopics] = await Promise.all([
      Post.countDocuments(),
      Post.countDocuments({ isBoosted: true }),
      Post.countDocuments({ isSponsored: true }),
      FeaturedContent.countDocuments({ isActive: true }),
      Topic.countDocuments(),
      Topic.countDocuments({ isActive: true }),
    ]);

    const topHashtags = await Hashtag.find().sort({ postCount: -1 }).limit(10).select('name postCount').lean();
    const topTopics = await Topic.find({ isActive: true }).sort({ trendingScore: -1 }).limit(10).select('name displayName trendingScore postCount').lean();

    res.json({
      totalPosts, boostedPosts, sponsoredPosts, featuredPosts,
      totalTopics, activeTopics,
      topHashtags, topTopics,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// CONTENT TOOLS DASHBOARD
// ============================================================

exports.getContentDashboard = async (req, res) => {
  try {
    const [
      totalHashtags, trendingTopics, pinnedPosts, featuredContent,
      pendingApprovals, activeBoosts, activeAds, totalPosts,
    ] = await Promise.all([
      Hashtag.countDocuments(),
      Topic.countDocuments({ isTrending: true }),
      PinnedContent.countDocuments({ isActive: true }),
      FeaturedContent.countDocuments({ isActive: true }),
      ContentApproval.countDocuments({ status: 'pending' }),
      Post.countDocuments({ isBoosted: true, boostEndsAt: { $gt: new Date() } }),
      Ad.countDocuments({ status: 'active' }),
      Post.countDocuments(),
    ]);

    const recentHashtags = await Hashtag.find().sort({ postCount: -1 }).limit(5).select('name postCount').lean();
    const recentTopics = await Topic.find({ isActive: true }).sort({ trendingScore: -1 }).limit(5).select('name displayName trendingScore').lean();

    res.json({
      totalHashtags, trendingTopics, pinnedPosts, featuredContent,
      pendingApprovals, activeBoosts, activeAds, totalPosts,
      recentHashtags, recentTopics,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
