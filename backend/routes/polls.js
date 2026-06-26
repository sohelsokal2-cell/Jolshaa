const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createPoll, getPoll, vote } = require('../controllers/pollController');

router.use(protect);

router.post('/', createPoll);
router.get('/:postId', getPoll);
router.post('/:postId/vote', vote);

module.exports = router;
