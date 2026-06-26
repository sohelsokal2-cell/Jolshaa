const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const { getIO } = require('../socket');
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

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, text, replyTo } = req.body;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    let media = null;
    let mediaType = null;
    let fileName = null;
    let fileSize = null;
    let voiceDuration = null;

    if (req.file) {
      const isAudio = req.file.mimetype.startsWith('audio/');
      const isVideo = req.file.mimetype.startsWith('video/');
      const resourceType = isAudio ? 'video' : 'auto';

      const result = await uploadToCloudinary(req.file.buffer, 'jolshaa/messages', resourceType);
      media = result.secure_url;
      fileName = req.file.originalname;
      fileSize = req.file.size;

      if (isAudio) {
        mediaType = req.body.isVoice === 'true' ? 'voice' : 'audio';
        voiceDuration = parseFloat(req.body.duration) || null;
      } else if (isVideo) {
        mediaType = 'video';
      } else if (req.file.mimetype.startsWith('image/')) {
        mediaType = 'image';
      } else {
        mediaType = 'file';
      }
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      text: text || '',
      media,
      mediaType,
      fileName,
      fileSize,
      voiceDuration,
      replyTo: replyTo || null,
      readBy: [req.user._id],
    });

    await message.populate('sender', 'name profilePhoto');
    if (replyTo) {
      await message.populate('replyTo');
    }

    conversation.updatedAt = new Date();
    await conversation.save();

    getIO().to(`conversation:${conversationId}`).emit('newMessage', {
      ...message.toObject(),
      conversationId,
    });

    const otherParticipants = conversation.participants.filter(
      (p) => p.toString() !== req.user._id.toString()
    );

    for (const participantId of otherParticipants) {
      getIO().to(`user:${participantId}`).emit('newMessageNotification', {
        conversationId,
        message: {
          _id: message._id,
          text: message.text,
          sender: { _id: req.user._id, name: req.user.name, profilePhoto: req.user.profilePhoto },
        },
      });
    }

    res.status(201).json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.reactToMessage = async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    const existingIndex = message.reactions.findIndex(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (existingIndex >= 0) {
      if (message.reactions[existingIndex].emoji === emoji) {
        message.reactions.splice(existingIndex, 1);
      } else {
        message.reactions[existingIndex].emoji = emoji;
      }
    } else {
      message.reactions.push({ user: req.user._id, emoji });
    }

    await message.save();

    getIO().to(`conversation:${message.conversation}`).emit('messageReaction', {
      messageId: message._id,
      reactions: message.reactions,
    });

    res.json({ reactions: message.reactions });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.editMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.text = text;
    message.isEdited = true;
    await message.save();

    getIO().to(`conversation:${message.conversation}`).emit('messageEdited', {
      messageId: message._id,
      text,
    });

    res.json({ message });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.isDeleted = true;
    message.text = '';
    message.media = null;
    await message.save();

    getIO().to(`conversation:${message.conversation}`).emit('messageDeleted', {
      messageId: message._id,
    });

    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.searchMessages = async (req, res) => {
  try {
    const { query } = req.query;
    const { conversationId } = req.params;

    if (!query) return res.status(400).json({ message: 'Search query required' });

    const messages = await Message.find({
      conversation: conversationId,
      $text: { $search: query },
      isDeleted: false,
    })
      .populate('sender', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.archiveConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    const isArchived = hasId(conversation.archivedBy, req.user._id);
    if (isArchived) {
      conversation.archivedBy.pull(req.user._id);
    } else {
      conversation.archivedBy.push(req.user._id);
    }
    await conversation.save();

    res.json({ isArchived: !isArchived });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.pinConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    const isPinned = hasId(conversation.pinnedBy, req.user._id);
    if (isPinned) {
      conversation.pinnedBy.pull(req.user._id);
    } else {
      conversation.pinnedBy.push(req.user._id);
    }
    await conversation.save();

    res.json({ isPinned: !isPinned });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.muteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    const isMuted = hasId(conversation.mutedBy, req.user._id);
    if (isMuted) {
      conversation.mutedBy.pull(req.user._id);
    } else {
      conversation.mutedBy.push(req.user._id);
    }
    await conversation.save();

    res.json({ isMuted: !isMuted });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addGroupAdmin = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }
    if (!hasId(conversation.admins, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { userId } = req.body;
    if (!hasId(conversation.admins, userId)) {
      conversation.admins.push(userId);
      await conversation.save();
    }

    res.json({ admins: conversation.admins });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeGroupAdmin = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
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

exports.startWatchParty = async (req, res) => {
  try {
    const { videoUrl } = req.body;
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    conversation.watchParty = {
      active: true,
      videoUrl,
      host: req.user._id,
      viewers: [req.user._id],
    };
    await conversation.save();

    getIO().to(`conversation:${conversation._id}`).emit('watchPartyStarted', {
      videoUrl,
      host: req.user._id,
    });

    res.json({ watchParty: conversation.watchParty });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.joinWatchParty = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation || !conversation.watchParty.active) {
      return res.status(400).json({ message: 'No active watch party' });
    }

    if (!hasId(conversation.watchParty.viewers, req.user._id)) {
      conversation.watchParty.viewers.push(req.user._id);
      await conversation.save();
    }

    getIO().to(`conversation:${conversation._id}`).emit('watchPartyJoined', {
      userId: req.user._id,
      viewerCount: conversation.watchParty.viewers.length,
    });

    res.json({ watchParty: conversation.watchParty });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.endWatchParty = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    conversation.watchParty = { active: false, videoUrl: '', host: null, viewers: [] };
    await conversation.save();

    getIO().to(`conversation:${conversation._id}`).emit('watchPartyEnded');

    res.json({ message: 'Watch party ended' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
