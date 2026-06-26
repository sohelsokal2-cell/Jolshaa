const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  subscribe,
  getSubscribers,
  setSubscriptionPrice,
  checkSubscription,
} = require('../controllers/subscriptionController');

router.use(protect);

router.post('/subscribe/:userId', subscribe);
router.get('/subscribers', getSubscribers);
router.put('/price', setSubscriptionPrice);
router.get('/check/:userId', checkSubscription);

module.exports = router;
