const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getConversations,
  createConversation,
  getConversation,
  updateConversation,
  getMessages,
  getMediaMessages,
  getFileMessages,
  getLinkMessages,
  getPinnedMessages,
  togglePin,
  toggleMute,
  archiveConversation,
  deleteConversation,
  addMembers,
  removeMember,
  addGroupAdminRoute,
  removeGroupAdminRoute,
} = require('../controllers/conversationController');

router.use(protect);

router.get('/', getConversations);
router.post('/', createConversation);
router.get('/:id', getConversation);
router.put('/:id', upload.single('groupPhoto'), updateConversation);
router.delete('/:id', deleteConversation);
router.get('/:id/messages', getMessages);
router.get('/:id/media', getMediaMessages);
router.get('/:id/files', getFileMessages);
router.get('/:id/links', getLinkMessages);
router.get('/:id/pinned-messages', getPinnedMessages);
router.put('/:id/pin', togglePin);
router.put('/:id/mute', toggleMute);
router.put('/:id/archive', archiveConversation);
router.post('/:id/members', addMembers);
router.delete('/:id/members/:userId', removeMember);
router.post('/:id/admins', addGroupAdminRoute);
router.delete('/:id/admins/:userId', removeGroupAdminRoute);

module.exports = router;
