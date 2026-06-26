const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createReel,
  getReelsFeed,
  getReel,
  toggleLikeReel,
  addComment,
  deleteComment,
  shareReel,
  getTrendingReels,
  deleteReel,
  getUserReels,
} = require('../controllers/reelController');

router.use(protect);

router.post('/', upload.single('video'), createReel);
router.get('/feed', getReelsFeed);
router.get('/trending', getTrendingReels);
router.get('/user/:userId', getUserReels);
router.get('/:id', getReel);
router.put('/:id/like', toggleLikeReel);
router.post('/:id/comments', addComment);
router.delete('/:id/comments/:commentId', deleteComment);
router.post('/:id/share', shareReel);
router.delete('/:id', deleteReel);

module.exports = router;
