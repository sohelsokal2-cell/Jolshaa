const {
  createSSLCommerzPayment,
  validateAndCompletePayment,
  handlePaymentFailure,
  handlePaymentCancel,
  handleIPN,
  getTransactionStatus,
  initiateRefund,
} = require('../services/paymentService');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const UserWallet = require('../models/UserWallet');

const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');

// ========== CREATE CHECKOUT SESSION ==========

exports.createCheckout = async (req, res) => {
  try {
    const {
      type,
      amount,
      paymentMethod,
      postId,
      creatorId,
      tierId,
      packageId,
      packageStars,
      description,
      campaignId,
    } = req.body;

    if (!type || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid type and amount are required' });
    }

    const user = await User.findById(req.user._id).select('name email phone');
    const metadata = {};

    // Build description and metadata based on type
    let desc = description || '';
    switch (type) {
      case 'star_purchase':
        desc = desc || `Purchase ${packageStars || ''} Stars`;
        metadata.packageStars = packageStars || 0;
        break;
      case 'subscription_payment':
        desc = desc || `Subscribe to creator`;
        break;
      case 'ad_campaign_payment':
        desc = desc || `Ad campaign payment`;
        metadata.campaignId = campaignId || null;
        break;
      case 'boost_payment':
        desc = desc || `Boost post`;
        metadata.boostHours = 24;
        break;
      default:
        desc = desc || `Payment`;
    }

    const result = await createSSLCommerzPayment({
      userId: req.user._id,
      amount: parseFloat(amount),
      type,
      referenceId: postId || creatorId || null,
      description: desc,
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: user.phone || '',
      paymentMethod: paymentMethod || null,
      metadata,
    });

    res.json({
      gatewayUrl: result.gatewayUrl,
      transactionId: result.transaction._id,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ message: error.message || 'Payment initialization failed' });
  }
};

// ========== SSLCommerz SUCCESS callback ==========

exports.sslCommerzSuccess = async (req, res) => {
  try {
    const { tran_id, val_id } = req.body;

    if (!tran_id) {
      return res.redirect(`${CLIENT_URL}/payment/fail?error=missing_tran_id`);
    }

    const result = await validateAndCompletePayment(tran_id, val_id);

    if (result.success) {
      return res.redirect(`${CLIENT_URL}/payment/success?tran_id=${tran_id}`);
    }
    return res.redirect(`${CLIENT_URL}/payment/fail?tran_id=${tran_id}`);
  } catch (error) {
    console.error('SSLCommerz success error:', error);
    return res.redirect(`${CLIENT_URL}/payment/fail?error=server`);
  }
};

// ========== SSLCommerz FAIL callback ==========

exports.sslCommerzFail = async (req, res) => {
  try {
    const { tran_id } = req.body;
    if (tran_id) {
      await handlePaymentFailure(tran_id);
    }
    return res.redirect(`${CLIENT_URL}/payment/fail?tran_id=${tran_id || ''}`);
  } catch (error) {
    console.error('SSLCommerz fail error:', error);
    return res.redirect(`${CLIENT_URL}/payment/fail?error=server`);
  }
};

// ========== SSLCommerz CANCEL callback ==========

exports.sslCommerzCancel = async (req, res) => {
  try {
    const { tran_id } = req.body;
    if (tran_id) {
      await handlePaymentCancel(tran_id);
    }
    return res.redirect(`${CLIENT_URL}/payment/cancel?tran_id=${tran_id || ''}`);
  } catch (error) {
    console.error('SSLCommerz cancel error:', error);
    return res.redirect(`${CLIENT_URL}/payment/cancel?error=server`);
  }
};

// ========== SSLCommerz IPN (server-to-server) ==========

exports.sslCommerzIPN = async (req, res) => {
  try {
    const result = await handleIPN(req.body);
    // Always return 200 to SSLCommerz
    res.status(200).json(result.success ? 'OK' : 'FAIL');
  } catch (error) {
    console.error('SSLCommerz IPN error:', error);
    res.status(200).json('OK'); // Always return 200
  }
};

// ========== GET TRANSACTION STATUS ==========

