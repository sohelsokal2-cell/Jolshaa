const VideoAdRevenue = require('../models/VideoAdRevenue');
const Post = require('../models/Post');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const AD_REVENUE_PER_VIEW = 0.50; // BDT per monetized view
const CREATOR_SHARE_RATE = 0.55; // 55% to creator

// Check if video is eligible for in-stream ads
exports.checkAdEligibility = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).select('video author');
    if (!post || !post.video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const creator = await User.findById(post.author).select('monetization');
    const isCreatorApproved = creator?.monetization?.isCreator === true;
    const minDuration = (post.video.duration || 0) >= 60; // 1 minute
    const minViews = (post.video.views || 0) >= 1000;

    res.json({
      eligible: isCreatorApproved && minDuration && minViews,
      requirements: {
        isCreatorApproved,
        minDuration,
        minViews,
        duration: post.video.duration || 0,
        views: post.video.views || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Track an in-stream ad view (mid-roll ad shown during video playback)
exports.trackAdView = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).select('video author');
    if (!post || !post.video || !post.video.url) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const creator = await User.findById(post.author).select('monetization');
    if (!creator?.monetization?.isCreator) {
      return res.status(400).json({ message: 'Creator not monetized' });
    }

    // Find or create daily revenue record
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let revenueRecord = await VideoAdRevenue.findOne({
      video: post._id,
      creator: post.author,
      date: { $gte: today },
    });

    const estimatedRevenue = AD_REVENUE_PER_VIEW;
    const creatorShare = estimatedRevenue * CREATOR_SHARE_RATE;

    if (revenueRecord) {
      revenueRecord.views += 1;
      revenueRecord.monetizedViews += 1;
      revenueRecord.estimatedRevenue += estimatedRevenue;
      revenueRecord.creatorShare += creatorShare;
      await revenueRecord.save();
    } else {
      revenueRecord = await VideoAdRevenue.create({
        video: post._id,
        creator: post.author,
        views: 1,
        monetizedViews: 1,
        estimatedRevenue,
        creatorShare,
        date: today,
      });
    }

    // Add to creator's pending balance
    await User.findByIdAndUpdate(post.author, {
      $inc: { 'monetization.pendingBalance': creatorShare },
    });

    // Create earning transaction
    await Transaction.create({
      user: post.author,
      type: 'ad_revenue',
      amount: creatorShare,
      status: 'completed',
      paymentGateway: 'internal',
      relatedPost: post._id,
      description: `Ad revenue from video`,
    });

    res.json({
      success: true,
      estimatedRevenue,
      creatorShare,
    });
  } catch (error) {
    console.error('Track ad view error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get video ad revenue summary for creator
exports.getVideoRevenue = async (req, res) => {
  try {
    const revenue = await VideoAdRevenue.find({ creator: req.user._id })
      .populate('video', 'text thumbnailUrl')
      .sort({ date: -1 })
      .limit(30);

    const totals = await VideoAdRevenue.aggregate([
      { $match: { creator: req.user._id } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
          totalMonetizedViews: { $sum: '$monetizedViews' },
          totalRevenue: { $sum: '$estimatedRevenue' },
          totalCreatorShare: { $sum: '$creatorShare' },
        },
      },
    ]);

    res.json({
      revenue,
      totals: totals[0] || { totalViews: 0, totalMonetizedViews: 0, totalRevenue: 0, totalCreatorShare: 0 },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
