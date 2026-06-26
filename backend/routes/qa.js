const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createQA, getQA, addAnswer, upvoteAnswer, deleteAnswer } = require('../controllers/qaController');

router.use(protect);

router.post('/', createQA);
router.get('/:postId', getQA);
router.post('/:postId/answers', addAnswer);
router.put('/:postId/answers/:answerId/upvote', upvoteAnswer);
router.delete('/:postId/answers/:answerId', deleteAnswer);

module.exports = router;
