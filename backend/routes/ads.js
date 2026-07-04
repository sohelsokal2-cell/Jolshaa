const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  createCampaign,
  payForCampaign,
  getMyCampaigns,
  getCampaignAnalytics,
  pauseCampaign,
  resumeCampaign,
  getReviewQueue,
  approveCampaign,
  rejectCampaign,
  trackImpression,
  trackClick,
  getFeedWithAds,
} = require('../controllers/adCampaignController');

// Feed with ads (authenticated users)
router.get('/feed', protect, getFeedWithAds);

// All routes below require authentication
router.use(protect);

// Create and manage campaigns
router.post('/create', createCampaign);
router.post('/:id/pay', payForCampaign);
router.get('/my-campaigns', getMyCampaigns);
router.get('/:id/analytics', getCampaignAnalytics);
router.post('/:id/pause', pauseCampaign);
router.post('/:id/resume', resumeCampaign);

// Track ad interactions
router.post('/:id/track-impression', trackImpression);
router.post('/:id/track-click', trackClick);

// Admin routes
router.get('/admin/review-queue', adminOnly, getReviewQueue);
router.put('/admin/:id/approve', adminOnly, approveCampaign);
router.put('/admin/:id/reject', adminOnly, rejectCampaign);

module.exports = router;
