const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createStory,
  getStoriesFeed,
  getUserStories,
  viewStory,
  deleteStory,
  reactToStory,
  replyToStory,
  getStoryReplies,
} = require('../controllers/storyController');

router.use(protect);

router.post('/', upload.single('media'), createStory);
router.get('/feed', getStoriesFeed);
router.get('/user/:userId', getUserStories);
router.put('/:id/view', viewStory);
router.post('/:id/react', reactToStory);
router.post('/:id/reply', replyToStory);
router.get('/:id/replies', getStoryReplies);
router.delete('/:id', deleteStory);

module.exports = router;
