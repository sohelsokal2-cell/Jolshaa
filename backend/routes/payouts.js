const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  requestPayout,
  getMyPayouts,
  getPendingPayouts,
  processPayout,
  getPlatformRevenue,
} = require('../controllers/payoutController');

// All routes require authentication
router.use(protect);

// Creator payout requests
router.post('/request', requestPayout);
router.get('/history', getMyPayouts);

// Admin routes
router.get('/admin/pending', adminOnly, getPendingPayouts);
router.put('/admin/:id/process', adminOnly, processPayout);
router.get('/admin/platform-revenue', adminOnly, getPlatformRevenue);

module.exports = router;
