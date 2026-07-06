const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createNote,
  getNotes,
  getNote,
  updateNote,
  deleteNote,
  toggleLikeNote,
  toggleBookmarkNote,
  getPublicNotes,
} = require('../controllers/noteController');

router.get('/public', getPublicNotes);

router.use(protect);

router.post('/', upload.single('coverImage'), upload.checkMediaSize, createNote);
router.get('/', getNotes);
router.get('/:id', getNote);
router.put('/:id', upload.single('coverImage'), upload.checkMediaSize, updateNote);
router.delete('/:id', deleteNote);
router.put('/:id/like', toggleLikeNote);
router.put('/:id/bookmark', toggleBookmarkNote);

module.exports = router;
