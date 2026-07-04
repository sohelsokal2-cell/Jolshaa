const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createTier,
  getTiers,
  updateTier,
  deleteTier,
  subscribe,
  cancelSubscription,
  getMySubscriptions,
  getMySubscribers,
  checkSubscription,
} = require('../controllers/subscriptionController');

// Public: get tiers for a creator
router.get('/tiers/:creatorId', getTiers);

// All routes below require authentication
router.use(protect);

// Tier management (creator only — controller checks isCreator)
router.post('/tiers', createTier);
router.put('/tiers/:tierId', updateTier);
router.delete('/tiers/:tierId', deleteTier);

// Subscribe / Unsubscribe
router.post('/subscribe', subscribe);
router.put('/:id/cancel', cancelSubscription);

// My subscriptions / subscribers
router.get('/my-subscriptions', getMySubscriptions);
router.get('/my-subscribers', getMySubscribers);
router.get('/check/:creatorId', checkSubscription);

module.exports = router;
