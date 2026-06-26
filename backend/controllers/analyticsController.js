const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Reaction = require('../models/Reaction');
const Story = require('../models/Story');
const Reel = require('../models/Reel');
const Report = require('../models/Report');
const AdminAction = require('../models/AdminAction');
const Ad = require('../models/Ad');
const Listing = require('../models/Listing');

// --- User Analytics ---

exports.getUserGrowth = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const signups = await User.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totalUsers = await User.countDocuments();
    const maleCount = await User.countDocuments({ gender: 'male' });
    const femaleCount = await User.countDocuments({ gender: 'female' });
    const verifiedCount = await User.countDocuments({ isVerified: true });
    const creatorCount = await User.countDocuments({ isCreator: true });
    const adminCount = await User.countDocuments({ isAdmin: true });

    res.json({ signups, totalUsers, maleCount, femaleCount, verifiedCount, creatorCount, adminCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getActiveUsers = async (req, res) => {
  try {
    const now = new Date();
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // DAU: users with login history in last 24h
    const dau = await User.countDocuments({
      'loginHistory.timestamp': { $gte: dayAgo },
    });

    // WAU: users with login history in last 7 days
    const wau = await User.countDocuments({
      'loginHistory.timestamp': { $gte: weekAgo },
    });

    // MAU: users with login history in last 30 days
    const mau = await User.countDocuments({
      'loginHistory.timestamp': { $gte: monthAgo },
    });

    // DAU trend over last 30 days
    const dauTrend = [];
    for (let i = parseInt(req.query.days || 30); i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const count = await User.countDocuments({
        'loginHistory.timestamp': { $gte: dayStart, $lt: dayEnd },
      });
      dauTrend.push({
        date: dayStart.toISOString().split('T')[0],
        count,
      });
    }

    // DAU/MAU ratio (stickiness)
    const stickiness = mau > 0 ? ((dau / mau) * 100).toFixed(1) : 0;

    res.json({ dau, wau, mau, stickiness, dauTrend });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getRetention = async (req, res) => {
  try {
    const now = new Date();

    // Cohort: users who signed up in each month
    const cohorts = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const cohortUsers = await User.find({ createdAt: { $gte: monthStart, $lte: monthEnd } }).select('_id');
      const cohortIds = cohortUsers.map(u => u._id);
      const cohortSize = cohortIds.length;

      if (cohortSize === 0) {
        cohorts.push({
          month: monthStart.toISOString().slice(0, 7),
          size: 0,
          retained: 0,
          retentionRate: 0,
        });
        continue;
      }

      // How many of these users logged in in the last 7 days
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
      const retained = await User.countDocuments({
        _id: { $in: cohortIds },
        'loginHistory.timestamp': { $gte: weekAgo },
      });

      cohorts.push({
        month: monthStart.toISOString().slice(0, 7),
        size: cohortSize,
        retained,
        retentionRate: cohortSize > 0 ? ((retained / cohortSize) * 100).toFixed(1) : 0,
      });
    }

    // Overall retention: % of all users who logged in last 7 days
    const totalUsers = await User.countDocuments();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const activeLastWeek = await User.countDocuments({
      'loginHistory.timestamp': { $gte: weekAgo },
    });
    const overallRetention = totalUsers > 0 ? ((activeLastWeek / totalUsers) * 100).toFixed(1) : 0;

    res.json({ cohorts, overallRetention, totalUsers, activeLastWeek });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Engagement Analytics ---

exports.getEngagementStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const totalPosts = await Post.countDocuments();
    const totalComments = await Comment.countDocuments();
    const totalReactions = await Reaction.countDocuments();
    const totalStories = await Story.countDocuments();
    const totalReels = await Reel.countDocuments();

    // New content in period
    const postsInPeriod = await Post.countDocuments({ createdAt: { $gte: since } });
    const commentsInPeriod = await Comment.countDocuments({ createdAt: { $gte: since } });
    const reactionsInPeriod = await Reaction.countDocuments({ createdAt: { $gte: since } });
    const storiesInPeriod = await Story.countDocuments({ createdAt: { $gte: since } });
    const reelsInPeriod = await Reel.countDocuments({ createdAt: { $gte: since } });

    // Reaction type breakdown
    const reactionBreakdown = await Reaction.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Posts with most engagement
    const topPosts = await Post.find({ createdAt: { $gte: since } })
      .populate('author', 'name profilePhoto')
      .sort({ 'analytics.engagement': -1 })
      .limit(10)
      .select('text media analytics author createdAt');

    // Average engagement per post
    const avgEngagement = await Post.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: null,
          avgReach: { $avg: '$analytics.reach' },
          avgImpressions: { $avg: '$analytics.impressions' },
          avgEngagement: { $avg: '$analytics.engagement' },
          avgClicks: { $avg: '$analytics.clicks' },
          avgShares: { $avg: '$analytics.shares' },
        },
      },
    ]);

    res.json({
      totalPosts, totalComments, totalReactions, totalStories, totalReels,
      postsInPeriod, commentsInPeriod, reactionsInPeriod, storiesInPeriod, reelsInPeriod,
      reactionBreakdown, topPosts,
      avgEngagement: avgEngagement[0] || { avgReach: 0, avgImpressions: 0, avgEngagement: 0, avgClicks: 0, avgShares: 0 },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getContentTrends = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    // Posts by type (profile, group, page)
    const postsByType = await Post.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$postedIn.type', count: { $sum: 1 } } },
    ]);

    // Posts by visibility
    const postsByVisibility = await Post.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$visibility', count: { $sum: 1 } } },
    ]);

    // Content created per day
    const postsPerDay = await Post.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const commentsPerDay = await Comment.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const reactionsPerDay = await Reaction.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Top hashtags
    const topHashtags = await Post.aggregate([
      { $match: { createdAt: { $gte: since }, hashtags: { $exists: true, $ne: [] } } },
      { $unwind: '$hashtags' },
      { $group: { _id: { $toLower: '$hashtags' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    res.json({
      postsByType, postsByVisibility,
      postsPerDay, commentsPerDay, reactionsPerDay,
      topHashtags,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Moderation Analytics ---

exports.getModerationStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    // Report volume by day
    const reportsPerDay = await Report.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Reports by reason
    const reportsByReason = await Report.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$reason', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Reports by status
    const reportsByStatus = await Report.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Reports by priority
    const reportsByPriority = await Report.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    // Resolution breakdown
    const resolutionBreakdown = await Report.aggregate([
      { $match: { resolution: { $ne: 'none' } } },
      { $group: { _id: '$resolution', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Average resolution time (hours)
    const resolutionTime = await Report.aggregate([
      { $match: { resolvedAt: { $ne: null }, createdAt: { $gte: since } } },
      {
        $project: {
          diff: { $subtract: ['$resolvedAt', '$createdAt'] },
        },
      },
      {
        $group: {
          _id: null,
          avgMs: { $avg: '$diff' },
        },
      },
    ]);

    // Flagged content counts
    const flaggedPosts = await Post.countDocuments({ isFlagged: true });
    const flaggedComments = await Comment.countDocuments({ isFlagged: true });
    const flaggedStories = await Story.countDocuments({ isFlagged: true });

    // Escalation stats
    const escalated = await Report.countDocuments({ status: 'escalated' });
    const avgEscalation = await Report.aggregate([
      { $match: { escalationLevel: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: '$escalationLevel' } } },
    ]);

    res.json({
      reportsPerDay, reportsByReason, reportsByStatus, reportsByPriority,
      resolutionBreakdown,
      avgResolutionHours: resolutionTime[0] ? (resolutionTime[0].avgMs / 3600000).toFixed(1) : 0,
      flaggedPosts, flaggedComments, flaggedStories,
      escalated, avgEscalationLevel: avgEscalation[0]?.avg?.toFixed(1) || 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getModeratorPerformance = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    // Actions by admin/moderator
    const actionsByAdmin = await AdminAction.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: '$admin',
          totalActions: { $sum: 1 },
          reportActions: {
            $sum: { $cond: [{ $regexMatch: { input: '$action', regex: /^report\./ } }, 1, 0] },
          },
          userActions: {
            $sum: { $cond: [{ $regexMatch: { input: '$action', regex: /^user\./ } }, 1, 0] },
          },
          moderationActions: {
            $sum: { $cond: [{ $regexMatch: { input: '$action', regex: /^(post|comment|story|reel|listing)\./ } }, 1, 0] },
          },
        },
      },
      { $sort: { totalActions: -1 } },
    ]);

    // Populate admin info
    const populated = await AdminAction.populate(actionsByAdmin, { path: '_id', model: 'User', select: 'name profilePhoto role' });

    // Reports resolved per moderator
    const reportsResolved = await Report.aggregate([
      { $match: { resolvedBy: { $ne: null }, resolvedAt: { $gte: since } } },
      { $group: { _id: '$resolvedBy', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const populatedResolved = await Report.populate(reportsResolved, { path: '_id', model: 'User', select: 'name profilePhoto' });

    // Reports assigned per moderator
    const reportsAssigned = await Report.aggregate([
      { $match: { assignedTo: { $ne: null } } },
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const populatedAssigned = await Report.populate(reportsAssigned, { path: '_id', model: 'User', select: 'name profilePhoto' });

    // Actions per day
    const actionsPerDay = await AdminAction.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Action type breakdown
    const actionTypes = await AdminAction.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      actionsByAdmin: populated,
      reportsResolved: populatedResolved,
      reportsAssigned: populatedAssigned,
      actionsPerDay, actionTypes,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Revenue / Monetization Analytics ---

exports.getRevenueStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    // Ad stats
    const totalAds = await Ad.countDocuments();
    const activeAds = await Ad.countDocuments({ status: 'active' });
    const totalAdBudget = await Ad.aggregate([
      { $group: { _id: null, total: { $sum: '$budget' } } },
    ]);
    const totalAdSpent = await Ad.aggregate([
      { $group: { _id: null, total: { $sum: '$spent' } } },
    ]);
    const totalImpressions = await Ad.aggregate([
      { $group: { _id: null, total: { $sum: '$impressions' } } },
    ]);
    const totalClicks = await Ad.aggregate([
      { $group: { _id: null, total: { $sum: '$clicks' } } },
    ]);

    // Ad performance over time (spent per day)
    const adSpendPerDay = await Ad.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, spent: { $sum: '$spent' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Creator economy
    const creatorCount = await User.countDocuments({ isCreator: true });
    const creatorCategories = await User.aggregate([
      { $match: { isCreator: true, creatorCategory: { $ne: '' } } },
      { $group: { _id: '$creatorCategory', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const totalSubscribers = await User.aggregate([
      { $match: { isCreator: true } },
      { $project: { subCount: { $size: { $ifNull: ['$subscribers', []] } } } },
      { $group: { _id: null, total: { $sum: '$subCount' } } },
    ]);

    // Boosted posts
    const boostedPosts = await Post.countDocuments({ isBoosted: true });
    const sponsoredPosts = await Post.countDocuments({ isSponsored: true });

    // Listings
    const totalListings = await Listing.countDocuments();

    // CTR (click-through rate)
    const ctr = totalImpressions[0]?.total > 0
      ? ((totalClicks[0]?.total / totalImpressions[0]?.total) * 100).toFixed(2)
      : 0;

    res.json({
      totalAds, activeAds,
      totalAdBudget: totalAdBudget[0]?.total || 0,
      totalAdSpent: totalAdSpent[0]?.total || 0,
      totalImpressions: totalImpressions[0]?.total || 0,
      totalClicks: totalClicks[0]?.total || 0,
      ctr,
      adSpendPerDay,
      creatorCount, creatorCategories,
      totalSubscribers: totalSubscribers[0]?.total || 0,
      boostedPosts, sponsoredPosts,
      totalListings,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Overview / Dashboard ---

exports.getAnalyticsOverview = async (req, res) => {
  try {
    const now = new Date();
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const totalUsers = await User.countDocuments();
    const newUsersToday = await User.countDocuments({ createdAt: { $gte: dayAgo } });
    const newUsersWeek = await User.countDocuments({ createdAt: { $gte: weekAgo } });
    const dau = await User.countDocuments({ 'loginHistory.timestamp': { $gte: dayAgo } });
    const mau = await User.countDocuments({ 'loginHistory.timestamp': { $gte: monthAgo } });

    const postsToday = await Post.countDocuments({ createdAt: { $gte: dayAgo } });
    const postsWeek = await Post.countDocuments({ createdAt: { $gte: weekAgo } });
    const totalPosts = await Post.countDocuments();
    const totalComments = await Comment.countDocuments();
    const totalReactions = await Reaction.countDocuments();

    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const escalatedReports = await Report.countDocuments({ status: 'escalated' });
    const resolvedToday = await Report.countDocuments({ status: 'resolved', resolvedAt: { $gte: dayAgo } });

    const adRevenue = await Ad.aggregate([
      { $group: { _id: null, total: { $sum: '$spent' } } },
    ]);

    res.json({
      totalUsers, newUsersToday, newUsersWeek, dau, mau,
      totalPosts, postsToday, postsWeek, totalComments, totalReactions,
      pendingReports, escalatedReports, resolvedToday,
      adRevenue: adRevenue[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
