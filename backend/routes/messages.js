const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  sendMessage,
  reactToMessage,
  editMessage,
  deleteMessage,
  searchMessages,
  archiveConversation,
  pinConversation,
  muteConversation,
  addGroupAdmin,
  removeGroupAdmin,
  startWatchParty,
  joinWatchParty,
  endWatchParty,
} = require('../controllers/messageController');

router.use(protect);

router.post('/', upload.single('media'), sendMessage);
router.get('/search/:conversationId', searchMessages);
router.put('/:messageId/react', reactToMessage);
router.put('/:messageId/edit', editMessage);
router.delete('/:messageId', deleteMessage);
router.put('/archive/:conversationId', archiveConversation);
router.put('/pin/:conversationId', pinConversation);
router.put('/mute/:conversationId', muteConversation);
router.post('/group/:conversationId/admin', addGroupAdmin);
router.delete('/group/:conversationId/admin/:userId', removeGroupAdmin);
router.post('/watch-party/:conversationId/start', startWatchParty);
router.post('/watch-party/:conversationId/join', joinWatchParty);
router.post('/watch-party/:conversationId/end', endWatchParty);

module.exports = router;
