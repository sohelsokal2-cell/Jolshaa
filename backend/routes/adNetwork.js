const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getAllNetworks,
  getNetwork,
  updateNetwork,
  toggleNetwork,
  toggleAdFormat,
  getPublicConfig,
  trackImpression,
  trackClick,
  updateRevenue,
  getNetworkStats,
} = require('../controllers/adNetworkController');

// Public routes
router.get('/config', getPublicConfig);

// Protected routes (require auth)
router.post('/track/impression', protect, trackImpression);
router.post('/track/click', protect, trackClick);

// Admin routes
router.get('/stats', protect, adminOnly, getNetworkStats);
router.get('/', protect, adminOnly, getAllNetworks);
router.get('/:name', protect, adminOnly, getNetwork);
router.put('/:name', protect, adminOnly, updateNetwork);
router.put('/:name/toggle', protect, adminOnly, toggleNetwork);
router.put('/:name/format/:format/toggle', protect, adminOnly, toggleAdFormat);
router.post('/revenue', protect, adminOnly, updateRevenue);

module.exports = router;
