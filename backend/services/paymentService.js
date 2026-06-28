const Stripe = require('stripe');
const Transaction = require('../models/Transaction');
const Post = require('../models/Post');
const Ad = require('../models/Ad');

let SSLCommerzPayment = null;
try {
  const sslczModule = require('sslcommerz');
  SSLCommerzPayment = sslczModule.SslCommerzPayment || sslczModule;
} catch (e) {
  // SSLCommerz not installed
}

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SSLCOMMERZ_STORE_ID = process.env.SSLCOMMERZ_STORE_ID;
const SSLCOMMERZ_STORE_PASS = process.env.SSLCOMMERZ_STORE_PASS;
const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// ========== STRIPE ==========
let stripe = null;
if (STRIPE_SECRET_KEY) {
  stripe = new Stripe(STRIPE_SECRET_KEY);
}

const createStripeCheckout = async ({ userId, amount, currency, type, referenceId, description }) => {
  if (!stripe) throw new Error('Stripe not configured');

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: currency.toLowerCase(),
        product_data: { name: description || `Jolshaa ${type}` },
        unit_amount: Math.round(amount * 100),
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${CLIENT_URL}/payment/cancel`,
    metadata: { userId: userId.toString(), type, referenceId: referenceId?.toString() || '' },
  });

  const tx = await Transaction.create({
    user: userId,
    type,
    amount,
    currency,
    status: 'pending',
    paymentMethod: 'card',
    transactionId: session.id,
    reference: referenceId || undefined,
    referenceModel: type === 'ad_payment' ? 'Ad' : type === 'boost_payment' ? 'Post' : 'User',
    description,
    metadata: { stripeSessionId: session.id },
  });

  return { sessionId: session.id, sessionUrl: session.url, transaction: tx };
};

const handleStripeWebhook = async (event) => {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const tx = await Transaction.findOneAndUpdate(
      { transactionId: session.id },
      { status: 'completed', metadata: { ...session.metadata, paymentIntent: session.payment_intent } }
    );

    if (tx) {
      await activatePostPayment(tx);
    }

    return { success: true, type: session.metadata?.type };
  }
  return { success: false };
};

// ========== SSLCOMMERZ ==========
let sslcz = null;
if (SSLCOMMERZ_STORE_ID && SSLCOMMERZ_STORE_PASS && SSLCommerzPayment) {
  sslcz = new SSLCommerzPayment({
    store_id: SSLCOMMERZ_STORE_ID,
    store_pass: SSLCOMMERZ_STORE_PASS,
    is_live: process.env.SSLCOMMERZ_LIVE === 'true',
  });
}

const createSSLCommerzPayment = async ({ userId, amount, currency, type, referenceId, description, customerName, customerEmail }) => {
  if (!sslcz) throw new Error('SSLCommerz not configured');

  const tx = await Transaction.create({
    user: userId,
    type,
    amount,
    currency: currency || 'BDT',
    status: 'pending',
    paymentMethod: 'wallet',
    reference: referenceId || undefined,
    referenceModel: type === 'ad_payment' ? 'Ad' : type === 'boost_payment' ? 'Post' : 'User',
    description,
    metadata: { gateway: 'sslcommerz' },
  });

  const data = {
    total_amount: amount,
    currency: currency || 'BDT',
    tran_id: tx._id.toString(),
    success_url: `${BASE_URL}/api/payments/sslcommerz/success`,
    fail_url: `${BASE_URL}/api/payments/sslcommerz/fail`,
    cancel_url: `${BASE_URL}/api/payments/sslcommerz/cancel`,
    ipn_url: `${BASE_URL}/api/payments/sslcommerz/ipn`,
    product_name: description || `Jolshaa ${type}`,
    product_category: type,
    cus_name: customerName || 'Customer',
    cus_email: customerEmail || '',
    cus_add1: '',
    cus_city: 'Dhaka',
    cus_country: 'Bangladesh',
    shipping_method: 'NO',
    num_of_item: 1,
    ship_name: 'Jolshaa',
    ship_add1: '',
    ship_city: 'Dhaka',
    ship_country: 'Bangladesh',
  };

  const result = await sslcz.init(data);
  if (result.GatewayPageURL) {
    return { gatewayUrl: result.GatewayPageURL, transaction: tx };
  }
  throw new Error('SSLCommerz init failed');
};

const handleSSLCommerzSuccess = async (tran_id, val_id) => {
  const validation = await sslcz.validate({ val_id });
  if (validation.status === 'VALID' || validation.status === 'VALIDATED') {
    const tx = await Transaction.findByIdAndUpdate(tran_id, {
      status: 'completed',
      metadata: { sslcommerzValId: val_id, validationStatus: validation.status },
    });

    if (tx) {
      await activatePostPayment(tx);
    }

    return { success: true };
  }
  return { success: false };
};

const handleSSLCommerzFail = async (tran_id) => {
  await Transaction.findByIdAndUpdate(tran_id, { status: 'failed' });
};

const handleSSLCommerzCancel = async (tran_id) => {
  await Transaction.findByIdAndUpdate(tran_id, { status: 'cancelled' });
};

const activatePostPayment = async (transaction) => {
  try {
    if (transaction.type === 'boost_payment' && transaction.referenceModel === 'Post') {
      const hours = 24;
      await Post.findByIdAndUpdate(transaction.reference, {
        isBoosted: true,
        boostEndsAt: new Date(Date.now() + hours * 3600000),
      });
    }

    if (transaction.type === 'ad_payment' && transaction.referenceModel === 'Ad') {
      await Ad.findByIdAndUpdate(transaction.reference, {
        status: 'active',
        startsAt: new Date(),
      });
    }
  } catch (error) {
    console.error('Post-payment activation error:', error);
  }
};

module.exports = {
  createStripeCheckout,
  handleStripeWebhook,
  createSSLCommerzPayment,
  handleSSLCommerzSuccess,
  handleSSLCommerzFail,
  handleSSLCommerzCancel,
};
