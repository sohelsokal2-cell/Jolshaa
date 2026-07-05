const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkRestriction } = require('../middleware/checkRestriction');
const { deleteComment, pinComment, likeComment } = require('../controllers/commentController');

router.use(protect);

router.delete('/:id', deleteComment);
router.post('/:id/pin', checkRestriction('comment'), pinComment);
router.post('/:id/like', checkRestriction('comment'), likeComment);

module.exports = router;
