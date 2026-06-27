const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  archiveStory,
  getArchivedStories,
  deleteArchivedStory,
  createHighlight,
  getHighlights,
  addToHighlight,
  deleteHighlight,
} = require('../controllers/storyArchiveController');

router.use(protect);

router.post('/archive/:id', archiveStory);
router.get('/archive', getArchivedStories);
router.delete('/archive/:id', deleteArchivedStory);

router.post('/highlights', upload.single('coverImage'), createHighlight);
router.get('/highlights/:userId', getHighlights);
router.post('/highlights/:highlightId/add/:storyArchiveId', addToHighlight);
router.delete('/highlights/:id', deleteHighlight);

module.exports = router;
