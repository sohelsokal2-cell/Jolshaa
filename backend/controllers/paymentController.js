const {
  createStripeCheckout,
  handleStripeWebhook,
  createSSLCommerzPayment,
  handleSSLCommerzSuccess,
  handleSSLCommerzFail,
  handleSSLCommerzCancel,
} = require('../services/paymentService');

exports.createCheckout = async (req, res) => {
  try {
    const { gateway, amount, currency, type, referenceId, description } = req.body;

    if (!gateway || !amount || !type) {
      return res.status(400).json({ message: 'gateway, amount, and type are required' });
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > 100000) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    if (gateway === 'stripe') {
      const result = await createStripeCheckout({
        userId: req.user._id,
        amount: numericAmount,
        currency: currency || 'usd',
        type,
        referenceId,
        description,
      });
      return res.json(result);
    }

    if (gateway === 'sslcommerz') {
      const result = await createSSLCommerzPayment({
        userId: req.user._id,
        amount: numericAmount,
        currency: currency || 'BDT',
        type,
        referenceId,
        description,
        customerName: req.user.name,
        customerEmail: req.user.email,
      });
      return res.json(result);
    }

    return res.status(400).json({ message: 'Invalid gateway. Use "stripe" or "sslcommerz".' });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

exports.stripeWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      return res.status(500).json({ message: 'Stripe webhook secret not configured' });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    const result = await handleStripeWebhook(event);
    res.json(result);
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).json({ message: 'Webhook error' });
  }
};

exports.sslCommerzSuccess = async (req, res) => {
  try {
    const { tran_id, val_id } = req.body;
    const result = await handleSSLCommerzSuccess(tran_id, val_id);
    if (result.success) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/success`);
    }
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/fail`);
  } catch (error) {
    console.error('SSLCommerz success error:', error);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/fail`);
  }
};

exports.sslCommerzFail = async (req, res) => {
  try {
    const { tran_id } = req.body;
    await handleSSLCommerzFail(tran_id);
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/fail`);
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/fail`);
  }
};

exports.sslCommerzCancel = async (req, res) => {
  try {
    const { tran_id } = req.body;
    await handleSSLCommerzCancel(tran_id);
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/cancel`);
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/cancel`);
  }
};

exports.getPaymentStatus = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const Transaction = require('../models/Transaction');
    const id = req.params.transactionId;
    const or = [{ transactionId: id }];
    if (mongoose.isValidObjectId(id)) or.push({ _id: id });
    const tx = await Transaction.findOne({ $or: or });
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    if (tx.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json({ status: tx.status, transaction: tx });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
