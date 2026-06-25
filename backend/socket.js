const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('./models/Message');
const Notification = require('./models/Notification');

let io;
const onlineUsers = new Map(); // userId -> Set<socketId>

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: 'http://localhost:3000',
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

    // --- Conversation events ---
    socket.on('joinConversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('leaveConversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('sendMessage', async (data) => {
      try {
        const { conversationId, text, media } = data;

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
    socket.on('typing', ({ conversationId, userName }) => {
      socket.to(`conversation:${conversationId}`).emit('typing', {
        conversationId,
        userId,
        userName
      });
    });

    socket.on('stopTyping', ({ conversationId }) => {
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
