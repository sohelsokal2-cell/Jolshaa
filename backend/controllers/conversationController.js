const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const { hasId } = require('../utils/id');

const uploadToCloudinary = (buffer, folder, resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
      deletedBy: { $ne: userId }
    })
      .populate('participants', 'name profilePhoto activeStatus lastSeen')
      .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'name profilePhoto' } })
      .sort({ updatedAt: -1 });

    const result = conversations.map(conv => {
      const obj = conv.toObject();
      obj.isPinned = obj.pinnedBy?.some(id => id.toString() === userId.toString()) || false;
      obj.isMuted = obj.mutedBy?.some(id => id.toString() === userId.toString()) || false;
      obj.isArchived = obj.archivedBy?.some(id => id.toString() === userId.toString()) || false;
      obj.unreadCount = obj.unreadCount instanceof Map
        ? obj.unreadCount.get(userId.toString()) || 0
        : obj.unreadCount?.[userId.toString()] || 0;
      return obj;
    });

    result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createConversation = async (req, res) => {
  try {
    const { participantId, participantIds, groupName } = req.body;

    let participants;
    if (participantIds && participantIds.length > 0) {
      participants = [req.user._id, ...participantIds];
    } else if (participantId) {
      participants = [req.user._id, participantId];

      const currentUser = await User.findById(req.user._id).select('blockedUsers');
      if (hasId(currentUser.blockedUsers, participantId)) {
        return res.status(403).json({ message: 'You have blocked this user' });
      }
      const targetUser = await User.findById(participantId).select('blockedUsers privacy');
      if (targetUser && hasId(targetUser.blockedUsers, req.user._id)) {
        return res.status(403).json({ message: 'User not found' });
      }
      if (targetUser && targetUser.privacy && targetUser.privacy.messagePrivacy === 'none') {
        return res.status(403).json({ message: 'This user does not accept messages' });
      }

      const existing = await Conversation.findOne({
        conversationType: 'direct',
        participants: { $all: participants, $size: 2 }
      }).populate('participants', 'name profilePhoto activeStatus lastSeen');

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
      conversationType: isGroup ? 'group' : 'direct',
      groupName: isGroup ? groupName || 'Group Chat' : null,
      admins: isGroup ? [req.user._id] : [],
      createdBy: req.user._id,
    });

    await conversation.populate('participants', 'name profilePhoto activeStatus lastSeen');

    const { getIO } = require('../socket');
    for (const participantId of participants) {
      if (participantId.toString() !== req.user._id.toString()) {
        getIO().to(`user:${participantId}`).emit('newConversation', conversation);
      }
    }

    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('participants', 'name profilePhoto activeStatus lastSeen')
      .populate('admins', 'name profilePhoto')
      .populate('lastMessage');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (conversation.lastMessage) {
      const lastMsg = await Message.findById(conversation.lastMessage._id)
        .populate('sender', 'name profilePhoto');
      conversation.lastMessage = lastMsg;
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateConversation = async (req, res) => {
  try {
    const { groupName } = req.body;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    if (!conversation.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (conversation.isGroup && !hasId(conversation.admins, req.user._id)) {
      return res.status(403).json({ message: 'Only admins can update group info' });
    }

    if (groupName !== undefined) conversation.groupName = groupName;

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'jolshaa/groups');
      conversation.groupPhoto = result.secure_url;
    }

    await conversation.save();
    await conversation.populate('participants', 'name profilePhoto activeStatus lastSeen');

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addMembers = async (req, res) => {
  try {
    const { userIds } = req.body;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    if (!conversation.isGroup) return res.status(400).json({ message: 'Not a group conversation' });

    if (!hasId(conversation.admins, req.user._id)) {
      return res.status(403).json({ message: 'Only admins can add members' });
    }

    const MAX_MEMBERS = 250;
    if (conversation.participants.length + userIds.length > MAX_MEMBERS) {
      return res.status(400).json({ message: `Group cannot exceed ${MAX_MEMBERS} members` });
    }

    const newUsers = userIds.filter(id => !hasId(conversation.participants, id));
    conversation.participants.push(...newUsers);

    for (const userId of newUsers) {
      conversation.unreadCount.set(userId.toString(), 0);
    }

    await conversation.save();
    await conversation.populate('participants', 'name profilePhoto activeStatus lastSeen');

    const { getIO } = require('../socket');
    for (const userId of newUsers) {
      getIO().to(`user:${userId}`).emit('addedToGroup', {
        conversationId: conversation._id,
        groupName: conversation.groupName,
      });
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    if (!conversation.isGroup) return res.status(400).json({ message: 'Not a group conversation' });

    const isAdmin = hasId(conversation.admins, req.user._id);
    const isSelf = req.user._id.toString() === userId;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    conversation.participants.pull(userId);
    conversation.admins.pull(userId);
    conversation.moderators.pull(userId);
    conversation.unreadCount.delete(userId.toString());

    await conversation.save();
    await conversation.populate('participants', 'name profilePhoto activeStatus lastSeen');

    const { getIO } = require('../socket');
    getIO().to(`user:${userId}`).emit('removedFromGroup', {
      conversationId: conversation._id,
    });

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addGroupAdminRoute = async (req, res) => {
  try {
    const { userId } = req.body;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }
    if (!hasId(conversation.admins, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!hasId(conversation.participants, userId)) {
      return res.status(400).json({ message: 'User must be a member first' });
    }

    if (!hasId(conversation.admins, userId)) {
      conversation.admins.push(userId);
      await conversation.save();
    }

    res.json({ admins: conversation.admins });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeGroupAdminRoute = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }
    if (!hasId(conversation.admins, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    conversation.admins.pull(req.params.userId);
    await conversation.save();

    res.json({ admins: conversation.admins });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.togglePin = async (req, res) => {
  try {
    const conv = await Conversation.findOne({ _id: req.params.id, participants: req.user._id });
    if (!conv) return res.status(404).json({ message: 'Conversation not found' });
    const userId = req.user._id;
    const idx = conv.pinnedBy.findIndex(id => id.toString() === userId.toString());
    if (idx === -1) {
      conv.pinnedBy.push(userId);
    } else {
      conv.pinnedBy.splice(idx, 1);
    }
    await conv.save();
    res.json({ isPinned: idx === -1 });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.toggleMute = async (req, res) => {
  try {
    const conv = await Conversation.findOne({ _id: req.params.id, participants: req.user._id });
    if (!conv) return res.status(404).json({ message: 'Conversation not found' });
    const userId = req.user._id;
    const idx = conv.mutedBy.findIndex(id => id.toString() === userId.toString());
    if (idx === -1) {
      conv.mutedBy.push(userId);
    } else {
      conv.mutedBy.splice(idx, 1);
    }
    await conv.save();
    res.json({ isMuted: idx === -1 });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.archiveConversation = async (req, res) => {
  try {
    const conv = await Conversation.findOne({ _id: req.params.id, participants: req.user._id });
    if (!conv) return res.status(404).json({ message: 'Conversation not found' });
    const userId = req.user._id;
    const idx = conv.archivedBy.findIndex(id => id.toString() === userId.toString());
    if (idx === -1) {
      conv.archivedBy.push(userId);
    } else {
      conv.archivedBy.splice(idx, 1);
    }
    await conv.save();
    res.json({ isArchived: idx === -1 });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    const conv = await Conversation.findOne({ _id: req.params.id, participants: req.user._id });
    if (!conv) return res.status(404).json({ message: 'Conversation not found' });

    const userId = req.user._id;
    if (!hasId(conv.deletedBy, userId)) {
      conv.deletedBy.push(userId);
      await conv.save();
    }

    res.json({ message: 'Conversation deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { before, limit: limitStr } = req.query;
    const limit = Math.min(Math.max(parseInt(limitStr, 10) || 50, 1), 100);

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id,
    }).select('_id');

    if (!conversation) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const query = {
      conversation: req.params.id,
      deletedFor: { $ne: req.user._id },
    };

    if (before) {
      const beforeDate = new Date(before);
      if (!Number.isNaN(beforeDate.getTime())) {
        query.createdAt = { $lt: beforeDate };
      }
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate('sender', 'name profilePhoto')
      .populate({ path: 'replyTo', select: 'text sender media mediaType isDeleted deletedForEveryone', populate: { path: 'sender', select: 'name profilePhoto' } })
      .populate({ path: 'forwardedFrom', select: 'text sender media mediaType fileName', populate: { path: 'sender', select: 'name profilePhoto' } })
      .populate('readBy', 'name profilePhoto');

    const total = await Message.countDocuments({
      conversation: req.params.id,
      deletedFor: { $ne: req.user._id },
    });

    const hasMore = messages.length > limit;
    const pageMessages = hasMore ? messages.slice(0, limit) : messages;

    res.json({
      messages: pageMessages.reverse(),
      hasMore,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMediaMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ _id: req.params.id, participants: req.user._id }).select('_id');
    if (!conversation) return res.status(403).json({ message: 'Not authorized' });

    const messages = await Message.find({
      conversation: req.params.id,
      media: { $ne: null },
      mediaType: { $in: ['image', 'video'] },
      deletedForEveryone: false,
    })
      .populate('sender', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFileMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ _id: req.params.id, participants: req.user._id }).select('_id');
    if (!conversation) return res.status(403).json({ message: 'Not authorized' });

    const messages = await Message.find({
      conversation: req.params.id,
      mediaType: 'file',
      deletedForEveryone: false,
    })
      .populate('sender', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getLinkMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ _id: req.params.id, participants: req.user._id }).select('_id');
    if (!conversation) return res.status(403).json({ message: 'Not authorized' });

    const messages = await Message.find({
      conversation: req.params.id,
      'linkPreview.url': { $ne: null },
      deletedForEveryone: false,
    })
      .populate('sender', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPinnedMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ _id: req.params.id, participants: req.user._id }).select('_id');
    if (!conversation) return res.status(403).json({ message: 'Not authorized' });

    const messages = await Message.find({
      conversation: req.params.id,
      isPinned: true,
      deletedForEveryone: false,
    })
      .populate('sender', 'name profilePhoto')
      .sort({ pinnedAt: -1 });

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
