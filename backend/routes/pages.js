const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createPage,
  getPages,
  getPage,
  updatePage,
  deletePage,
  followPage,
  getPageFeed,
  createPagePost,
  featurePost,
  getPageInsights
} = require('../controllers/pageController');
const { createReview, getPageReviews } = require('../controllers/reviewController');

router.use(protect);

router.post('/', upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'coverPhoto', maxCount: 1 }
]), upload.checkMediaSize, createPage);
router.get('/', getPages);
router.get('/:id', getPage);
router.put('/:id', upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'coverPhoto', maxCount: 1 }
]), upload.checkMediaSize, updatePage);
router.delete('/:id', deletePage);
router.put('/:id/follow', followPage);
router.get('/:id/feed', getPageFeed);
router.put('/:id/feature/:postId', featurePost);
router.get('/:id/insights', getPageInsights);
router.post('/:id/posts', upload.array('media', 5), upload.checkMediaSize, createPagePost);
router.post('/:id/reviews', createReview);
router.get('/:id/reviews', getPageReviews);

module.exports = router;
