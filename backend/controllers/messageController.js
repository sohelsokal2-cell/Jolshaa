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
    const { conversationId, text, replyTo, forwardedFrom } = req.body;

    const currentUser = await User.findById(req.user._id).select('restrictions');
    const msgRestricted = currentUser.restrictions?.find(r => r.type === 'message' && (!r.expiresAt || r.expiresAt > new Date()));
    if (msgRestricted) {
      return res.status(403).json({ message: 'You are restricted from sending messages', restricted: true });
    }

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
    let mediaMetadata = {};

    if (req.file) {
      const isAudio = req.file.mimetype.startsWith('audio/');
      const isVideo = req.file.mimetype.startsWith('video/');
      const resourceType = isAudio ? 'video' : 'auto';

      const result = await uploadToCloudinary(req.file.buffer, 'jolshaa/messages', resourceType);
      media = result.secure_url;
      fileName = req.file.originalname;
      fileSize = req.file.size;
      mediaMetadata = {
        width: result.width || null,
        height: result.height || null,
        duration: result.duration || null,
      };

      if (isAudio) {
        mediaType = req.body.isVoice === 'true' ? 'voice' : 'audio';
        voiceDuration = parseFloat(req.body.duration) || null;
        mediaMetadata.duration = voiceDuration;
      } else if (isVideo) {
        mediaType = 'video';
      } else if (req.file.mimetype.startsWith('image/')) {
        mediaType = 'image';
      } else {
        mediaType = 'file';
      }
    }

    const messageData = {
      conversation: conversationId,
      sender: req.user._id,
      text: text ? String(text).substring(0, 2000) : '',
      media,
      mediaType,
      fileName,
      fileSize,
      voiceDuration,
      mediaMetadata,
      replyTo: replyTo || null,
      forwardedFrom: forwardedFrom || null,
      readBy: [req.user._id],
    };

    // Link preview detection
    if (text && !media) {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = text.match(urlRegex);
      if (urls && urls.length > 0) {
        messageData.linkPreview = { url: urls[0] };
      }
    }

    const message = await Message.create(messageData);

    await message.populate('sender', 'name profilePhoto');
    if (replyTo) await message.populate('replyTo');
    if (forwardedFrom) await message.populate('forwardedFrom');

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      updatedAt: new Date(),
    });

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
          sender: { _id: message.sender._id, name: message.sender.name, profilePhoto: message.sender.profilePhoto },
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

    const editWindowMs = 15 * 60 * 1000;
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    if (messageAge > editWindowMs) {
      return res.status(400).json({ message: 'Edit window has expired (15 minutes)' });
    }

    if (message.text && message.text !== text) {
      message.editHistory.push({
        text: message.text,
        editedAt: new Date(),
      });
    }

    message.text = String(text).substring(0, 2000);
    message.isEdited = true;
    await message.save();

    getIO().to(`conversation:${message.conversation}`).emit('messageEdited', {
      messageId: message._id,
      text,
      editHistory: message.editHistory,
    });

    res.json({ message });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { deleteForEveryone } = req.body;
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    if (deleteForEveryone) {
      if (message.sender.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      const deleteWindowMs = 10 * 60 * 1000;
      const messageAge = Date.now() - new Date(message.createdAt).getTime();
      if (messageAge > deleteWindowMs) {
        return res.status(400).json({ message: 'Delete for everyone window has expired (10 minutes)' });
      }

      message.text = '';
      message.media = null;
      message.mediaType = null;
      message.fileName = null;
      message.fileSize = null;
      message.voiceDuration = null;
      message.deletedForEveryone = true;
      message.isDeleted = true;
      await message.save();

      getIO().to(`conversation:${message.conversation}`).emit('messageDeleted', {
        messageId: message._id,
        deletedForEveryone: true,
      });
    } else {
      if (!hasId(message.deletedFor, req.user._id)) {
        message.deletedFor.push(req.user._id);
        await message.save();
      }

      getIO().to(`user:${req.user._id}`).emit('messageDeleted', {
        messageId: message._id,
        deletedForMe: true,
      });
    }

    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.forwardMessage = async (req, res) => {
  try {
    const { messageIds, targetConversationIds } = req.body;

    if (!messageIds || messageIds.length === 0) {
      return res.status(400).json({ message: 'No messages to forward' });
    }
    if (!targetConversationIds || targetConversationIds.length === 0) {
      return res.status(400).json({ message: 'No target conversations' });
    }
    if (messageIds.length > 20) {
      return res.status(400).json({ message: 'Cannot forward more than 20 messages at once' });
    }
    if (targetConversationIds.length > 10) {
      return res.status(400).json({ message: 'Cannot forward to more than 10 conversations at once' });
    }

    const originalMessages = await Message.find({ _id: { $in: messageIds } });
    if (originalMessages.length === 0) {
      return res.status(404).json({ message: 'Messages not found' });
    }

    const validConversations = await Conversation.find({
      _id: { $in: targetConversationIds },
      participants: req.user._id,
    }).select('_id');

    const validConvIds = validConversations.map(c => c._id.toString());
    if (validConvIds.length === 0) {
      return res.status(404).json({ message: 'No valid target conversations' });
    }

    const docsToInsert = [];
    const lastMessagePerConv = {};

    for (const convId of validConvIds) {
      for (const origMsg of originalMessages) {
        const doc = {
          conversation: convId,
          sender: req.user._id,
          text: origMsg.text,
          media: origMsg.media,
          mediaType: origMsg.mediaType,
          fileName: origMsg.fileName,
          fileSize: origMsg.fileSize,
          voiceDuration: origMsg.voiceDuration,
          mediaMetadata: origMsg.mediaMetadata,
          forwardedFrom: origMsg._id,
          readBy: [req.user._id],
        };
        docsToInsert.push(doc);
        lastMessagePerConv[convId] = null;
      }
    }

    const insertedMessages = await Message.insertMany(docsToInsert, { ordered: true });

    const sender = await User.findById(req.user._id).select('name profilePhoto');

    const convUpdates = [];
    for (const msg of insertedMessages) {
      lastMessagePerConv[msg.conversation.toString()] = msg._id;
    }
    for (const [convId, lastMsgId] of Object.entries(lastMessagePerConv)) {
      if (lastMsgId) {
        convUpdates.push(
          Conversation.findByIdAndUpdate(convId, { lastMessage: lastMsgId, updatedAt: new Date() })
        );
      }
    }
    await Promise.all(convUpdates);

    const populatedMessages = insertedMessages.map(msg => ({
      ...msg.toObject(),
      sender: sender ? { _id: sender._id, name: sender.name, profilePhoto: sender.profilePhoto } : req.user._id,
    }));

    for (const msg of populatedMessages) {
      getIO().to(`conversation:${msg.conversation}`).emit('newMessage', {
        ...msg,
        conversationId: msg.conversation,
      });
    }

    res.json({ messages: populatedMessages });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.pinMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    const conversation = await Conversation.findById(message.conversation);
    if (!conversation || !conversation.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const wasPinned = message.isPinned;
    message.isPinned = !wasPinned;
    message.pinnedBy = wasPinned ? null : req.user._id;
    message.pinnedAt = wasPinned ? null : new Date();
    await message.save();

    getIO().to(`conversation:${message.conversation}`).emit('messagePinned', {
      messageId: message._id,
      isPinned: message.isPinned,
      pinnedBy: req.user._id,
    });

    res.json({ isPinned: message.isPinned });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.markAsSeen = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    await Conversation.findByIdAndUpdate(conversationId, {
      [`unreadCount.${req.user._id}`]: 0,
    });

    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user._id },
        readBy: { $ne: req.user._id },
      },
      { $addToSet: { readBy: req.user._id } }
    );

    getIO().to(`conversation:${conversationId}`).emit('messagesSeen', {
      conversationId,
      userId: req.user._id,
      seenAt: new Date(),
    });

    res.json({ message: 'Messages marked as seen' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.searchMessages = async (req, res) => {
  try {
    const { query } = req.query;
    const { conversationId } = req.params;

    if (!query) return res.status(400).json({ message: 'Search query required' });

    const conversation = await Conversation.findOne({ _id: conversationId, participants: req.user._id }).select('_id');
    if (!conversation) return res.status(403).json({ message: 'Not authorized' });

    const messages = await Message.find({
      conversation: conversationId,
      $text: { $search: query },
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

exports.startWatchParty = async (req, res) => {
  try {
    const { videoUrl } = req.body;
    if (!videoUrl || !/^https?:\/\//i.test(videoUrl)) {
      return res.status(400).json({ message: 'Valid video URL is required' });
    }
    const conversation = await Conversation.findOne({ _id: req.params.conversationId, participants: req.user._id });
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
    const conversation = await Conversation.findOne({ _id: req.params.conversationId, participants: req.user._id });
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
    const conversation = await Conversation.findOne({ _id: req.params.conversationId, participants: req.user._id });
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    conversation.watchParty = { active: false, videoUrl: '', host: null, viewers: [] };
    await conversation.save();

    getIO().to(`conversation:${conversation._id}`).emit('watchPartyEnded');

    res.json({ message: 'Watch party ended' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
