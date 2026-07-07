const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
const Notification = require('./models/Notification');
const User = require('./models/User');
const CallLog = require('./models/CallLog');
const { hasId } = require('./utils/id');
const { validateNotificationPayload } = require('./utils/socketValidation');

let io;
const onlineUsers = new Map(); // userId -> Set<socketId>
const activeCalls = new Map(); // userId -> { callerId, callType, conversationId }

const SOCKET_RATE_LIMIT = {
  typing: { windowMs: 10_000, max: 20 },
  sendMessage: { windowMs: 10_000, max: 10 },
  sendNotification: { windowMs: 10_000, max: 20 },
  liveComment: { windowMs: 60_000, max: 5 },
  markAsSeen: { windowMs: 10_000, max: 30 },
};

const makeRateLimiter = () => {
  const state = new Map();
  return (userId, action) => {
    const rule = SOCKET_RATE_LIMIT[action];
    if (!rule) return { allowed: true };

    const key = `${userId}:${action}`;
    const now = Date.now();
    const existing = state.get(key);

    if (!existing || now - existing.windowStart > rule.windowMs) {
      state.set(key, { count: 1, windowStart: now });
      return { allowed: true };
    }

    if (existing.count >= rule.max) {
      return {
        allowed: false,
        retryAfterMs: rule.windowMs - (now - existing.windowStart),
      };
    }

    existing.count += 1;
    state.set(key, existing);
    return { allowed: true };
  };
};

const sendSocketError = (socket, message) => {
  socket.emit('error', { message });
};

