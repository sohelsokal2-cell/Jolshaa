const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
const Notification = require('./models/Notification');
const User = require('./models/User');

let io;
const onlineUsers = new Map(); // userId -> Set<socketId>

const SOCKET_RATE_LIMIT = {
  typing: { windowMs: 10_000, max: 20 },
  sendMessage: { windowMs: 10_000, max: 10 },
  sendNotification: { windowMs: 10_000, max: 20 },
  liveComment: { windowMs: 60_000, max: 5 },
};

const makeRateLimiter = () => {
  // key: `${userId}:${action}` => { count, windowStart }
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
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
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

  // Parity checks for socket liveComment:
  // - comment restriction
  // - block checks
  // - post privacy / commentPrivacy checks
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

    // If post author != current user => enforce block/privacy
    if (post.author.toString() !== currentUser._id.toString()) {
      const postAuthor = await User.findById(post.author).select('blockedUsers privacy');
      const commenter = await User.findById(currentUser._id).select('blockedUsers');

      if (postAuthor && postAuthor.blockedUsers?.some((id) => id.toString() === currentUser._id.toString())) {
        return { ok: false, message: 'You are blocked by this user' };
      }

      if (commenter && commenter.blockedUsers?.some((id) => id.toString() === post.author.toString())) {
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

    // Enforce banned/suspended
    try {
      const freshUser = await User.findById(userId).select(
        'isBanned isSuspended bannedAt bannedReason suspendedAt suspendedReason restrictions'
      );
      if (!freshUser) return socket.disconnect(true);
      if (freshUser.isBanned) return socket.disconnect(true);
      if (freshUser.isSuspended) return socket.disconnect(true);

      socket.user = freshUser;
    } catch (e) {
      return socket.disconnect(true);
    }

    console.log(`User connected: ${userId}`);

    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    io.emit('userOnline', userId);

    socket.join(`user:${userId}`);

    socket.on('joinConversation', async (conversationId) => {
      if (!(await ensureConversationAccess(conversationId, userId))) {
        return sendSocketError(socket, 'Not authorized');
      }
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('leaveConversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('sendMessage', async (data) => {
      const { conversationId, text, media } = data || {};
      const rl = rateLimiter(userId, 'sendMessage');
      if (!rl.allowed) return sendSocketError(socket, 'Too many messages, slow down');

      if (!(await ensureConversationAccess(conversationId, userId))) {
        return sendSocketError(socket, 'Not authorized');
      }

      try {
        const message = await Message.create({
          conversation: conversationId,
          sender: userId,
          text: text || '',
          media: media || null,
          readBy: [userId],
        });

        await message.populate('sender', 'name profilePhoto');

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

        if (!recipientId) return;
        if (recipientId === userId) return;

        const allowedTypes = ['comment', 'like', 'message', 'notification', 'follow', 'reply', 'system'];
        const safeType = allowedTypes.includes(type) ? type : 'notification';

        const notification = await Notification.create({
          recipient: recipientId,
          sender: userId,
          type: safeType,
          relatedPost: relatedPost || null,
          relatedComment: relatedComment || null,
          relatedConversation: relatedConversation || null,
        });

        await notification.populate('sender', 'name profilePhoto');
        io.to(`user:${recipientId}`).emit('newNotification', notification);
      } catch (err) {
        // avoid console spam: still standardize payload
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

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);

      const userSockets = onlineUsers.get(userId);
      if (!userSockets) return;

      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        onlineUsers.delete(userId);
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
