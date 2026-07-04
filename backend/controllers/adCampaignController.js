const AdCampaign = require('../models/AdCampaign');
const Post = require('../models/Post');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { getIO } = require('../socket');

// ========== CREATE CAMPAIGN ==========

exports.createCampaign = async (req, res) => {
  try {
    const { postId, budget, dailyBudget, startDate, endDate, targetAudience } = req.body;

    if (!postId || !budget || !dailyBudget || !startDate || !endDate) {
      return res.status(400).json({ message: 'Post, budget, daily budget, and duration are required' });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Can only boost your own posts' });
    }

    if (budget < 100) {
      return res.status(400).json({ message: 'Minimum budget is 100 BDT' });
    }

    if (dailyBudget > budget) {
      return res.status(400).json({ message: 'Daily budget cannot exceed total budget' });
    }

    const campaign = await AdCampaign.create({
      advertiser: req.user._id,
      post: postId,
      budget: parseFloat(budget),
      dailyBudget: parseFloat(dailyBudget),
      duration: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
      targetAudience: {
        ageMin: targetAudience?.ageMin || 13,
        ageMax: targetAudience?.ageMax || 65,
        gender: targetAudience?.gender || 'all',
        location: {
          division: targetAudience?.location?.division || '',
          district: targetAudience?.location?.district || '',
        },
        interests: targetAudience?.interests || [],
      },
      status: 'draft',
    });

    res.status(201).json({ campaign });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== PAYMENT FOR CAMPAIGN ==========

exports.payForCampaign = async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const campaign = await AdCampaign.findOne({
      _id: req.params.id,
      advertiser: req.user._id,
      status: 'draft',
    });

    if (!campaign) return res.status(404).json({ message: 'Campaign not found or not in draft status' });

    const { createSSLCommerzPayment } = require('../services/paymentService');
    const user = await User.findById(req.user._id).select('name email phone');

    const result = await createSSLCommerzPayment({
      userId: req.user._id,
      amount: campaign.budget,
      type: 'ad_campaign_payment',
      description: `Ad campaign boost`,
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: user.phone || '',
      paymentMethod: paymentMethod || null,
      metadata: { campaignId: campaign._id.toString() },
    });

    res.json({
      gatewayUrl: result.gatewayUrl,
      transactionId: result.transaction._id,
    });
  } catch (error) {
    console.error('Pay for campaign error:', error);
    res.status(500).json({ message: error.message || 'Payment failed' });
  }
};

// ========== GET MY CAMPAIGNS ==========

