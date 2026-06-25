import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';

const Toast = () => {
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      const id = Date.now();
      setToasts(prev => [...prev, {
        id,
        type: 'message',
        text: `${message.sender?.name}: ${message.text}`,
        conversationId: message.conversation || message.conversationId
      }]);
    };

    const handleNewNotification = (notification) => {
      if (notification.type === 'message') return; // Handled by newMessage
      const id = Date.now();
      setToasts(prev => [...prev, {
        id,
        type: 'notification',
        text: `${notification.sender?.name} ${getNotificationText(notification.type)}`
      }]);
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('newNotification', handleNewNotification);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('newNotification', handleNewNotification);
    };
  }, [socket]);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts(prev => prev.slice(1));
    }, 5000);
    return () => clearTimeout(timer);
  }, [toasts]);

  const getNotificationText = (type) => {
    switch (type) {
      case 'friend_request': return 'sent you a friend request';
      case 'comment': return 'commented on your post';
      case 'reaction': return 'reacted to your post';
      case 'tag': return 'tagged you in a post';
      case 'group_invite': return 'added you to a group';
      default: return 'sent you a notification';
    }
  };

  const handleClick = (toast) => {
    if (toast.type === 'message' && toast.conversationId) {
      navigate('/messages', { state: { conversationId: toast.conversationId } });
    }
    setToasts(prev => prev.filter(t => t.id !== toast.id));
  };

  const handleDismiss = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          onClick={() => handleClick(toast)}
          className="bg-white border shadow-lg rounded-lg p-3 pr-8 cursor-pointer hover:shadow-xl transition max-w-sm animate-slide-in"
        >
          <button
            onClick={(e) => { e.stopPropagation(); handleDismiss(toast.id); }}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            x
          </button>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${toast.type === 'message' ? 'bg-blue-500' : 'bg-green-500'}`} />
            <p className="text-sm text-gray-800">{toast.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Toast;
