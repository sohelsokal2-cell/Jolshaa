const Ad = require('../models/Ad');
const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const CreatorPayout = require('../models/CreatorPayout');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Refund = require('../models/Refund');
const FraudAlert = require('../models/FraudAlert');
const Notification = require('../models/Notification');

// ========== ADS MANAGEMENT ==========

exports.getAdDashboard = async (req, res) => {
  try {
    const [totalAds, activeAds, totalSpent, totalImpressions, totalClicks, recentAds] = await Promise.all([
      Ad.countDocuments(),
      Ad.countDocuments({ status: 'active' }),
      Ad.aggregate([{ $group: { _id: null, total: { $sum: '$spent' } } }]),
      Ad.aggregate([{ $group: { _id: null, total: { $sum: '$impressions' } } }]),
      Ad.aggregate([{ $group: { _id: null, total: { $sum: '$clicks' } } }]),
      Ad.find().populate('advertiser', 'name').sort({ createdAt: -1 }).limit(10),
    ]);

    res.json({
      totalAds,
      activeAds,
      totalRevenue: totalSpent[0]?.total || 0,
      totalImpressions: totalImpressions[0]?.total || 0,
      totalClicks: totalClicks[0]?.total || 0,
      avgCTR: totalImpressions[0]?.total > 0
        ? ((totalClicks[0]?.total / totalImpressions[0]?.total) * 100).toFixed(2)
        : 0,
      recentAds,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllAds = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const [ads, total] = await Promise.all([
      Ad.find(filter)
        .populate('advertiser', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Ad.countDocuments(filter),
    ]);

    res.json({ ads, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateAdStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ad = await Ad.findByIdAndUpdate(
      req.params.adId,
      { status },
      { new: true }
    ).populate('advertiser', 'name email');

    if (!ad) return res.status(404).json({ message: 'Ad not found' });

    await Transaction.create({
      user: ad.advertiser._id,
      type: 'ad_payment',
      amount: ad.spent,
      status: status === 'rejected' ? 'cancelled' : 'completed',
      description: `Ad "${ad.title}" ${status}`,
      reference: ad._id,
      referenceModel: 'Ad',
    });

    res.json({ ad });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAdStats = async (req, res) => {
  try {
    const stats = await Ad.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalBudget: { $sum: '$budget' },
          totalSpent: { $sum: '$spent' },
          totalImpressions: { $sum: '$impressions' },
          totalClicks: { $sum: '$clicks' },
        },
      },
    ]);
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== BOOSTED POST REVIEW ==========

exports.getBoostedPosts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { isBoosted: true };
    if (status === 'active') filter.boostEndsAt = { $gt: new Date() };
    if (status === 'expired') filter.boostEndsAt = { $lte: new Date() };

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('author', 'name profilePhoto')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Post.countDocuments(filter),
    ]);

    res.json({ posts, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.approveBoost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.postId,
      { isBoosted: true, boostEndsAt: new Date(Date.now() + 24 * 3600000) },
      { new: true }
    ).populate('author', 'name');

    if (!post) return res.status(404).json({ message: 'Post not found' });

    await Transaction.create({
      user: post.author._id,
      type: 'boost_payment',
      amount: 5,
      status: 'completed',
      description: `Boost approved for post`,
      reference: post._id,
      referenceModel: 'Post',
    });

    res.json({ post });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.rejectBoost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.postId,
      { isBoosted: false, boostEndsAt: null },
      { new: true }
    );

    if (!post) return res.status(404).json({ message: 'Post not found' });

    res.json({ post });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getBoostStats = async (req, res) => {
  try {
    const [totalBoosted, activeBoosted, totalSpend] = await Promise.all([
      Post.countDocuments({ isBoosted: true }),
      Post.countDocuments({ isBoosted: true, boostEndsAt: { $gt: new Date() } }),
      Transaction.aggregate([
        { $match: { type: 'boost_payment', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    res.json({
      totalBoosted,
      activeBoosted,
      totalSpend: totalSpend[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== CREATOR PAYOUT DASHBOARD ==========

exports.getPayoutDashboard = async (req, res) => {
  try {
    const [totalCreators, pendingPayouts, completedPayouts, totalPaidOut] = await Promise.all([
      User.countDocuments({ isCreator: true }),
      CreatorPayout.countDocuments({ status: 'pending' }),
      CreatorPayout.countDocuments({ status: 'completed' }),
      CreatorPayout.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const recentPayouts = await CreatorPayout.find()
      .populate('creator', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      totalCreators,
      pendingPayouts,
      completedPayouts,
      totalPaidOut: totalPaidOut[0]?.total || 0,
      recentPayouts,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllPayouts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const [payouts, total] = await Promise.all([
      CreatorPayout.find(filter)
        .populate('creator', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      CreatorPayout.countDocuments(filter),
    ]);

    res.json({ payouts, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.processPayout = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const payout = await CreatorPayout.findByIdAndUpdate(
      req.params.payoutId,
      {
        status,
        notes,
        processedBy: req.user._id,
        paidAt: status === 'completed' ? new Date() : undefined,
      },
      { new: true }
    ).populate('creator', 'name email');

    if (!payout) return res.status(404).json({ message: 'Payout not found' });

    if (status === 'completed') {
      await Notification.create({
        recipient: payout.creator._id,
        sender: req.user._id,
        type: 'subscription',
        message: `Your payout of $${payout.amount} has been processed`,
      });
    }

    res.json({ payout });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCreatorEarnings = async (req, res) => {
  try {
    const creators = await User.find({ isCreator: true })
      .select('name email profilePhoto subscribers')
      .limit(50);

    const earnings = await Promise.all(
      creators.map(async (creator) => {
        const [subRevenue, tipRevenue, totalPayouts] = await Promise.all([
          Transaction.aggregate([
            { $match: { type: 'subscription', status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ]),
          Transaction.aggregate([
            { $match: { type: 'tip', status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ]),
          CreatorPayout.aggregate([
            { $match: { creator: creator._id, status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ]),
        ]);

        return {
          creator,
          subscriptionRevenue: subRevenue[0]?.total || 0,
          tipRevenue: tipRevenue[0]?.total || 0,
          totalPaidOut: totalPayouts[0]?.total || 0,
          pendingPayout: (subRevenue[0]?.total || 0) + (tipRevenue[0]?.total || 0) - (totalPayouts[0]?.total || 0),
        };
      })
    );

    res.json({ earnings });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== SUBSCRIPTION MANAGEMENT ==========

exports.getSubscriptionDashboard = async (req, res) => {
  try {
    const [totalPlans, totalSubscribers, monthlyRevenue] = await Promise.all([
      SubscriptionPlan.countDocuments({ isActive: true }),
      User.aggregate([{ $project: { subCount: { $size: '$subscribers' } } }, { $group: { _id: null, total: { $sum: '$subCount' } } }]),
      Transaction.aggregate([
        { $match: { type: 'subscription', status: 'completed', createdAt: { $gte: new Date(Date.now() - 30 * 24 * 3600000) } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const topPlans = await SubscriptionPlan.find()
      .populate('creator', 'name')
      .sort({ subscriberCount: -1 })
      .limit(10);

    res.json({
      totalPlans,
      totalSubscribers: totalSubscribers[0]?.total || 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      topPlans,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllSubscriptions = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find()
      .populate('creator', 'name email')
      .sort({ subscriberCount: -1 });

    res.json({ plans });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePlanStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const plan = await SubscriptionPlan.findByIdAndUpdate(
      req.params.planId,
      { isActive },
      { new: true }
    ).populate('creator', 'name');

    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json({ plan });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== TIPS / DONATION OVERVIEW ==========

exports.getTipsDashboard = async (req, res) => {
  try {
    const [totalTips, totalAmount, topRecipients] = await Promise.all([
      Transaction.countDocuments({ type: 'tip', status: 'completed' }),
      Transaction.aggregate([
        { $match: { type: 'tip', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { type: 'tip', status: 'completed' } },
        { $group: { _id: '$user', totalTips: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { totalTips: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const populatedRecipients = await User.populate(topRecipients, { path: '_id', select: 'name profilePhoto' });

    res.json({
      totalTips,
      totalAmount: totalAmount[0]?.total || 0,
      topRecipients: populatedRecipients,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTipHistory = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const [tips, total] = await Promise.all([
      Transaction.find({ type: 'tip' })
        .populate('user', 'name profilePhoto')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Transaction.countDocuments({ type: 'tip' }),
    ]);

    res.json({ tips, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== TRANSACTIONS / INVOICES ==========

exports.getTransactionDashboard = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 3600000);

    const [totalTransactions, recentVolume, byType, failedCount] = await Promise.all([
      Transaction.countDocuments(),
      Transaction.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Transaction.countDocuments({ status: 'failed' }),
    ]);

    res.json({
      totalTransactions,
      recentVolume: recentVolume[0]?.total || 0,
      recentCount: recentVolume[0]?.count || 0,
      byType,
      failedCount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllTransactions = async (req, res) => {
  try {
    const { type, status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Transaction.countDocuments(filter),
    ]);

    res.json({ transactions, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.exportTransactions = async (req, res) => {
  try {
    const { from, to, type } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const transactions = await Transaction.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(1000);

    res.json({ transactions, count: transactions.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== REFUND HANDLING ==========

exports.getRefundDashboard = async (req, res) => {
  try {
    const [pendingRefunds, totalRefunded, recentRefunds] = await Promise.all([
      Refund.countDocuments({ status: 'pending' }),
      Refund.aggregate([
        { $match: { status: 'processed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Refund.find()
        .populate('user', 'name email')
        .populate('transaction')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    res.json({
      pendingRefunds,
      totalRefunded: totalRefunded[0]?.total || 0,
      recentRefunds,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllRefunds = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const [refunds, total] = await Promise.all([
      Refund.find(filter)
        .populate('user', 'name email')
        .populate('transaction')
        .populate('processedBy', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Refund.countDocuments(filter),
    ]);

    res.json({ refunds, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.processRefund = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const refund = await Refund.findByIdAndUpdate(
      req.params.refundId,
      {
        status,
        processedBy: req.user._id,
        processedAt: new Date(),
        description: notes || undefined,
      },
      { new: true }
    ).populate('user', 'name email');

    if (!refund) return res.status(404).json({ message: 'Refund not found' });

    if (status === 'processed') {
      await Transaction.create({
        user: refund.user._id,
        type: 'refund',
        amount: refund.amount,
        status: 'completed',
        description: `Refund processed: ${refund.reason}`,
        reference: refund.transaction,
        referenceModel: 'Transaction',
      });

      await Notification.create({
        recipient: refund.user._id,
        sender: req.user._id,
        type: 'subscription',
        message: `Your refund of $${refund.amount} has been processed`,
      });
    }

    res.json({ refund });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createRefund = async (req, res) => {
  try {
    const { userId, transactionId, amount, reason, description } = req.body;

    if (!transactionId) {
      return res.status(400).json({ message: 'Transaction ID is required' });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Refund amount must be greater than zero' });
    }
    if (!reason) {
      return res.status(400).json({ message: 'Refund reason is required' });
    }

    const transactionFilter = mongoose.Types.ObjectId.isValid(transactionId)
      ? { $or: [{ _id: transactionId }, { transactionId }] }
      : { transactionId };

    const transaction = await Transaction.findOne(transactionFilter).populate('user', 'name email');
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (userId && userId !== transaction.user?._id?.toString()) {
      return res.status(400).json({ message: 'Transaction does not belong to the provided user' });
    }

    const refund = await Refund.create({
      user: transaction.user._id,
      transaction: transaction._id,
      amount,
      reason,
      description: description || '',
      refundId: `REF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    });

    res.status(201).json({ refund });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== FRAUD DETECTION ==========

exports.getFraudDashboard = async (req, res) => {
  try {
    const [openAlerts, criticalAlerts, recentAlerts, byType] = await Promise.all([
      FraudAlert.countDocuments({ status: 'open' }),
      FraudAlert.countDocuments({ severity: 'critical', status: { $ne: 'resolved' } }),
      FraudAlert.find()
        .populate('user', 'name email')
        .populate('assignedTo', 'name')
        .sort({ createdAt: -1 })
        .limit(10),
      FraudAlert.aggregate([
        { $match: { status: { $ne: 'resolved' } } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      openAlerts,
      criticalAlerts,
      recentAlerts,
      byType,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllFraudAlerts = async (req, res) => {
  try {
    const { status, severity, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;

    const [alerts, total] = await Promise.all([
      FraudAlert.find(filter)
        .populate('user', 'name email')
        .populate('assignedTo', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      FraudAlert.countDocuments(filter),
    ]);

    res.json({ alerts, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createFraudAlert = async (req, res) => {
  try {
    const { userId, type, severity, description, evidence } = req.body;

    const alert = await FraudAlert.create({
      user: userId,
      type,
      severity: severity || 'medium',
      description,
      evidence: evidence || [],
    });

    res.status(201).json({ alert });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateFraudAlert = async (req, res) => {
  try {
    const { status, resolution, assignedTo } = req.body;
    const update = {};
    if (status) update.status = status;
    if (resolution) update.resolution = resolution;
    if (assignedTo) update.assignedTo = assignedTo;

    const alert = await FraudAlert.findByIdAndUpdate(
      req.params.alertId,
      update,
      { new: true }
    ).populate('user', 'name email');

    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json({ alert });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.autoDetectFraud = async (req, res) => {
  try {
    const alerts = [];
    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 24 * 3600000);

    // Check for users with multiple refunds
    const refundUsers = await Refund.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: '$user', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
      { $match: { count: { $gte: 3 } } },
    ]);

    for (const ru of refundUsers) {
      const existing = await FraudAlert.findOne({ user: ru._id, type: 'multiple_refunds', status: { $ne: 'resolved' } });
      if (!existing) {
        alerts.push(await FraudAlert.create({
          user: ru._id,
          type: 'multiple_refunds',
          severity: ru.count >= 5 ? 'high' : 'medium',
          description: `${ru.count} refunds totaling $${ru.totalAmount} in the last 7 days`,
          evidence: [{ field: 'refund_count', value: String(ru.count) }, { field: 'total_amount', value: String(ru.totalAmount) }],
        }));
      }
    }

    // Check for users with failed payments
    const failedPayUsers = await Transaction.aggregate([
      { $match: { status: 'failed', createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $match: { count: { $gte: 5 } } },
    ]);

    for (const fp of failedPayUsers) {
      const existing = await FraudAlert.findOne({ user: fp._id, type: 'suspicious_payment', status: { $ne: 'resolved' } });
      if (!existing) {
        alerts.push(await FraudAlert.create({
          user: fp._id,
          type: 'suspicious_payment',
          severity: 'high',
          description: `${fp.count} failed payment attempts in the last 7 days`,
          evidence: [{ field: 'failed_count', value: String(fp.count) }],
        }));
      }
    }

    res.json({ alerts, scanned: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
