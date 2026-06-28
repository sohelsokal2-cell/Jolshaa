const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createCheckout,
  stripeWebhook,
  sslCommerzSuccess,
  sslCommerzFail,
  sslCommerzCancel,
  getPaymentStatus,
} = require('../controllers/paymentController');

// Stripe webhook (raw body needed, no JSON parsing)
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

// SSLCommerz callbacks (URL-encoded body)
router.post('/sslcommerz/success', express.urlencoded({ extended: false }), sslCommerzSuccess);
router.post('/sslcommerz/fail', express.urlencoded({ extended: false }), sslCommerzFail);
router.post('/sslcommerz/cancel', express.urlencoded({ extended: false }), sslCommerzCancel);

// Authenticated routes
router.use(protect);

router.post('/checkout', createCheckout);
router.get('/status/:transactionId', getPaymentStatus);

module.exports = router;
