const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createCheckout,
  sslCommerzSuccess,
  sslCommerzFail,
  sslCommerzCancel,
  sslCommerzIPN,
  getPaymentStatus,
  getMyTransactions,
  getStarBalance,
  purchaseStars,
  getStarPackages,
  sendStarGift,
  getStarGiftHistory,
} = require('../controllers/paymentController');

// ========== SSLCommerz Callbacks (no auth — called by gateway) ==========
// SSLCommerz sends URL-encoded body, not JSON
router.post('/sslcommerz/success', express.urlencoded({ extended: false }), sslCommerzSuccess);
router.post('/sslcommerz/fail', express.urlencoded({ extended: false }), sslCommerzFail);
router.post('/sslcommerz/cancel', express.urlencoded({ extended: false }), sslCommerzCancel);

// IPN (Instant Payment Notification) — server-to-server, SSLCommerz sends JSON or URL-encoded
router.post('/sslcommerz/ipn', express.urlencoded({ extended: false }), sslCommerzIPN);

// ========== Authenticated Routes ==========
router.use(protect);

// General checkout
router.post('/checkout', createCheckout);
router.get('/status/:transactionId', getPaymentStatus);
router.get('/my-transactions', getMyTransactions);

// Stars
router.get('/stars/packages', getStarPackages);
router.post('/stars/purchase', purchaseStars);
router.get('/stars/balance', getStarBalance);
router.post('/stars/gift', sendStarGift);
router.get('/stars/gift-history', getStarGiftHistory);

module.exports = router;
