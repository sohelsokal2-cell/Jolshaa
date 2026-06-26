const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createScheduledPost,
  getScheduledPosts,
  cancelScheduled,
  createDraft,
  getDrafts,
  updateDraft,
  deleteDraft,
} = require('../controllers/schedulerController');

router.use(protect);

router.post('/schedule', upload.array('media', 5), createScheduledPost);
router.get('/schedule', getScheduledPosts);
router.delete('/schedule/:id', cancelScheduled);
router.post('/drafts', upload.array('media', 5), createDraft);
router.get('/drafts', getDrafts);
router.put('/drafts/:id', updateDraft);
router.delete('/drafts/:id', deleteDraft);

module.exports = router;
