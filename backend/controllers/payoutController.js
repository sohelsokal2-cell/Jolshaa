const PayoutRequest = require('../models/PayoutRequest');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { getIO } = require('../socket');

const MINIMUM_PAYOUT = 1000; // BDT

// ========== REQUEST PAYOUT ==========

exports.requestPayout = async (req, res) => {
  try {
    const { amount, method, accountDetails } = req.body;

    if (!amount || amount < MINIMUM_PAYOUT) {
      return res.status(400).json({ message: `Minimum payout is ${MINIMUM_PAYOUT} BDT` });
    }

    if (!method || !['bkash', 'nagad', 'rocket', 'bank'].includes(method)) {
      return res.status(400).json({ message: 'Valid payment method is required' });
    }

    const user = await User.findById(req.user._id).select('monetization');
    const availableBalance = user.monetization?.availableBalance || 0;

    if (availableBalance < amount) {
      return res.status(400).json({
        message: 'Insufficient balance',
        availableBalance,
        requested: amount,
      });
    }

    // Deduct from available balance immediately
    await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        'monetization.availableBalance': -amount,
        'monetization.pendingBalance': amount,
      },
    });

    // Create payout request
    const payout = await PayoutRequest.create({
      user: req.user._id,
      amount,
      method,
      accountDetails: accountDetails || {},
      status: 'pending',
      requestedAt: new Date(),
    });

    // Create transaction
    await Transaction.create({
      user: req.user._id,
      type: 'payout_request',
      amount,
      status: 'pending',
      paymentGateway: method,
      description: `Payout request via ${method}`,
      metadata: { payoutRequestId: payout._id.toString() },
    });

    // Notify admins
    const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } }).select('_id');
    for (const admin of admins) {
      await Notification.create({
        recipient: admin._id,
        sender: req.user._id,
        type: 'system',
        message: `New payout request: ${amount} BDT via ${method} from ${req.user.name}`,
      });
      getIO().to(`user:${admin._id}`).emit('newNotification', {
        sender: { _id: req.user._id, name: req.user.name },
        type: 'system',
        message: `New payout request: ${amount} BDT via ${method}`,
      });
    }

    res.status(201).json({
      payout,
      message: 'Payout request submitted. Processing takes 3-5 business days.',
    });
  } catch (error) {
    console.error('Request payout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== MY PAYOUT HISTORY ==========

exports.getMyPayouts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const [payouts, total] = await Promise.all([
      PayoutRequest.find({ user: req.user._id })
        .sort({ requestedAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      PayoutRequest.countDocuments({ user: req.user._id }),
    ]);

    res.json({ payouts, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== ADMIN: PENDING PAYOUTS ==========

exports.getPendingPayouts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const [payouts, total] = await Promise.all([
      PayoutRequest.find({ status: 'pending' })
        .populate('user', 'name email')
        .sort({ requestedAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      PayoutRequest.countDocuments({ status: 'pending' }),
    ]);

    res.json({ payouts, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.processPayout = async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    if (!['completed', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be completed or rejected' });
    }

    const payout = await PayoutRequest.findByIdAndUpdate(
      req.params.id,
      {
        status,
        adminNote: adminNote || '',
        processedAt: new Date(),
        processedBy: req.user._id,
      },
      { new: true }
    ).populate('user', 'name email');

    if (!payout) return res.status(404).json({ message: 'Payout request not found' });

    if (status === 'completed') {
      // Move from pending to completed
      await User.findByIdAndUpdate(payout.user._id, {
        $inc: {
          'monetization.pendingBalance': -payout.amount,
          'monetization.totalPaidOut': payout.amount,
        },
      });

      // Create completed transaction
      await Transaction.create({
        user: payout.user._id,
        type: 'payout_completed',
        amount: payout.amount,
        status: 'completed',
        paymentGateway: payout.method,
        description: `Payout of ${payout.amount} BDT completed via ${payout.method}`,
      });

      // Notify user
      await Notification.create({
        recipient: payout.user._id,
        sender: req.user._id,
        type: 'system',
        message: `Your payout of ${payout.amount} BDT has been processed.`,
      });

      getIO().to(`user:${payout.user._id}`).emit('newNotification', {
        sender: { _id: req.user._id, name: 'Jolshaa Admin' },
        type: 'system',
        message: `Your payout of ${payout.amount} BDT has been processed.`,
      });
    }

    if (status === 'rejected') {
      // Return to available balance
      await User.findByIdAndUpdate(payout.user._id, {
        $inc: {
          'monetization.pendingBalance': -payout.amount,
          'monetization.availableBalance': payout.amount,
        },
      });

      // Notify user
      await Notification.create({
        recipient: payout.user._id,
        sender: req.user._id,
        type: 'system',
        message: `Your payout request was rejected. ${adminNote || 'Amount has been returned to your balance.'}`,
      });

      getIO().to(`user:${payout.user._id}`).emit('newNotification', {
        sender: { _id: req.user._id, name: 'Jolshaa Admin' },
        type: 'system',
        message: `Your payout request was rejected. ${adminNote || ''}`,
      });
    }

    res.json({ payout });
  } catch (error) {
    console.error('Process payout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== ADMIN: PLATFORM REVENUE OVERVIEW ==========

exports.getPlatformRevenue = async (req, res) => {
  try {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [thisMonthRevenue, lastMonthRevenue, totalPayouts, pendingPayouts, topCreators] = await Promise.all([
      Transaction.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: thisMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: lastMonth, $lt: thisMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      PayoutRequest.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      PayoutRequest.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      User.find({ 'monetization.isCreator': true })
        .select('name profilePhoto monetization.totalEarnings monetization.availableBalance')
        .sort({ 'monetization.totalEarnings': -1 })
        .limit(10),
    ]);

    const thisMonthTotal = thisMonthRevenue[0]?.total || 0;
    const lastMonthTotal = lastMonthRevenue[0]?.total || 0;
    const totalPaidOut = totalPayouts[0]?.total || 0;
    const pendingPayoutTotal = pendingPayouts[0]?.total || 0;

    res.json({
      thisMonthRevenue: thisMonthTotal,
      lastMonthRevenue: lastMonthTotal,
      revenueChange: lastMonthTotal > 0
        ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1)
        : 0,
      totalPaidOut,
      pendingPayoutLiability: pendingPayoutTotal,
      netPlatformRevenue: thisMonthTotal - pendingPayoutTotal,
      topCreators,
    });
  } catch (error) {
    console.error('Platform revenue error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
