const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getConversations,
  createConversation,
  getConversation,
  getMessages,
  togglePin,
  toggleMute,
  archiveConversation
} = require('../controllers/conversationController');

router.use(protect);

router.get('/', getConversations);
router.post('/', createConversation);
router.get('/:id', getConversation);
router.get('/:id/messages', getMessages);
router.put('/:id/pin', togglePin);
router.put('/:id/mute', toggleMute);
router.put('/:id/archive', archiveConversation);

module.exports = router;