exports.getMyCampaigns = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { advertiser: req.user._id };
    if (status) filter.status = status;

    const [campaigns, total] = await Promise.all([
      AdCampaign.find(filter)
        .populate('post', 'text media thumbnailUrl')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      AdCampaign.countDocuments(filter),
    ]);

    res.json({ campaigns, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== CAMPAIGN ANALYTICS ==========

exports.getCampaignAnalytics = async (req, res) => {
  try {
    const campaign = await AdCampaign.findOne({
      _id: req.params.id,
      advertiser: req.user._id,
    }).populate('post', 'text media');

    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    // Daily breakdown
    const dailyMetrics = await AdCampaign.aggregate([
      { $match: { _id: campaign._id } },
      {
        $project: {
          metrics: 1,
          budget: 1,
          dailyBudget: 1,
          spentAmount: 1,
          duration: 1,
          status: 1,
        },
      },
    ]);

    res.json({
      campaign: dailyMetrics[0] || campaign,
      metrics: campaign.metrics,
      spentAmount: campaign.spentAmount,
      remainingBudget: campaign.budget - campaign.spentAmount,
      daysRemaining: Math.max(0, Math.ceil((new Date(campaign.duration.endDate) - Date.now()) / (1000 * 60 * 60 * 24))),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== PAUSE / RESUME ==========

exports.pauseCampaign = async (req, res) => {
  try {
    const campaign = await AdCampaign.findOneAndUpdate(
      { _id: req.params.id, advertiser: req.user._id, status: 'active' },
      { status: 'paused' },
      { new: true }
    );

    if (!campaign) return res.status(404).json({ message: 'Active campaign not found' });
    res.json({ campaign });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resumeCampaign = async (req, res) => {
  try {
    const campaign = await AdCampaign.findOneAndUpdate(
      { _id: req.params.id, advertiser: req.user._id, status: 'paused' },
      { status: 'active' },
      { new: true }
    );

    if (!campaign) return res.status(404).json({ message: 'Paused campaign not found' });
    res.json({ campaign });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== ADMIN: REVIEW QUEUE ==========

exports.getReviewQueue = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const [campaigns, total] = await Promise.all([
      AdCampaign.find({ status: 'pending_review' })
        .populate('advertiser', 'name email')
        .populate('post', 'text media')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      AdCampaign.countDocuments({ status: 'pending_review' }),
    ]);

    res.json({ campaigns, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.approveCampaign = async (req, res) => {
  try {
    const campaign = await AdCampaign.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    ).populate('advertiser', 'name email');

    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    // Notify advertiser
    await Notification.create({
      recipient: campaign.advertiser._id,
      sender: req.user._id,
      type: 'system',
      message: 'Your ad campaign has been approved and is now active.',
    });

    getIO().to(`user:${campaign.advertiser._id}`).emit('newNotification', {
      sender: { _id: req.user._id, name: 'Jolshaa Admin' },
      type: 'system',
      message: 'Your ad campaign has been approved and is now active.',
    });

    res.json({ campaign });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.rejectCampaign = async (req, res) => {
  try {
    const { reason } = req.body;
    const campaign = await AdCampaign.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason: reason || '' },
      { new: true }
    ).populate('advertiser', 'name email');

    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    // Refund the payment
    if (campaign.paymentTransaction) {
      await Transaction.findByIdAndUpdate(campaign.paymentTransaction, { status: 'refunded' });
      await User.findByIdAndUpdate(campaign.advertiser._id, {
        $inc: { 'monetization.availableBalance': campaign.budget },
      });
      await Transaction.create({
        user: campaign.advertiser._id,
        type: 'refund',
        amount: campaign.budget,
        status: 'completed',
        paymentGateway: 'internal',
        description: `Refund for rejected ad campaign`,
      });
    }

    // Notify advertiser
    await Notification.create({
      recipient: campaign.advertiser._id,
      sender: req.user._id,
      type: 'system',
      message: `Your ad campaign was not approved. ${reason || 'Full refund issued.'}`,
    });

    getIO().to(`user:${campaign.advertiser._id}`).emit('newNotification', {
      sender: { _id: req.user._id, name: 'Jolshaa Admin' },
      type: 'system',
      message: `Your ad campaign was not approved. ${reason || 'Full refund issued.'}`,
    });

    res.json({ campaign });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== AD SERVING: TRACK IMPRESSION / CLICK ==========

exports.trackImpression = async (req, res) => {
  try {
    const campaign = await AdCampaign.findByIdAndUpdate(
      req.params.id,
      {
        $inc: {
          'metrics.impressions': 1,
          'metrics.reach': 1,
        },
      },
      { new: true }
    );

    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    // Update CTR
    if (campaign.metrics.impressions > 0) {
      campaign.metrics.ctr = (campaign.metrics.clicks / campaign.metrics.impressions) * 100;
      await campaign.save();
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.trackClick = async (req, res) => {
  try {
    const campaign = await AdCampaign.findByIdAndUpdate(
      req.params.id,
      { $inc: { 'metrics.clicks': 1 } },
      { new: true }
    );

    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    // Update CTR
    if (campaign.metrics.impressions > 0) {
      campaign.metrics.ctr = (campaign.metrics.clicks / campaign.metrics.impressions) * 100;
      await campaign.save();
    }

    // Deduct daily spend
    campaign.spentAmount += campaign.dailyBudget * 0.01; // Simplified cost model
    await campaign.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== SERVE ADS IN FEED ==========

exports.getFeedWithAds = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const currentUser = await User.findById(req.user._id).select('blockedUsers location dateOfBirth gender');
    const blockedIds = currentUser?.blockedUsers || [];

    // Get user age for targeting
    const userAge = currentUser?.dateOfBirth
      ? Math.floor((Date.now() - new Date(currentUser.dateOfBirth).getTime()) / (31557600000))
      : 25;

    // Get active ad campaigns matching user
    const activeAds = await AdCampaign.find({
      status: 'active',
      'duration.startDate': { $lte: new Date() },
      'duration.endDate': { $gte: new Date() },
      $or: [
        { 'targetAudience.gender': 'all' },
        { 'targetAudience.gender': currentUser?.gender || 'all' },
      ],
    })
      .populate({
        path: 'post',
        populate: { path: 'author', select: 'name profilePhoto' },
      })
      .limit(5);

    // Inject ads every 5-7 organic posts
    const organicPosts = await Post.find({
      author: { $nin: blockedIds },
      visibility: 'public',
      status: 'published',
      isPublished: true,
      isSponsored: false,
      isBoosted: false,
    })
      .populate('author', 'name profilePhoto isVerified badges')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Merge ads into feed
    const feed = [];
    let adIndex = 0;
    const adInterval = 5 + Math.floor(Math.random() * 3); // Random 5-7

    for (let i = 0; i < organicPosts.length; i++) {
      feed.push({ ...organicPosts[i].toObject(), isSponsored: false });

      if ((i + 1) % adInterval === 0 && adIndex < activeAds.length) {
        const ad = activeAds[adIndex];
        if (ad?.post) {
          feed.push({
            ...ad.post.toObject(),
            isSponsored: true,
            sponsorName: 'Sponsored',
            adCampaignId: ad._id,
          });
          // Track impression
          await AdCampaign.findByIdAndUpdate(ad._id, { $inc: { 'metrics.impressions': 1 } });
          adIndex++;
        }
      }
    }

    res.json({ posts: feed, page, hasMore: organicPosts.length === limit });
  } catch (error) {
    console.error('Feed with ads error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
