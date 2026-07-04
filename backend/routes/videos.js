const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  uploadVideo,
  getVideoStatus,
  deleteVideo,
  handleCloudinaryWebhook,
  getVideoFeed,
  getShortsFeed,
  trackView,
  getVideoAnalytics,
} = require('../controllers/videoController');
const {
  checkAdEligibility,
  trackAdView,
  getVideoRevenue,
} = require('../controllers/videoAdRevenueController');

// Cloudinary webhook — no auth (called by Cloudinary servers)
router.post('/webhook', handleCloudinaryWebhook);

// All routes below require authentication
router.use(protect);

router.get('/feed', getVideoFeed);
router.get('/shorts-feed', getShortsFeed);
router.post('/:id/track-view', trackView);
router.get('/:id/analytics', getVideoAnalytics);

// Video ad revenue (in-stream ads)
router.get('/:id/ad-eligible', checkAdEligibility);
router.post('/:id/track-ad-view', trackAdView);
router.get('/creator/ad-revenue', getVideoRevenue);

module.exports = router;
