const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createAd,
  getAds,
  getActiveAds,
  trackImpression,
  trackClick,
  updateAd,
  deleteAd,
  getAdStats,
} = require('../controllers/adController');

router.get('/active', getActiveAds);

router.use(protect);

router.post('/', createAd);
router.get('/', getAds);
router.put('/:adId', updateAd);
router.delete('/:adId', deleteAd);
router.get('/:adId/stats', getAdStats);
router.post('/:adId/impression', trackImpression);
router.post('/:adId/click', trackClick);

module.exports = router;
