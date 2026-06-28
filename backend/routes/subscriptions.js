const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  subscribe,
  getSubscribers,
  setSubscriptionPrice,
  checkSubscription,
  createPlan,
  getPlans,
  updatePlan,
  deletePlan,
} = require('../controllers/subscriptionController');

router.use(protect);

router.post('/subscribe/:userId', subscribe);
router.get('/subscribers', getSubscribers);
router.put('/price', setSubscriptionPrice);
router.get('/check/:userId', checkSubscription);

router.post('/plans', createPlan);
router.get('/plans/:userId', getPlans);
router.put('/plans/:planId', updatePlan);
router.delete('/plans/:planId', deletePlan);

module.exports = router;
