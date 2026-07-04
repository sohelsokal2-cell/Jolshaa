const AdCampaign = require('../models/AdCampaign');
const AdImpression = require('../models/AdImpression');
const User = require('../models/User');
const Post = require('../models/Post');

// Cost per impression (CPM model)
const CPM_RATE = 5.00; // 5 BDT per 1000 impressions
const CPC_RATE = 2.00; // 2 BDT per click

class AdServer {
  /**
   * Select the best ad to serve to a user
   * Uses targeting + budget-aware rotation
   */
  static async selectAd(userId, adType = 'feed', limit = 1) {
    const user = await User.findById(userId)
      .select('gender dateOfBirth location blockedUsers');

    if (!user) return [];

    // Calculate user age
    const userAge = user.dateOfBirth
      ? Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (31557600000))
      : 25;

    const now = new Date();

    // Find active campaigns matching targeting
    const campaigns = await AdCampaign.find({
      status: 'active',
      'duration.startDate': { $lte: now },
      'duration.endDate': { $gte: now },
      $expr: { $lt: ['$spentAmount', '$budget'] }, // Has remaining budget
    })
      .populate({
        path: 'post',
        populate: { path: 'author', select: 'name profilePhoto' },
      });

    // Filter by targeting
    const matched = campaigns.filter(c => {
      const t = c.targetAudience;

      // Gender check
      if (t.gender !== 'all' && t.gender !== user.gender) return false;

      // Age check
      if (userAge < t.ageMin || userAge > t.ageMax) return false;

      // Location check (if specified)
      if (t.location?.division && user.location?.division !== t.location.division) return false;

      // Exclude posts by blocked users
      if (user.blockedUsers?.includes(c.post?.author?._id)) return false;

      // Exclude own posts
      if (c.advertiser.toString() === userId.toString()) return false;

      return true;
    });

    if (matched.length === 0) return [];

    // Sort by: 1) least shown to this user, 2) highest remaining budget ratio
    const scored = await Promise.all(matched.map(async (campaign) => {
      // Count how many times this user has seen this ad
      const impressionCount = await AdImpression.countDocuments({
        campaign: campaign._id,
        user: userId,
      });

      const remainingBudgetRatio = (campaign.budget - campaign.spentAmount) / campaign.budget;

      return {
        campaign,
        impressionCount,
        remainingBudgetRatio,
        score: remainingBudgetRatio * 10 - impressionCount, // Higher score = show more
      };
    }));

    // Sort by score descending (best ads first)
    scored.sort((a, b) => b.score - a.score);

    // Return top N ads
    return scored.slice(0, limit).map(s => ({
      campaignId: s.campaign._id,
      postId: s.campaign.post?._id,
      post: s.campaign.post,
      advertiser: s.campaign.advertiser,
      budget: s.campaign.budget,
      spent: s.campaign.spentAmount,
      dailyBudget: s.campaign.dailyBudget,
      adType,
    }));
  }

  /**
   * Track an impression and charge the campaign
   */
  static async trackImpression(campaignId, userId, postId, adType = 'feed', device = 'mobile') {
    // Check if user already saw this ad recently (dedup within 1 hour)
    const oneHourAgo = new Date(Date.now() - 3600000);
    const existing = await AdImpression.findOne({
      campaign: campaignId,
      user: userId,
      createdAt: { $gte: oneHourAgo },
    });

    if (existing) {
      return { impressionId: existing.impressionId, charged: false };
    }

    // Generate unique impression ID
    const impressionId = `imp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate cost (CPM model: charge per 1000 impressions)
    const costPerImpression = CPM_RATE / 1000;

    // Create impression record
    const impression = await AdImpression.create({
      campaign: campaignId,
      user: userId,
      post: postId,
      adType,
      impressionId,
      costCharged: costPerImpression,
      device,
    });

    // Update campaign metrics and spend
    await AdCampaign.findByIdAndUpdate(campaignId, {
      $inc: {
        'metrics.impressions': 1,
        'metrics.reach': 1,
        'spentAmount': costPerImpression,
      },
    });

    // Auto-pause if budget exceeded
    const campaign = await AdCampaign.findById(campaignId);
    if (campaign && campaign.spentAmount >= campaign.budget) {
      campaign.status = 'completed';
      await campaign.save();
    }

    return { impressionId, charged: true, cost: costPerImpression };
  }

  /**
   * Track a click and charge the campaign
   */
  static async trackClick(impressionId, userId) {
    // Atomic update: only mark as clicked if not already clicked
    const impression = await AdImpression.findOneAndUpdate(
      { impressionId, clicked: false },
      {
        $set: { clicked: true, clickedAt: new Date() },
        $inc: { costCharged: CPC_RATE },
      },
      { new: true }
    );

    if (!impression) {
      return { success: false, reason: 'invalid_or_duplicate' };
    }

    // Update campaign
    await AdCampaign.findByIdAndUpdate(impression.campaign, {
      $inc: {
        'metrics.clicks': 1,
        'spentAmount': CPC_RATE,
      },
    });

    // Update CTR
    const campaign = await AdCampaign.findById(impression.campaign);
    if (campaign && campaign.metrics.impressions > 0) {
      campaign.metrics.ctr = (campaign.metrics.clicks / campaign.metrics.impressions) * 100;
      await campaign.save();
    }

    // Auto-complete if budget exceeded
    if (campaign && campaign.spentAmount >= campaign.budget) {
      campaign.status = 'completed';
      await campaign.save();
    }

    return { success: true, cost: CPC_RATE };
  }

  /**
   * Get ad performance stats for a campaign
   */
  static async getCampaignStats(campaignId) {
    const [impressionsByDay, clicksByDay, totals] = await Promise.all([
      AdImpression.aggregate([
        { $match: { campaign: campaignId } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            impressions: { $sum: 1 },
            clicks: { $sum: { $cond: ['$clicked', 1, 0] } },
            cost: { $sum: '$costCharged' },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 30 },
      ]),
      AdImpression.aggregate([
        { $match: { campaign: campaignId } },
        {
          $group: {
            _id: null,
            totalImpressions: { $sum: 1 },
            totalClicks: { $sum: { $cond: ['$clicked', 1, 0] } },
            totalCost: { $sum: '$costCharged' },
            uniqueUsers: { $addToSet: '$user' },
          },
        },
      ]),
      AdImpression.aggregate([
        { $match: { campaign: campaignId, clicked: true } },
        {
          $group: {
            _id: '$device',
            clicks: { $sum: 1 },
          },
        },
      ]),
    ]);

    const summary = totals[0] || {
      totalImpressions: 0,
      totalClicks: 0,
      totalCost: 0,
      uniqueUsers: [],
    };

    return {
      daily: impressionsByDay,
      summary: {
        ...summary,
        uniqueUsers: summary.uniqueUsers?.length || 0,
        ctr: summary.totalImpressions > 0
          ? ((summary.totalClicks / summary.totalImpressions) * 100).toFixed(2)
          : 0,
        avgCPC: summary.totalClicks > 0
          ? (summary.totalCost / summary.totalClicks).toFixed(2)
          : 0,
        cpm: summary.totalImpressions > 0
          ? ((summary.totalCost / summary.totalImpressions) * 1000).toFixed(2)
          : 0,
      },
      byDevice: clicksByDay,
    };
  }
}

module.exports = AdServer;
