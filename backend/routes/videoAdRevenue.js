const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  checkAdEligibility,
  trackAdView,
  getVideoRevenue,
} = require('../controllers/videoAdRevenueController');

// Check if video is eligible for in-stream ads
router.get('/:id/ad-eligible', protect, checkAdEligibility);

// Track mid-roll ad view
router.post('/:id/track-ad-view', protect, trackAdView);

// Creator's video ad revenue summary
router.get('/creator/ad-revenue', protect, getVideoRevenue);

module.exports = router;
