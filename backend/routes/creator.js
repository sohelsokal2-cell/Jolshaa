const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getEligibility,
  applyForMonetization,
  approveCreator,
  rejectCreator,
  getPendingApplications,
  getEarningsDashboard,
  toggleFollow,
  getFollowers,
  getFollowing,
  getPostAnalytics,
  getCreatorDashboard,
  toggleTips,
  getTipHistory,
} = require('../controllers/creatorController');

// Public routes
router.get('/followers/:userId', protect, getFollowers);
router.get('/following/:userId', protect, getFollowing);

// All routes below require authentication
router.use(protect);

// Follow / Unfollow
router.post('/follow/:userId', toggleFollow);

// Monetization eligibility & application
router.get('/monetization/eligibility', getEligibility);
router.post('/monetization/apply', applyForMonetization);

// Creator dashboard & analytics
router.get('/earnings-dashboard', getEarningsDashboard);
router.get('/dashboard', getCreatorDashboard);
router.get('/post-analytics/:postId', getPostAnalytics);

// Tips
router.post('/toggle-tips', toggleTips);
router.get('/tip-history', getTipHistory);

// Admin routes
router.get('/admin/pending-applications', adminOnly, getPendingApplications);
router.put('/admin/approve/:userId', adminOnly, approveCreator);
router.put('/admin/reject/:userId', adminOnly, rejectCreator);

module.exports = router;
