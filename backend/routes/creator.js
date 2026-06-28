const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  toggleFollow,
  getFollowers,
  getFollowing,
  getPostAnalytics,
  getCreatorDashboard,
  getAudienceInsights,
  upgradeToCreator,
  getCreatorEarnings,
  requestWithdrawal,
  getPayoutHistory,
} = require('../controllers/creatorController');

router.use(protect);

router.post('/upgrade', upgradeToCreator);
router.get('/dashboard', getCreatorDashboard);
router.get('/audience', getAudienceInsights);
router.get('/analytics/:postId', getPostAnalytics);
router.post('/follow/:userId', toggleFollow);
router.get('/followers/:userId', getFollowers);
router.get('/following/:userId', getFollowing);
router.get('/earnings', getCreatorEarnings);
router.post('/withdraw', requestWithdrawal);
router.get('/payouts', getPayoutHistory);

module.exports = router;
