const User = require('../models/User');
const Post = require('../models/Post');
const Transaction = require('../models/Transaction');
const VideoAdRevenue = require('../models/VideoAdRevenue');
const Subscription = require('../models/Subscription');
const { getIO } = require('../socket');
const Notification = require('../models/Notification');

// ========== ELIGIBILITY & APPLICATION ==========

// Check eligibility status
exports.getEligibility = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('monetization followers createdAt');

    const followerCount = user.followers?.length || 0;
    const postCount = await Post.countDocuments({ author: req.user._id });
    const accountAgeDays = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));

    const meetsRequirements = followerCount >= 1000 && postCount >= 5 && accountAgeDays >= 30;

    res.json({
      followerCount,
      postCount,
      accountAgeDays,
      meetsRequirements,
      requirements: {
        followers: { current: followerCount, required: 1000, met: followerCount >= 1000 },
        posts: { current: postCount, required: 5, met: postCount >= 5 },
        accountAge: { current: accountAgeDays, required: 30, met: accountAgeDays >= 30 },
      },
      verificationStatus: user.monetization?.verificationStatus || 'not_applied',
      isCreator: user.monetization?.isCreator || false,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Apply for monetization
exports.applyForMonetization = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.monetization?.isCreator) {
      return res.status(400).json({ message: 'Already a monetized creator' });
    }

    if (user.monetization?.verificationStatus === 'pending') {
      return res.status(400).json({ message: 'Application already pending' });
    }

    // 30-day cooldown after rejection
    if (user.monetization?.verificationStatus === 'rejected' && user.monetization?.appliedAt) {
      const daysSinceRejection = Math.floor((Date.now() - new Date(user.monetization.appliedAt).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceRejection < 30) {
        return res.status(400).json({
          message: `You can reapply after ${30 - daysSinceRejection} days`,
        });
      }
    }

    // Check requirements
    const followerCount = user.followers?.length || 0;
    const postCount = await Post.countDocuments({ author: req.user._id });
    const accountAgeDays = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));

    if (followerCount < 1000) {
      return res.status(400).json({ message: 'Minimum 1000 followers required' });
    }
    if (postCount < 5) {
      return res.status(400).json({ message: 'Minimum 5 posts required' });
    }
    if (accountAgeDays < 30) {
      return res.status(400).json({ message: 'Account must be at least 30 days old' });
    }

    // Check for policy violations
    if (user.isBanned || user.isSuspended) {
      return res.status(400).json({ message: 'Account is not in good standing' });
    }

    const { nidNumber, tinNumber } = req.body;

    user.monetization = {
      ...user.monetization,
      verificationStatus: 'pending',
      appliedAt: new Date(),
      taxInfo: {
        nidNumber: nidNumber || '',
        tinNumber: tinNumber || '',
      },
    };
    await user.save();

    // Notify admins
    const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } }).select('_id');
    for (const admin of admins) {
      await Notification.create({
        recipient: admin._id,
        sender: req.user._id,
        type: 'system',
        message: `New monetization application from ${user.name}`,
      });
      getIO().to(`user:${admin._id}`).emit('newNotification', {
        sender: { _id: req.user._id, name: user.name, profilePhoto: user.profilePhoto },
        type: 'system',
        message: `New monetization application from ${user.name}`,
      });
    }

    res.json({ message: 'Application submitted. You will be notified once reviewed.' });
  } catch (error) {
    console.error('Apply monetization error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== ADMIN: APPROVE / REJECT ==========

exports.approveCreator = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.monetization = {
      ...user.monetization,
      isCreator: true,
      isEligible: true,
      verificationStatus: 'approved',
      approvedAt: new Date(),
    };
    await user.save();

    // Notify user
    await Notification.create({
      recipient: user._id,
      sender: req.user._id,
      type: 'system',
      message: 'Congratulations! Your creator application has been approved.',
    });

    getIO().to(`user:${user._id}`).emit('newNotification', {
      sender: { _id: req.user._id, name: 'Jolshaa Admin' },
      type: 'system',
      message: 'Congratulations! Your creator application has been approved.',
    });

    res.json({ message: 'Creator approved' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.rejectCreator = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.monetization = {
      ...user.monetization,
      verificationStatus: 'rejected',
      rejectionReason: reason || 'Application does not meet requirements',
    };
    await user.save();

    // Notify user
    await Notification.create({
      recipient: user._id,
      sender: req.user._id,
      type: 'system',
      message: `Your creator application was not approved. ${reason || ''}`,
    });

    getIO().to(`user:${user._id}`).emit('newNotification', {
      sender: { _id: req.user._id, name: 'Jolshaa Admin' },
      type: 'system',
      message: `Your creator application was not approved. ${reason || ''}`,
    });

    res.json({ message: 'Creator application rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPendingApplications = async (req, res) => {
  try {
    const applications = await User.find({
      'monetization.verificationStatus': 'pending',
    })
      .select('name email profilePhoto followers createdAt monetization')
      .sort({ 'monetization.appliedAt': -1 });

    res.json({ applications });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== EARNINGS DASHBOARD ==========

exports.getEarningsDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const [user, adRevenue, subscriptionRevenue, starRevenue, monthlyData] = await Promise.all([
      User.findById(userId).select('monetization'),
      // Ad revenue from videos
      VideoAdRevenue.aggregate([
        { $match: { creator: userId } },
        { $group: { _id: null, total: { $sum: '$creatorShare' }, views: { $sum: '$monetizedViews' } } },
      ]),
      // Subscription earnings
      Transaction.aggregate([
        { $match: { user: userId, type: 'subscription_earning', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Star gift earnings
      Transaction.aggregate([
        { $match: { user: userId, type: 'star_gift_received', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Last 30 days daily breakdown
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            status: 'completed',
            type: { $in: ['subscription_earning', 'star_gift_received', 'ad_revenue'] },
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            earnings: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const totalAdRevenue = adRevenue[0]?.total || 0;
    const totalSubRevenue = subscriptionRevenue[0]?.total || 0;
    const totalStarRevenue = starRevenue[0]?.total || 0;
    const totalEarnings = totalAdRevenue + totalSubRevenue + totalStarRevenue;

    res.json({
      totalEarnings,
      availableBalance: user.monetization?.availableBalance || 0,
      pendingBalance: user.monetization?.pendingBalance || 0,
      breakdown: {
        adRevenue: totalAdRevenue,
        subscriptionRevenue: totalSubRevenue,
        starRevenue: totalStarRevenue,
      },
      chartData: monthlyData,
    });
  } catch (error) {
    console.error('Earnings dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== FOLLOW / UNFOLLOW ==========

exports.toggleFollow = async (req, res) => {
  try {
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    const currentUser = await User.findById(req.user._id);
    const isFollowing = currentUser.following.some((id) => id.toString() === req.params.userId);

    if (isFollowing) {
      currentUser.following.pull(req.params.userId);
      targetUser.followers.pull(req.user._id);
    } else {
      currentUser.following.push(req.params.userId);
      targetUser.followers.push(req.user._id);

      // Notify target user
      const notification = await Notification.create({
        recipient: req.params.userId,
        sender: req.user._id,
        type: 'follow',
        message: `${currentUser.name} started following you`,
      });

      getIO().to(`user:${req.params.userId}`).emit('newNotification', {
        ...notification.toObject(),
        sender: { _id: currentUser._id, name: currentUser.name, profilePhoto: currentUser.profilePhoto },
      });
    }

    // Update follower count on monetization if creator
    if (targetUser.monetization?.isCreator) {
      targetUser.monetization.followerCount = targetUser.followers.length;
    }

    await currentUser.save();
    await targetUser.save();

    res.json({
      isFollowing: !isFollowing,
      followerCount: targetUser.followers.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('followers', 'name profilePhoto monetization.isCreator badges');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ followers: user.followers });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('following', 'name profilePhoto monetization.isCreator badges');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ following: user.following });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== POST ANALYTICS ==========

exports.getPostAnalytics = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({
      reach: post.analytics?.reach || 0,
      impressions: post.analytics?.impressions || 0,
      engagement: post.analytics?.engagement || 0,
      clicks: post.analytics?.clicks || 0,
      shares: post.analytics?.shares || 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== CREATOR DASHBOARD ==========

exports.getCreatorDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.monetization?.isCreator) {
      return res.status(400).json({ message: 'Not a creator account' });
    }

    const posts = await Post.find({ author: req.user._id }).sort({ createdAt: -1 });

    let totalReach = 0;
    let totalImpressions = 0;
    let totalEngagement = 0;

    posts.forEach((post) => {
      totalReach += post.analytics?.reach || 0;
      totalImpressions += post.analytics?.impressions || 0;
      totalEngagement += post.analytics?.engagement || 0;
    });

    const topPosts = posts
      .sort((a, b) => (b.analytics?.engagement || 0) - (a.analytics?.engagement || 0))
      .slice(0, 5)
      .map((p) => ({
        _id: p._id,
        text: p.text?.substring(0, 100),
        media: p.media?.[0],
        reach: p.analytics?.reach || 0,
        engagement: p.analytics?.engagement || 0,
        createdAt: p.createdAt,
      }));

    res.json({
      stats: {
        followerCount: user.followers.length,
        totalPosts: posts.length,
        totalReach,
        totalImpressions,
        totalEngagement,
        avgEngagementRate: posts.length > 0 ? Math.round(totalEngagement / posts.length) : 0,
      },
      topPosts,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== TOGGLE FEATURES ==========

exports.toggleTips = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.tipsEnabled = !user.tipsEnabled;
    await user.save();
    res.json({ tipsEnabled: user.tipsEnabled });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTipHistory = async (req, res) => {
  try {
    const tips = await Transaction.find({
      user: req.user._id,
      type: { $in: ['star_gift_sent', 'star_gift_received'] },
    })
      .populate('relatedUser', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ tips });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
