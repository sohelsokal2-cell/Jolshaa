const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { deleteComment, pinComment, likeComment } = require('../controllers/commentController');

router.use(protect);

router.delete('/:id', deleteComment);
router.post('/:id/pin', pinComment);
router.post('/:id/like', likeComment);

module.exports = router;
