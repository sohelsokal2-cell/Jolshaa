const Transaction = require('../models/Transaction');
const UserWallet = require('../models/UserWallet');
const User = require('../models/User');
const Post = require('../models/Post');

let SSLCommerzPayment = null;
try {
  const sslczModule = require('sslcommerz');
  SSLCommerzPayment = sslczModule.SslCommerzPayment || sslczModule;
} catch (e) {
  // SSLCommerz not installed
}

const SSLCOMMERZ_STORE_ID = process.env.SSLCOMMERZ_STORE_ID;
const SSLCOMMERZ_STORE_PASS = process.env.SSLCOMMERZ_STORE_PASS;
const SSLCOMMERZ_IS_SANDBOX = process.env.SSLCOMMERZ_IS_SANDBOX !== 'false'; // default true
const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
const BASE_URL = (process.env.BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

// ========== SSLCOMMERZ INIT ==========

let sslcz = null;
if (SSLCOMMERZ_STORE_ID && SSLCOMMERZ_STORE_PASS && SSLCommerzPayment) {
  sslcz = new SSLCommerzPayment({
    store_id: SSLCOMMERZ_STORE_ID,
    store_pass: SSLCOMMERZ_STORE_PASS,
    is_live: !SSLCOMMERZ_IS_SANDBOX,
  });
  console.log(`[SSLCommerz] Initialized (${SSLCOMMERZ_IS_SANDBOX ? 'SANDBOX' : 'LIVE'} mode)`);
} else {
  console.warn('[SSLCommerz] Not configured — missing STORE_ID or STORE_PASS');
}

// ========== CREATE PAYMENT SESSION ==========

/**
 * Create an SSLCommerz payment session.
 *
 * @param {Object} options
 * @param {string} options.userId - Paying user ID
 * @param {number} options.amount - Amount in BDT
 * @param {string} options.type - Transaction type (star_purchase, subscription_payment, ad_campaign_payment)
 * @param {string} [options.referenceId] - Related document ID (e.g. postId, tierId)
 * @param {string} [options.description] - Product description
 * @param {string} [options.customerName] - Customer name
 * @param {string} [options.customerEmail] - Customer email
 * @param {string} [options.customerPhone] - Customer phone
 * @param {string} [options.paymentMethod] - Preferred method: bkash, nagad, rocket, card, null for all
 * @param {Object} [options.metadata] - Extra metadata to store
 * @returns {Promise<{gatewayUrl: string, transaction: Object}>}
 */
const createSSLCommerzPayment = async ({
  userId,
  amount,
  type,
  referenceId = null,
  description = '',
  customerName = 'Customer',
  customerEmail = '',
  customerPhone = '',
  paymentMethod = null,
  metadata = {},
}) => {
  if (!sslcz) throw new Error('SSLCommerz payment gateway is not configured');

  // Create pending transaction
  const tx = await Transaction.create({
    user: userId,
    type,
    amount,
    currency: 'BDT',
    status: 'pending',
    paymentGateway: 'sslcommerz',
    relatedPost: type === 'star_purchase' || type === 'ad_campaign_payment' ? referenceId : undefined,
    relatedUser: type === 'subscription_payment' ? referenceId : undefined,
    description,
    metadata: { ...metadata, paymentMethod },
  });

  // SSLCommerz required fields
  const data = {
    total_amount: parseFloat(amount.toFixed(2)),
    currency: 'BDT',
    tran_id: tx._id.toString(),
    success_url: `${BASE_URL}/api/payments/sslcommerz/success`,
    fail_url: `${BASE_URL}/api/payments/sslcommerz/fail`,
    cancel_url: `${BASE_URL}/api/payments/sslcommerz/cancel`,
    ipn_url: `${BASE_URL}/api/payments/sslcommerz/ipn`,
    product_name: description || `Jolshaa ${type.replace(/_/g, ' ')}`,
    product_category: type.replace(/_/g, ' '),
    product_profile: 'general',
    cus_name: customerName,
    cus_email: customerEmail,
    cus_add1: '',
    cus_city: 'Dhaka',
    cus_state: 'Dhaka',
    cus_postcode: '1000',
    cus_country: 'Bangladesh',
    cus_phone: customerPhone,
    shipping_method: 'NO',
    num_of_item: 1,
    ship_name: 'Jolshaa',
    ship_add1: '',
    ship_city: 'Dhaka',
    ship_state: 'Dhaka',
    ship_postcode: '1000',
    ship_country: 'Bangladesh',
  };

  // If specific payment method requested, set multi_card_name
  if (paymentMethod && ['bkash', 'nagad', 'rocket'].includes(paymentMethod)) {
    data.multi_card_name = paymentMethod;
  }

  const result = await sslcz.init(data);

  if (result && result.GatewayPageURL) {
    return { gatewayUrl: result.GatewayPageURL, transaction: tx };
  }

  // If init fails, mark transaction as failed
  await Transaction.findByIdAndUpdate(tx._id, { status: 'failed' });
  throw new Error('SSLCommerz payment initialization failed');
};

// ========== VALIDATE & COMPLETE PAYMENT ==========

/**
 * Validate a completed SSLCommerz transaction and process post-payment logic.
 */
const validateAndCompletePayment = async (tran_id, val_id) => {
  if (!sslcz) throw new Error('SSLCommerz not configured');

  const validation = await sslcz.validate({ val_id });

  if (validation.status === 'VALID' || validation.status === 'VALIDATED') {
    const tx = await Transaction.findByIdAndUpdate(
      tran_id,
      {
        status: 'completed',
        gatewayTransactionId: validation.bank_tran_id || val_id,
        metadata: {
          valId: val_id,
          bankTranId: validation.bank_tran_id,
          cardType: validation.card_type,
          cardIssuer: validation.card_issuer,
          validationStatus: validation.status,
          amount: validation.amount,
          currency: validation.currency,
        },
      },
      { new: true }
    );

    if (!tx) return { success: false, error: 'Transaction not found' };

    await processPostPayment(tx);
    return { success: true, transaction: tx };
  }

  return { success: false, error: 'Validation failed', status: validation.status };
};

// ========== POST-PAYMENT PROCESSING ==========

/**
 * Handle post-payment logic based on transaction type.
 */
const processPostPayment = async (transaction) => {
  try {
    switch (transaction.type) {
      case 'star_purchase':
        await handleStarPurchase(transaction);
        break;
      case 'star_gift_sent':
        await handleStarGiftSent(transaction);
        break;
      case 'subscription_payment':
        await handleSubscriptionPayment(transaction);
        break;
      case 'ad_campaign_payment':
        await handleAdCampaignPayment(transaction);
        break;
      case 'boost_payment':
        await handleBoostPayment(transaction);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error('Post-payment processing error:', error);
  }
};

const handleStarPurchase = async (transaction) => {
  const { user, starsAmount, metadata } = transaction;
  const packageStars = metadata?.packageStars || starsAmount || 0;

  if (packageStars <= 0) return;

  // Add stars to user wallet
  let wallet = await UserWallet.findOne({ user });
  if (!wallet) {
    wallet = await UserWallet.create({ user, starsBalance: packageStars });
  } else {
    wallet.starsBalance += packageStars;
    wallet.transactionHistory.push(transaction._id);
    await wallet.save();
  }
};

const handleStarGiftSent = async (transaction) => {
  // Deduct stars from sender
  const senderWallet = await UserWallet.findOne({ user: transaction.user });
  if (senderWallet) {
    senderWallet.starsBalance -= transaction.starsAmount;
    senderWallet.transactionHistory.push(transaction._id);
    await senderWallet.save();
  }

  // Add stars to receiver
  if (transaction.relatedUser) {
    let receiverWallet = await UserWallet.findOne({ user: transaction.relatedUser });
    if (!receiverWallet) {
      receiverWallet = await UserWallet.create({
        user: transaction.relatedUser,
        starsBalance: transaction.starsAmount,
      });
    } else {
      receiverWallet.starsBalance += transaction.starsAmount;
      receiverWallet.transactionHistory.push(transaction._id);
      await receiverWallet.save();
    }
  }
};

const handleSubscriptionPayment = async (transaction) => {
  const { user, relatedUser, amount } = transaction;

  // Creator gets 80% (configurable via RevenueShareConfig)
  const creatorShare = amount * 0.80;

  // Add earnings to creator's pending balance
  await User.findByIdAndUpdate(relatedUser, {
    $inc: { 'monetization.pendingBalance': creatorShare },
  });

  // Create earning transaction for creator
  await Transaction.create({
    user: relatedUser,
    type: 'subscription_earning',
    amount: creatorShare,
    currency: 'BDT',
    status: 'completed',
    paymentGateway: 'internal',
    relatedUser: user,
    description: `Subscription earning from ${transaction.description || 'subscriber'}`,
  });
};

const handleAdCampaignPayment = async (transaction) => {
  const { relatedPost, amount } = transaction;

  // Activate the ad campaign
  if (transaction.metadata?.campaignId) {
    const AdCampaign = require('../models/AdCampaign');
    await AdCampaign.findByIdAndUpdate(transaction.metadata.campaignId, {
      status: 'pending_review',
      paymentTransaction: transaction._id,
    });
  }
};

const handleBoostPayment = async (transaction) => {
  const hours = transaction.metadata?.boostHours || 24;
  await Post.findByIdAndUpdate(transaction.relatedPost, {
    isBoosted: true,
    boostEndsAt: new Date(Date.now() + hours * 3600000),
  });
};

// ========== FAIL / CANCEL HANDLERS ==========

const handlePaymentFailure = async (tran_id) => {
  await Transaction.findByIdAndUpdate(tran_id, { status: 'failed' });
};

const handlePaymentCancel = async (tran_id) => {
  await Transaction.findByIdAndUpdate(tran_id, { status: 'failed', metadata: { cancelled: true } });
};

// ========== IPN HANDLER ==========

/**
 * Instant Payment Notification — called by SSLCommerz server-to-server
 * even if the user doesn't complete the redirect.
 */
const handleIPN = async (body) => {
  const { tran_id, val_id, status } = body;

  if (!tran_id || !val_id) {
    return { success: false, error: 'Missing tran_id or val_id' };
  }

  // Verify the transaction exists before processing
  const tx = await Transaction.findById(tran_id);
  if (!tx) return { success: false, error: 'Transaction not found' };

  // Prevent double-processing
  if (tx.status === 'completed') {
    return { success: true, message: 'Already processed' };
  }

  if (status === 'VALID' || status === 'VALIDATED') {
    return await validateAndCompletePayment(tran_id, val_id);
  }

  return { success: false, error: 'IPN status not valid' };
};

// ========== CHECK TRANSACTION STATUS ==========

const getTransactionStatus = async (tranId) => {
  const tx = await Transaction.findById(tranId);
  if (!tx) return null;
  return { status: tx.status, transaction: tx };
};

// ========== INITIATE REFUND ==========

const initiateRefund = async (tranId, amount) => {
  if (!sslcz) throw new Error('SSLCommerz not configured');

  const tx = await Transaction.findById(tranId);
  if (!tx) throw new Error('Transaction not found');
  if (tx.status !== 'completed') throw new Error('Can only refund completed transactions');

  try {
    const refund = await sslcz.initiateRefund({
      refund_amount: amount || tx.amount,
      bank_tran_id: tx.metadata?.bankTranId || tx.gatewayTransactionId,
      tran_id: tx._id.toString(),
      refee: `REF-${Date.now()}`,
    });

    if (refund) {
      await Transaction.findByIdAndUpdate(tx._id, { status: 'refunded' });
      return { success: true, refund };
    }
  } catch (error) {
    console.error('Refund initiation error:', error);
  }
  return { success: false };
};

module.exports = {
  createSSLCommerzPayment,
  validateAndCompletePayment,
  handlePaymentFailure,
  handlePaymentCancel,
  handleIPN,
  getTransactionStatus,
  initiateRefund,
};
