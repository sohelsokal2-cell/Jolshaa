const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createPost,
  getFeed,
  updatePost,
  deletePost,
  reactToPost
} = require('../controllers/postController');
const {
  addComment,
  getComments
} = require('../controllers/commentController');

router.use(protect);

router.post('/', upload.array('media', 5), createPost);
router.get('/feed', getFeed);
router.put('/:id', updatePost);
router.delete('/:id', deletePost);
router.post('/:id/react', reactToPost);
router.post('/:id/comments', addComment);
router.get('/:id/comments', getComments);

module.exports = router;