exports.getPaymentStatus = async (req, res) => {
  try {
    const tx = await Transaction.findOne({
      $or: [{ _id: req.params.transactionId }, { gatewayTransactionId: req.params.transactionId }],
    });

    if (!tx) return res.status(404).json({ message: 'Transaction not found' });

    // Only allow owner or admin
    if (tx.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ status: tx.status, transaction: tx });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== GET USER TRANSACTIONS ==========

exports.getMyTransactions = async (req, res) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;
    const filter = { user: req.user._id };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      transactions,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== STARS ==========

exports.getStarBalance = async (req, res) => {
  try {
    const wallet = await UserWallet.findOne({ user: req.user._id });
    res.json({ starsBalance: wallet?.starsBalance || 0 });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.purchaseStars = async (req, res) => {
  try {
    const { packageId, paymentMethod } = req.body;

    const packages = [
      { id: 'pkg_100', stars: 100, priceBDT: 100 },
      { id: 'pkg_500', stars: 500, priceBDT: 480 },
      { id: 'pkg_1000', stars: 1000, priceBDT: 900 },
      { id: 'pkg_5000', stars: 5000, priceBDT: 4300 },
    ];

    const pkg = packages.find((p) => p.id === packageId);
    if (!pkg) return res.status(400).json({ message: 'Invalid package' });

    const user = await User.findById(req.user._id).select('name email phone');

    const result = await createSSLCommerzPayment({
      userId: req.user._id,
      amount: pkg.priceBDT,
      type: 'star_purchase',
      description: `Purchase ${pkg.stars} Stars`,
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: user.phone || '',
      paymentMethod: paymentMethod || null,
      metadata: { packageStars: pkg.stars, packageId: pkg.id },
    });

    res.json({
      gatewayUrl: result.gatewayUrl,
      transactionId: result.transaction._id,
    });
  } catch (error) {
    console.error('Purchase stars error:', error);
    res.status(500).json({ message: error.message || 'Failed to initiate star purchase' });
  }
};

exports.getStarPackages = async (req, res) => {
  res.json({
    packages: [
      { id: 'pkg_100', stars: 100, priceBDT: 100, label: '100 Stars' },
      { id: 'pkg_500', stars: 500, priceBDT: 480, label: '500 Stars', popular: true },
      { id: 'pkg_1000', stars: 1000, priceBDT: 900, label: '1,000 Stars' },
      { id: 'pkg_5000', stars: 5000, priceBDT: 4300, label: '5,000 Stars', bestValue: true },
    ],
  });
};

exports.sendStarGift = async (req, res) => {
  try {
    const { toUserId, postId, starsAmount, message } = req.body;

    if (!toUserId || !starsAmount || starsAmount <= 0) {
      return res.status(400).json({ message: 'Valid recipient and star amount are required' });
    }
    if (toUserId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot send stars to yourself' });
    }

    // Check sender balance
    const senderWallet = await UserWallet.findOne({ user: req.user._id });
    if (!senderWallet || senderWallet.starsBalance < starsAmount) {
      return res.status(400).json({ message: 'Insufficient star balance' });
    }

    // Atomic deduct using findOneAndUpdate to prevent race condition
    const updatedWallet = await UserWallet.findOneAndUpdate(
      { user: req.user._id, starsBalance: { $gte: starsAmount } },
      { $inc: { starsBalance: -starsAmount } },
      { new: true }
    );
    if (!updatedWallet) {
      return res.status(400).json({ message: 'Insufficient star balance' });
    }

    // Creator gets 70% of BDT value (1 star ≈ 1 BDT)
    const creatorBdtShare = starsAmount * 0.70;

    // Create gift sent transaction
    const senderTx = await Transaction.create({
      user: req.user._id,
      type: 'star_gift_sent',
      amount: 0, // No real money movement for internal transfer
      starsAmount,
      relatedUser: toUserId,
      relatedPost: postId || undefined,
      paymentGateway: 'internal',
      status: 'completed',
      description: message || `Sent ${starsAmount} stars`,
    });

    // Create gift received transaction (earnings)
    const receiverTx = await Transaction.create({
      user: toUserId,
      type: 'star_gift_received',
      amount: creatorBdtShare,
      starsAmount,
      relatedUser: req.user._id,
      relatedPost: postId || undefined,
      paymentGateway: 'internal',
      status: 'completed',
      description: `Received ${starsAmount} stars`,
    });

    // Add to receiver's pending balance
    await User.findByIdAndUpdate(toUserId, {
      $inc: {
        'monetization.pendingBalance': creatorBdtShare,
      },
    });

    // Send real-time notification
    const { getIO } = require('../socket');
    const sender = await User.findById(req.user._id).select('name profilePhoto');
    getIO().to(`user:${toUserId}`).emit('starGiftReceived', {
      sender: { _id: sender._id, name: sender.name, profilePhoto: sender.profilePhoto },
      starsAmount,
      postId,
      message,
      transactionId: receiverTx._id,
    });

    res.json({
      success: true,
      starsDeducted: starsAmount,
      receiverEarning: creatorBdtShare,
    });
  } catch (error) {
    console.error('Send star gift error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getStarGiftHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const [gifts, total] = await Promise.all([
      Transaction.find({
        user: req.user._id,
        type: { $in: ['star_gift_sent', 'star_gift_received'] },
      })
        .populate('relatedUser', 'name profilePhoto')
        .populate('relatedPost', 'text media')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Transaction.countDocuments({
        user: req.user._id,
        type: { $in: ['star_gift_sent', 'star_gift_received'] },
      }),
    ]);

    res.json({ gifts, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
