const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const CallLog = require('../models/CallLog');
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

// Call logs for a conversation
router.get('/:id/call-logs', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await CallLog.find({ conversation: id })
      .populate('caller', 'name profilePhoto')
      .populate('receiver', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CallLog.countDocuments({ conversation: id });

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get call logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
