const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getConversations,
  createConversation,
  getConversation,
  getMessages
} = require('../controllers/conversationController');

router.use(protect);

router.get('/', getConversations);
router.post('/', createConversation);
router.get('/:id', getConversation);
router.get('/:id/messages', getMessages);

module.exports = router;
