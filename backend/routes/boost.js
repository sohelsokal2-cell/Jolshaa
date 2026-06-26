const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  boostPost,
  unboostPost,
  createSponsored,
  getBoostedFeed,
  recordImpression,
  recordClick,
} = require('../controllers/boostController');

router.use(protect);

router.post('/:postId/boost', boostPost);
router.delete('/:postId/boost', unboostPost);
router.post('/:postId/sponsored', createSponsored);
router.get('/boosted/feed', getBoostedFeed);
router.post('/:postId/impression', recordImpression);
router.post('/:postId/click', recordClick);

module.exports = router;