const initSocket = (httpServer) => {
  const rateLimiter = makeRateLimiter();

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        const allowedOrigins = [
          process.env.CLIENT_URL,
          'https://jolshaa.vercel.app',
          'http://localhost:3000',
          'http://localhost:5173',
        ]
          .filter(Boolean)
          .map((o) => o.replace(/\/$/, ''));

        if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Auth middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const freshUser = await User.findById(decoded.id).select(
        'isBanned isSuspended bannedAt bannedReason suspendedAt suspendedReason restrictions friends'
      );

      if (!freshUser || freshUser.isBanned || freshUser.isSuspended) {
        return next(new Error('Account unavailable'));
      }

      socket.userId = freshUser._id.toString();
      socket.user = freshUser;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  const ensureConversationAccess = async (conversationId, userId) => {
    if (!conversationId) return false;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    }).select('_id');

    return Boolean(conversation);
  };

  const ensureCanLiveComment = async (reqUser, postId, text) => {
    if (!postId || !text || typeof text !== 'string' || text.trim().length === 0) {
      return { ok: false, message: 'Invalid comment' };
    }

    const currentUser = reqUser;

    const commentRestricted = currentUser?.restrictions?.find(
      (r) => r.type === 'comment' && (!r.expiresAt || r.expiresAt > new Date())
    );
    if (commentRestricted) {
      return { ok: false, message: 'You are restricted from commenting' };
    }

    const Post = require('./models/Post');
    const post = await Post.findById(postId).select('author privacy');
    if (!post) return { ok: false, message: 'Post not found' };

    if (post.author.toString() !== currentUser._id.toString()) {
      const postAuthor = await User.findById(post.author).select('blockedUsers privacy');
      const commenter = await User.findById(currentUser._id).select('blockedUsers');

      if (postAuthor && hasId(postAuthor.blockedUsers, currentUser._id)) {
        return { ok: false, message: 'You are blocked by this user' };
      }

      if (commenter && hasId(commenter.blockedUsers, post.author)) {
        return { ok: false, message: 'You have blocked this user' };
      }

      if (postAuthor?.privacy?.commentPrivacy === 'none') {
        return { ok: false, message: 'Comments are disabled on this post' };
      }
    }

    return { ok: true };
  };

  io.on('connection', async (socket) => {
    const userId = socket.userId;

    if (!socket.user) return socket.disconnect(true);
    if (socket.user.isBanned || socket.user.isSuspended) return socket.disconnect(true);

    console.log(`User connected: ${userId}`);

    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    // Update user lastSeen and activeStatus
    try {
      await User.findByIdAndUpdate(userId, { lastSeen: new Date(), activeStatus: 'online' });
    } catch (e) { /* ignore */ }

    // Notify friends that user came online
    try {
      const userFriends = socket.user.friends || [];
      const friendIds = userFriends.map(id => id.toString());
      for (const friendId of friendIds) {
        if (onlineUsers.has(friendId)) {
          io.to(`user:${friendId}`).emit('userOnline', userId);
        }
      }
      // Also broadcast to all for backward compatibility
      io.emit('userOnline', userId);
    } catch (e) { /* ignore */ }

    socket.join(`user:${userId}`);

    // Help system: join district room
    socket.on('joinDistrictRoom', ({ district }) => {
      if (district && typeof district === 'string') {
        socket.rooms.forEach(room => {
          if (room.startsWith('district_')) {
            socket.leave(room);
          }
        });
        socket.join(`district_${district}`);
      }
    });

    socket.on('joinConversation', async (conversationId) => {
      if (!(await ensureConversationAccess(conversationId, userId))) {
        return sendSocketError(socket, 'Not authorized');
      }
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('leaveConversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Send message via socket
    socket.on('sendMessage', async (data) => {
      const { conversationId, text, media, mediaType, replyTo, forwardedFrom } = data || {};
      const rl = rateLimiter(userId, 'sendMessage');
      if (!rl.allowed) return sendSocketError(socket, 'Too many messages, slow down');

      if (!(await ensureConversationAccess(conversationId, userId))) {
        return sendSocketError(socket, 'Not authorized');
      }

      try {
        const messageData = {
          conversation: conversationId,
          sender: userId,
          text: text ? String(text).substring(0, 2000) : '',
          media: media || null,
          mediaType: mediaType || null,
          replyTo: replyTo || null,
          forwardedFrom: forwardedFrom || null,
          readBy: [userId],
        };

        const message = await Message.create(messageData);
        await message.populate('sender', 'name profilePhoto');
        if (replyTo) {
          await message.populate('replyTo');
        }

        // Update conversation lastMessage and unread counts
        const conversation = await Conversation.findById(conversationId).select('participants');
        const unreadInc = {};
        if (conversation) {
          conversation.participants.forEach(p => {
            if (p.toString() !== userId.toString()) {
              unreadInc[`unreadCount.${p.toString()}`] = 1;
            }
          });
        }
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id,
          $inc: unreadInc,
        });

        io.to(`conversation:${conversationId}`).emit('newMessage', {
          ...message.toObject(),
          conversationId,
        });
      } catch (err) {
        sendSocketError(socket, 'Failed to send message');
      }
    });

    socket.on('typing', async ({ conversationId, userName } = {}) => {
      const rl = rateLimiter(userId, 'typing');
      if (!rl.allowed) return;

      if (!(await ensureConversationAccess(conversationId, userId))) return;

      socket.to(`conversation:${conversationId}`).emit('typing', {
        conversationId,
        userId,
        userName,
      });
    });

    socket.on('stopTyping', async ({ conversationId } = {}) => {
      if (!(await ensureConversationAccess(conversationId, userId))) return;
      socket.to(`conversation:${conversationId}`).emit('stopTyping', {
        conversationId,
        userId,
      });
    });

    // Mark messages as seen / read
    socket.on('markAsSeen', async ({ conversationId, messageIds } = {}) => {
      const rl = rateLimiter(userId, 'markAsSeen');
      if (!rl.allowed) return;

      if (!(await ensureConversationAccess(conversationId, userId))) return;

      try {
        // Reset unread count for this user
        await Conversation.findByIdAndUpdate(conversationId, {
          [`unreadCount.${userId}`]: 0,
        });

        if (messageIds && messageIds.length > 0) {
          await Message.updateMany(
            { _id: { $in: messageIds }, conversation: conversationId },
            { $addToSet: { readBy: userId } }
          );
        }

        socket.to(`conversation:${conversationId}`).emit('messagesSeen', {
          conversationId,
          userId,
          seenAt: new Date(),
        });
      } catch (err) {
        sendSocketError(socket, 'Failed to mark as seen');
      }
    });

    // Forward a message
    socket.on('forwardMessage', async (data) => {
      const { originalMessageId, targetConversationIds, text } = data || {};

      if (!originalMessageId || !targetConversationIds || targetConversationIds.length === 0) {
        return sendSocketError(socket, 'Invalid forward data');
      }

      try {
        const originalMessage = await Message.findById(originalMessageId);
        if (!originalMessage) return sendSocketError(socket, 'Original message not found');

        const forwardedMessages = [];

        for (const targetConvId of targetConversationIds) {
          if (!(await ensureConversationAccess(targetConvId, userId))) continue;

          const message = await Message.create({
            conversation: targetConvId,
            sender: userId,
            text: text || originalMessage.text,
            media: originalMessage.media,
            mediaType: originalMessage.mediaType,
            fileName: originalMessage.fileName,
            fileSize: originalMessage.fileSize,
            voiceDuration: originalMessage.voiceDuration,
            forwardedFrom: originalMessageId,
            readBy: [userId],
          });

          await message.populate('sender', 'name profilePhoto');

          await Conversation.findByIdAndUpdate(targetConvId, {
            lastMessage: message._id,
          });

          io.to(`conversation:${targetConvId}`).emit('newMessage', {
            ...message.toObject(),
            conversationId: targetConvId,
          });

          forwardedMessages.push(message);
        }

        socket.emit('forwardSuccess', { messages: forwardedMessages });
      } catch (err) {
        sendSocketError(socket, 'Failed to forward message');
      }
    });

    // Pin/Unpin message
    socket.on('pinMessage', async ({ conversationId, messageId }) => {
      if (!(await ensureConversationAccess(conversationId, userId))) return;

      try {
        const message = await Message.findById(messageId);
        if (!message) return sendSocketError(socket, 'Message not found');

        const wasPinned = message.isPinned;
        message.isPinned = !wasPinned;
        message.pinnedBy = wasPinned ? null : userId;
        message.pinnedAt = wasPinned ? null : new Date();
        await message.save();

        io.to(`conversation:${conversationId}`).emit('messagePinned', {
          conversationId,
          messageId,
          isPinned: message.isPinned,
          pinnedBy: userId,
        });
      } catch (err) {
        sendSocketError(socket, 'Failed to pin message');
      }
    });

    // Send notification
    socket.on('sendNotification', async (data) => {
      const rl = rateLimiter(userId, 'sendNotification');
      if (!rl.allowed) return sendSocketError(socket, 'Too many notifications, slow down');

      try {
        const {
          recipientId,
          type,
          relatedPost,
          relatedComment,
          relatedConversation,
        } = data || {};

        const validation = validateNotificationPayload({
          recipientId,
          type,
          relatedPost,
          relatedComment,
          relatedConversation,
        });

        if (!validation.ok) return sendSocketError(socket, validation.message);
        if (recipientId === userId) return;

        const recipientExists = await User.findById(recipientId).select('_id');
        if (!recipientExists) return sendSocketError(socket, 'Recipient not found');

        const notification = await Notification.create({
          recipient: recipientId,
          sender: userId,
          type: validation.type,
          relatedPost: validation.relatedPost,
          relatedComment: validation.relatedComment,
          relatedConversation: validation.relatedConversation,
        });

        await notification.populate('sender', 'name profilePhoto');
        io.to(`user:${recipientId}`).emit('newNotification', notification);
      } catch (err) {
        sendSocketError(socket, 'Failed to send notification');
      }
    });

    socket.on('joinPostRoom', (postId) => {
      if (!postId) return;
      socket.join(`post:${postId}`);
    });

    socket.on('leavePostRoom', (postId) => {
      if (!postId) return;
      socket.leave(`post:${postId}`);
    });

    socket.on('liveComment', async (data) => {
      const rl = rateLimiter(userId, 'liveComment');
      if (!rl.allowed) return sendSocketError(socket, 'Too many comments, slow down');

      try {
        const { postId, text } = data || {};
        const can = await ensureCanLiveComment(socket.user, postId, text);
        if (!can.ok) return sendSocketError(socket, can.message);

        const Comment = require('./models/Comment');
        const comment = await Comment.create({
          post: postId,
          author: userId,
          text: String(text).trim(),
        });

        await comment.populate('author', 'name profilePhoto');

        io.to(`post:${postId}`).emit('newLiveComment', {
          ...comment.toObject(),
          postId,
        });
      } catch (err) {
        sendSocketError(socket, 'Failed to post comment');
      }
    });

    // Update active status
    socket.on('updateActiveStatus', async ({ status } = {}) => {
      const allowedStatuses = ['online', 'away', 'busy'];
      if (!allowedStatuses.includes(status)) return;

      try {
        await User.findByIdAndUpdate(userId, { activeStatus: status });
        const userFriends = socket.user.friends || [];
        for (const friendId of userFriends) {
          io.to(`user:${friendId.toString()}`).emit('activeStatusChanged', { userId, status });
        }
      } catch (e) { /* ignore */ }
    });

    // ========== WebRTC Signaling Events ==========

    // Caller initiates a call
    socket.on('callUser', async ({ to, offer, callType, conversationId }) => {
      if (!to || !offer) return;

      if (!(await ensureConversationAccess(conversationId, userId))) {
        return sendSocketError(socket, 'Not authorized');
      }

      // Check if recipient is already in a call
      if (activeCalls.has(to)) {
        return socket.emit('callBusy', { to });
      }

      // Check if recipient is online
      if (!onlineUsers.has(to)) {
        return socket.emit('callOffline', { to });
      }

      // Get caller info for the notification
      let callerInfo = null;
      try {
        const callerUser = await User.findById(userId).select('name profilePhoto');
        if (callerUser) {
          callerInfo = { _id: callerUser._id, name: callerUser.name, profilePhoto: callerUser.profilePhoto };
        }
      } catch (e) { /* ignore */ }

      // Track active call
      activeCalls.set(userId, { otherUserId: to, callType, conversationId, initiator: userId, logWritten: false });
      activeCalls.set(to, { otherUserId: userId, callType, conversationId, initiator: userId, logWritten: false });

      io.to(`user:${to}`).emit('incomingCall', {
        from: userId,
        offer,
        callType,
        conversationId,
        callerInfo,
      });
    });

    // Receiver answers the call
    socket.on('callAnswer', async ({ to, answer }) => {
      if (!to || !answer) return;

      const callData = activeCalls.get(userId);
      if (!(await ensureConversationAccess(callData?.conversationId, userId))) {
        return sendSocketError(socket, 'Not authorized');
      }

      io.to(`user:${to}`).emit('callAnswered', {
        answer,
        from: userId,
      });
    });

    // ICE candidate exchange
    socket.on('iceCandidate', ({ to, candidate }) => {
      if (!to || !candidate) return;

      io.to(`user:${to}`).emit('iceCandidate', {
        candidate,
        from: userId,
      });
    });

    // Either side ends the call
    socket.on('endCall', async ({ to, conversationId, callType, duration, status }) => {
      if (!to) return;

      const callData = activeCalls.get(userId);
      const initiator = callData?.initiator || userId;

      // Clear active call tracking
      activeCalls.delete(userId);
      activeCalls.delete(to);

      // Save call log (only once per call — use logWritten flag to prevent duplicates)
      try {
        if (conversationId && callType && !callData?.logWritten) {
          if (callData) callData.logWritten = true;
          await CallLog.create({
            conversation: conversationId,
            caller: initiator,
            receiver: initiator === userId ? to : userId,
            callType,
            status: status || 'completed',
            duration: duration || 0,
          });
        }
      } catch (e) {
        console.error('Failed to save call log:', e.message);
      }

      io.to(`user:${to}`).emit('callEnded', {
        from: userId,
        conversationId,
        callType,
        duration,
        status,
      });
    });

    // Receiver rejects the call
    socket.on('callRejected', async ({ to, conversationId, callType }) => {
      if (!to) return;

      const callData = activeCalls.get(userId);

      activeCalls.delete(userId);
      activeCalls.delete(to);

      // Save call log for rejected call (only once)
      try {
        if (conversationId && callType && !callData?.logWritten) {
          if (callData) callData.logWritten = true;
          await CallLog.create({
            conversation: conversationId,
            caller: to,
            receiver: userId,
            callType,
            status: 'rejected',
            duration: 0,
          });
        }
      } catch (e) { /* ignore */ }

      io.to(`user:${to}`).emit('callRejected', {
        from: userId,
      });
    });

    // Target is busy on another call
    socket.on('callBusy', ({ to }) => {
      if (!to) return;

      io.to(`user:${to}`).emit('callBusy', {
        from: userId,
      });
    });

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${userId}`);

      // Clean up active call if user disconnects during a call
      if (activeCalls.has(userId)) {
        const callData = activeCalls.get(userId);
        const otherUserId = callData.otherUserId;
        const initiator = callData.initiator;
        activeCalls.delete(userId);
        activeCalls.delete(otherUserId);

        // Save call log for missed/disconnected call (only once)
        try {
          if (callData.conversationId && callData.callType && !callData.logWritten) {
            await CallLog.create({
              conversation: callData.conversationId,
              caller: initiator,
              receiver: initiator === otherUserId ? userId : otherUserId,
              callType: callData.callType,
              status: 'missed',
              duration: 0,
            });
          }
        } catch (e) { /* ignore */ }

        io.to(`user:${otherUserId}`).emit('callEnded', {
          from: userId,
          conversationId: callData.conversationId,
          callType: callData.callType,
          duration: 0,
          status: 'missed',
        });
      }

      const userSockets = onlineUsers.get(userId);
      if (!userSockets) return;

      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        onlineUsers.delete(userId);

        // Update lastSeen and activeStatus
        try {
          await User.findByIdAndUpdate(userId, { lastSeen: new Date(), activeStatus: 'offline' });
        } catch (e) { /* ignore */ }

        // Notify friends that user went offline
        try {
          const freshUser = await User.findById(userId).select('friends');
          const friendIds = (freshUser?.friends || []).map(id => id.toString());
          for (const friendId of friendIds) {
            if (onlineUsers.has(friendId)) {
              io.to(`user:${friendId}`).emit('userOffline', userId);
            }
          }
        } catch (e) { /* ignore */ }

        io.emit('userOffline', userId);
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

const isUserOnline = (userId) => onlineUsers.has(userId);

const emitToUser = (userId, event, data) => {
  if (io) io.to(`user:${userId}`).emit(event, data);
};

module.exports = { initSocket, getIO, onlineUsers, isUserOnline, emitToUser };
