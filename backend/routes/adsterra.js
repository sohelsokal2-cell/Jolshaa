const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getAdsterraSettings,
  updateAdsterraSettings,
  getAdConfig,
  toggleAdFormat,
} = require('../controllers/adsterraController');

// Public route - get ad config for frontend
router.get('/config', getAdConfig);

// Admin routes
router.get('/settings', protect, adminOnly, getAdsterraSettings);
router.put('/settings', protect, adminOnly, updateAdsterraSettings);
router.put('/settings/:format/toggle', protect, adminOnly, toggleAdFormat);

module.exports = router;
