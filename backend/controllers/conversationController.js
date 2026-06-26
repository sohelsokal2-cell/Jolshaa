const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { hasId } = require('../utils/id');

exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
      .populate('participants', 'name profilePhoto')
      .sort({ updatedAt: -1 });

    // Attach last message to each conversation
    const conversationsWithLast = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await Message.findOne({ conversation: conv._id })
          .sort({ createdAt: -1 })
          .populate('sender', 'name');

        return {
          ...conv.toObject(),
          lastMessage: lastMessage || null
        };
      })
    );

    res.json(conversationsWithLast);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createConversation = async (req, res) => {
  try {
    const { participantId, participantIds, groupName } = req.body;

    let participants;
    if (participantIds && participantIds.length > 0) {
      // Group conversation
      participants = [req.user._id, ...participantIds];
    } else if (participantId) {
      // Direct conversation
      participants = [req.user._id, participantId];

      // Check block status
      const currentUser = await User.findById(req.user._id).select('blockedUsers');
      if (hasId(currentUser.blockedUsers, participantId)) {
        return res.status(403).json({ message: 'You have blocked this user' });
      }
      const targetUser = await User.findById(participantId).select('blockedUsers privacy');
      if (targetUser && hasId(targetUser.blockedUsers, req.user._id)) {
        return res.status(403).json({ message: 'User not found' });
      }

      // Check message privacy
      if (targetUser && targetUser.privacy && targetUser.privacy.messagePrivacy === 'none') {
        return res.status(403).json({ message: 'This user does not accept messages' });
      }

      // Check if direct conversation already exists
      const existing = await Conversation.findOne({
        isGroup: false,
        participants: { $all: participants, $size: 2 }
      }).populate('participants', 'name profilePhoto');

      if (existing) {
        return res.json(existing);
      }
    } else {
      return res.status(400).json({ message: 'Provide participantId or participantIds' });
    }

    const isGroup = participants.length > 2;

    const conversation = await Conversation.create({
      participants,
      isGroup,
      groupName: isGroup ? groupName || 'Group Chat' : null
    });

    await conversation.populate('participants', 'name profilePhoto');

    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('participants', 'name profilePhoto');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check if user is participant
    if (!conversation.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const before = req.query.before; // cursor-based pagination

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id,
    }).select('_id');

    if (!conversation) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const query = { conversation: req.params.id };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name profilePhoto')
      .populate('readBy', 'name');

    const total = await Message.countDocuments({ conversation: req.params.id });

    res.json({
      messages: messages.reverse(), // Return in chronological order
      page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
