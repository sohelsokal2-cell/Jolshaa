const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
const Notification = require('./models/Notification');

let io;
const onlineUsers = new Map(); // userId -> Set<socketId>

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        const allowedOrigins = [
          process.env.CLIENT_URL,
          'http://localhost:3000',
          'http://localhost:5173',
        ].filter(Boolean).map(o => o.replace(/\/$/, ''));
        if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`User connected: ${userId}`);

    // Track online user
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Broadcast user online status
    io.emit('userOnline', userId);

    // Join user's personal room for targeted notifications
    socket.join(`user:${userId}`);

    const ensureConversationAccess = async (conversationId) => {
      if (!conversationId) return false;

      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
      }).select('_id');

      return Boolean(conversation);
    };

    // --- Conversation events ---
    socket.on('joinConversation', async (conversationId) => {
      if (!(await ensureConversationAccess(conversationId))) {
        socket.emit('error', { message: 'Not authorized' });
        return;
      }

      socket.join(`conversation:${conversationId}`);
    });

    socket.on('leaveConversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('sendMessage', async (data) => {
      try {
        const { conversationId, text, media } = data;

        if (!(await ensureConversationAccess(conversationId))) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }

        const message = await Message.create({
          conversation: conversationId,
          sender: userId,
          text: text || '',
          media: media || null,
          readBy: [userId]
        });

        await message.populate('sender', 'name profilePhoto');

        // Emit to conversation room
        io.to(`conversation:${conversationId}`).emit('newMessage', {
          ...message.toObject(),
          conversationId
        });
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // --- Typing events ---
    socket.on('typing', async ({ conversationId, userName }) => {
      if (!(await ensureConversationAccess(conversationId))) return;

      socket.to(`conversation:${conversationId}`).emit('typing', {
        conversationId,
        userId,
        userName
      });
    });

    socket.on('stopTyping', async ({ conversationId }) => {
      if (!(await ensureConversationAccess(conversationId))) return;

      socket.to(`conversation:${conversationId}`).emit('stopTyping', {
        conversationId,
        userId
      });
    });

    // --- Notification events ---
    socket.on('sendNotification', async (data) => {
      try {
        const { recipientId, type, relatedPost, relatedComment, relatedConversation } = data;

        if (recipientId === userId) return; // Don't notify self

        const notification = await Notification.create({
          recipient: recipientId,
          sender: userId,
          type,
          relatedPost: relatedPost || null,
          relatedComment: relatedComment || null,
          relatedConversation: relatedConversation || null
        });

        await notification.populate('sender', 'name profilePhoto');

        io.to(`user:${recipientId}`).emit('newNotification', notification);
      } catch (err) {
        console.error('Failed to send notification:', err.message);
      }
    });

    // --- Live comments for posts/reels ---
    socket.on('joinPostRoom', (postId) => {
      socket.join(`post:${postId}`);
    });

    socket.on('leavePostRoom', (postId) => {
      socket.leave(`post:${postId}`);
    });

    socket.on('liveComment', async (data) => {
      try {
        const { postId, text } = data;
        if (!postId || !text) return;

        const Post = require('./models/Post');
        const post = await Post.findById(postId);
        if (!post) return;

        const Comment = require('./models/Comment');
        const comment = await Comment.create({
          post: postId,
          author: userId,
          text,
        });

        await comment.populate('author', 'name profilePhoto');

        io.to(`post:${postId}`).emit('newLiveComment', {
          ...comment.toObject(),
          postId,
        });
      } catch (err) {
        socket.emit('error', { message: 'Failed to post comment' });
      }
    });

    // --- Disconnect ---
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);

      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('userOffline', userId);
        }
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

const isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};

const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

module.exports = { initSocket, getIO, onlineUsers, isUserOnline, emitToUser };
