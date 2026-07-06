const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkRestriction } = require('../middleware/checkRestriction');
const upload = require('../middleware/upload');
const { postLimiter, commentLimiter } = require('../middleware/rateLimiter');
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
  inviteCollaborator,
  acceptCollaboration,
  removeCollaborator,
} = require('../controllers/postController');
const {
  addComment,
  getComments,
  reactToComment
} = require('../controllers/commentController');
const {
  vote,
  report,
  getStats,
} = require('../controllers/factCheckController');
const {
  uploadVideo,
  getVideoStatus,
  deleteVideo,
} = require('../controllers/videoController');

router.use(protect);

// Video upload — must be before /:id routes to avoid conflicts
router.post('/video-upload', upload.single('video'), uploadVideo);

router.post('/', postLimiter, checkRestriction('post'), upload.array('media', 5), upload.checkMediaSize, createPost);
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
router.post('/:id/comments', commentLimiter, addComment);
router.get('/:id/comments', getComments);
router.put('/:id/schedule', schedulePost);
router.post('/:id/collaborators', inviteCollaborator);
router.put('/:id/collaborators/accept', acceptCollaboration);
router.delete('/:id/collaborators/:userId', removeCollaborator);

// Video status & delete
router.get('/:id/video-status', getVideoStatus);
router.delete('/:id/video', deleteVideo);

// Fact-check routes
router.post('/:id/factcheck/vote', vote);
router.post('/:id/factcheck/report', report);
router.get('/:id/factcheck/stats', getStats);

module.exports = router;
