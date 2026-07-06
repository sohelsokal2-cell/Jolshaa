const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkRestriction } = require('../middleware/checkRestriction');
const upload = require('../middleware/upload');
const {
  sendMessage,
  reactToMessage,
  editMessage,
  deleteMessage,
  forwardMessage,
  pinMessage,
  markAsSeen,
  searchMessages,
  startWatchParty,
  joinWatchParty,
  endWatchParty,
} = require('../controllers/messageController');

router.use(protect);

router.post('/', checkRestriction('message'), upload.single('media'), upload.checkMediaSize, sendMessage);
router.post('/forward', forwardMessage);
router.get('/search/:conversationId', searchMessages);
router.put('/:messageId/react', reactToMessage);
router.put('/:messageId/edit', editMessage);
router.delete('/:messageId', deleteMessage);
router.put('/:messageId/pin', pinMessage);
router.put('/seen/:conversationId', markAsSeen);
router.post('/watch-party/:conversationId/start', startWatchParty);
router.post('/watch-party/:conversationId/join', joinWatchParty);
router.post('/watch-party/:conversationId/end', endWatchParty);

module.exports = router;
