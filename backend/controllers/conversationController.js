const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { hasId } = require('../utils/id');

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch conversations
    const conversations = await Conversation.find({ participants: userId })
      .populate('participants', 'name profilePhoto')
      .sort({ updatedAt: -1 });

    const conversationIds = conversations.map((c) => c._id);

    if (conversationIds.length === 0) return res.json([]);

    // One-pass aggregation: last message per conversation
    const lastMessages = await Message.aggregate([
      { $match: { conversation: { $in: conversationIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conversation',
          lastMessage: { $first: '$$ROOT' },
        },
      },
      {
        $project: {
          _id: 0,
          conversationId: '$_id',
          lastMessage: 1,
        },
      },
    ]);

    const lastByConversation = new Map(
      lastMessages.map((x) => [x.conversationId.toString(), x.lastMessage])
    );

    // Populate sender for lastMessage in batch
    const lastMessageIds = lastMessages
      .map((x) => x.lastMessage?._id)
      .filter(Boolean);

    const lastMessageDocs = await Message.find({ _id: { $in: lastMessageIds } })
      .populate('sender', 'name');

    const lastDocById = new Map(
      lastMessageDocs.map((m) => [m._id.toString(), m])
    );

    const conversationsWithLast = conversations.map((conv) => {
      const rawLast = lastByConversation.get(conv._id.toString()) || null;
      const lastMessage = rawLast ? lastDocById.get(rawLast._id.toString()) || rawLast : null;
      const obj = conv.toObject();
      obj.isPinned = obj.pinnedBy?.some(id => id.toString() === userId.toString()) || false;
      obj.isMuted = obj.mutedBy?.some(id => id.toString() === userId.toString()) || false;
      obj.isArchived = obj.archivedBy?.some(id => id.toString() === userId.toString()) || false;

      return {
        ...obj,
        lastMessage: lastMessage || null,
      };
    });

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

exports.togglePin = async (req, res) => {
  try {
    const conv = await Conversation.findOne({ _id: req.params.id, participants: req.user._id });
    if (!conv) return res.status(404).json({ message: 'Conversation not found' });
    const userId = req.user._id;
    const idx = conv.pinnedBy.indexOf(userId);
    if (idx === -1) {
      conv.pinnedBy.push(userId);
    } else {
      conv.pinnedBy.splice(idx, 1);
    }
    await conv.save();
    res.json({ isPinned: idx === -1 });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.toggleMute = async (req, res) => {
  try {
    const conv = await Conversation.findOne({ _id: req.params.id, participants: req.user._id });
    if (!conv) return res.status(404).json({ message: 'Conversation not found' });
    const userId = req.user._id;
    const idx = conv.mutedBy.indexOf(userId);
    if (idx === -1) {
      conv.mutedBy.push(userId);
    } else {
      conv.mutedBy.splice(idx, 1);
    }
    await conv.save();
    res.json({ isMuted: idx === -1 });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.archiveConversation = async (req, res) => {
  try {
    const conv = await Conversation.findOne({ _id: req.params.id, participants: req.user._id });
    if (!conv) return res.status(404).json({ message: 'Conversation not found' });
    const userId = req.user._id;
    const idx = conv.archivedBy.indexOf(userId);
    if (idx === -1) {
      conv.archivedBy.push(userId);
    } else {
      conv.archivedBy.splice(idx, 1);
    }
    await conv.save();
    res.json({ isArchived: idx === -1 });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
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

    const cursorOnly = Boolean(before);

    let messagesQuery = Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', 'name profilePhoto')
      .populate('readBy', 'name');

    if (!cursorOnly) {
      const skip = (page - 1) * limit;
      messagesQuery = messagesQuery.skip(skip);
    }

    const messages = await messagesQuery;

    const total = await Message.countDocuments({ conversation: req.params.id });

    res.json({
      messages: messages.reverse(), // chronological
      page: cursorOnly ? 1 : page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
