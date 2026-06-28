const generateRoomId = () => {
  return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

const TURN_SERVERS = process.env.TURN_SERVERS
  ? JSON.parse(process.env.TURN_SERVERS)
  : [];

if (TURN_SERVERS.length > 0) {
  ICE_SERVERS.iceServers.push(...TURN_SERVERS);
}

const setupCallSignaling = (io) => {
  const callNamespace = io.of('/calls');

  callNamespace.on('connection', (socket) => {
    console.log(`[Call] User connected: ${socket.id}`);

    socket.on('call:join', ({ roomId, userId, userName }) => {
      socket.join(roomId);
      socket.roomId = roomId;
      socket.userId = userId;
      socket.userName = userName;

      const room = callNamespace.adapter.rooms.get(roomId);
      const users = [];
      if (room) {
        for (const id of room) {
          const client = callNamespace.sockets.get(id);
          if (client && client.userId !== userId) {
            users.push({ id, userId: client.userId, userName: client.userName });
          }
        }
      }

      socket.emit('call:users', { users });
      socket.to(roomId).emit('call:user-joined', { userId, userName, socketId: socket.id });
    });

    socket.on('call:signal', ({ to, from, signal }) => {
      callNamespace.to(to).emit('call:signal', { from, signal, socketId: socket.id });
    });

    socket.on('call:end', ({ roomId }) => {
      socket.to(roomId).emit('call:user-left', { userId: socket.userId });
      socket.leave(roomId);
    });

    socket.on('call:reject', ({ roomId, userId }) => {
      socket.to(roomId).emit('call:rejected', { userId });
    });

    socket.on('disconnect', () => {
      if (socket.roomId) {
        socket.to(socket.roomId).emit('call:user-left', { userId: socket.userId });
      }
      console.log(`[Call] User disconnected: ${socket.id}`);
    });
  });
};

module.exports = {
  generateRoomId,
  ICE_SERVERS,
  setupCallSignaling,
};
