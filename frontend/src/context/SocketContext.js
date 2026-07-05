import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, getToken } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const socketRef = useRef(null);
  const activeChatRef = useRef(null);
  const audioContextRef = useRef(null);

  // Cleanup AudioContext on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, []);

  const playMessageSound = useCallback(() => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContextRef.current.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.2, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.25);
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.25);
    } catch (e) { /* ignore */ }
  }, []);

  const setActiveChat = useCallback((convId) => {
    activeChatRef.current = convId;
  }, []);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setOnlineUsers(new Set());
      setUnreadMessageCount(0);
      return;
    }

    const token = getToken();
    if (!token) return;

    const socketUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['polling', 'websocket'],
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      if (process.env.NODE_ENV === 'development') console.log('Socket connected');
    });

    newSocket.on('userOnline', (userId) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    });

    newSocket.on('userOffline', (userId) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    // New message notification handler
    newSocket.on('newMessageNotification', (data) => {
      const { conversationId, message } = data;

      // Don't notify if user is currently viewing this conversation
      if (activeChatRef.current === conversationId) return;

      // Play sound
      playMessageSound();

      // Update unread count
      setUnreadMessageCount(prev => prev + 1);

      // Browser notification
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const notification = new Notification(message.sender?.name || 'New Message', {
          body: message.text || 'Sent a message',
          icon: message.sender?.profilePhoto || '/logo192.png',
          tag: `message-${conversationId}`,
          renotify: true,
        });

        notification.onclick = () => {
          window.focus();
          window.location.href = `/messages/${conversationId}`;
          notification.close();
        };
      }
    });

    // In-app notifications
    newSocket.on('newNotification', (notification) => {
      // Browser notification for non-message types
      if (notification.type !== 'message' && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const text = getNotificationText(notification);
        new Notification(notification.sender?.name || 'Notification', {
          body: text,
          icon: notification.sender?.profilePhoto || '/logo192.png',
          tag: `notif-${notification._id}`,
        });
      }
    });

    newSocket.on('connect_error', (err) => {
      console.warn('Socket connection error (non-critical):', err.message);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{
      socket,
      onlineUsers,
      unreadMessageCount,
      setActiveChat,
      clearUnreadMessages: () => setUnreadMessageCount(0),
    }}>
      {children}
    </SocketContext.Provider>
  );
};

const getNotificationText = (notif) => {
  switch (notif.type) {
    case 'friend_request': return 'sent you a friend request';
    case 'friend_accept': return 'accepted your friend request';
    case 'comment': return 'commented on your post';
    case 'like': return 'liked your post';
    case 'reply': return 'replied to your comment';
    case 'follow': return 'started following you';
    case 'message': return 'sent you a message';
    default: return 'sent you a notification';
  }
};

export const useSocket = () => useContext(SocketContext);
