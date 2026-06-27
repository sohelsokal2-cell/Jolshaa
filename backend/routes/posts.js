const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createPost,
  getFeed,
  updatePost,
  deletePost,
  reactToPost,
  sharePost,
  toggleSavePost,
  getSavedPosts,
  getMemories,
  getTrendingPosts,
  getTrendingHashtags,
  schedulePost,
} = require('../controllers/postController');
const {
  addComment,
  getComments,
  reactToComment
} = require('../controllers/commentController');

router.use(protect);

router.post('/', upload.array('media', 5), createPost);
router.get('/feed', getFeed);
router.get('/saved/:userId', getSavedPosts);
router.get('/memories', getMemories);
router.get('/trending', getTrendingPosts);
router.get('/trending-hashtags', getTrendingHashtags);
router.post('/comments/:id/react', reactToComment);
router.put('/:id', updatePost);
router.delete('/:id', deletePost);
router.post('/:id/react', reactToPost);
router.post('/:id/share', sharePost);
router.put('/:id/save', toggleSavePost);
router.post('/:id/comments', addComment);
router.get('/:id/comments', getComments);
router.put('/:id/schedule', schedulePost);

module.exports = router;
