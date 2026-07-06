import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import API from '../api/axios';
import Avatar from './ui/Avatar';

const NotificationBell = () => {
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };
    socket.on('newNotification', handleNewNotification);
    return () => { socket.off('newNotification', handleNewNotification); };
  }, [socket]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications?limit=20');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  };

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {}
  };

  const markAllAsRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {}
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) await markAsRead(notif._id);
    setIsOpen(false);
    switch (notif.type) {
      case 'comment': case 'reaction': case 'tag': case 'share':
        if (notif.relatedPost?._id) navigate('/feed'); break;
      case 'message': navigate('/messages'); break;
      case 'friend_request': navigate('/friends'); break;
      case 'friend_accept': navigate('/profile'); break;
      case 'group_invite': navigate('/groups'); break;
      case 'event_invite': case 'event_rsvp': navigate('/events'); break;
      default: break;
    }
  };

  const getNotificationText = (notif) => {
    switch (notif.type) {
      case 'friend_request': return 'sent you a friend request';
      case 'friend_accept': return 'accepted your friend request';
      case 'comment': return 'commented on your post';
      case 'reaction': return 'reacted to your post';
      case 'tag': return 'tagged you in a post';
      case 'message': return 'sent you a message';
      case 'group_invite': return 'added you to a group';
      case 'share': return 'shared your post';
      case 'event_invite': return 'invited you to an event';
      case 'event_rsvp': return 'is going to an event you created';
      default: return 'sent you a notification';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-jolshaa-surface-container-low transition-colors"
      >
        <svg className="w-5 h-5 text-jolshaa-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-2xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-80 bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient-hover border border-jolshaa-outline-variant z-50 animate-scale-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-jolshaa-outline-variant">
            <h3 className="font-semibold font-display text-jolshaa-on-surface">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-jolshaa-teal hover:underline font-medium">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-jolshaa-surface-container-low rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-jolshaa-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                </div>
                <p className="text-sm text-jolshaa-on-surface-variant">No notifications yet</p>
              </div>
            ) : (
              notifications.map(notif => (
                <button
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-jolshaa-surface-container-low transition text-left ${
                    !notif.isRead ? 'bg-jolshaa-teal/10' : ''
                  }`}
                >
                  <Avatar src={notif.sender?.profilePhoto} alt={notif.sender?.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-jolshaa-on-surface">
                      <span className="font-semibold">{notif.sender?.name}</span>{' '}
                      {getNotificationText(notif)}
                    </p>
                    <p className="text-2xs text-jolshaa-on-surface-variant mt-0.5">
                      {new Date(notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <div className="w-2 h-2 bg-jolshaa-teal rounded-full mt-2 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
