import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Layout from '../components/layout/Layout';
import { useLanguage } from '../context/LanguageContext';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const NotificationsPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/notifications?page=${page}`);
      setNotifications(res.data.notifications || res.data);
    } catch (err) {
      console.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, [page]);

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) { console.error('Failed'); }
  };

  const markAllAsRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) { console.error('Failed'); }
  };

  const getNotificationLink = (n) => {
    if (n.type === 'friend_request' || n.type === 'friend_accept') return '/friends';
    if (n.type === 'post' || n.type === 'comment' || n.type === 'reaction' || n.type === 'tag' || n.type === 'share') {
      return '/feed';
    }
    if (n.type === 'message') return n.relatedConversation ? `/messages/${n.relatedConversation}` : '/messages';
    if (n.type === 'group_invite') return n.relatedGroup ? `/groups/${n.relatedGroup}` : '/groups';
    if (n.type === 'event_invite' || n.type === 'event_rsvp') return n.relatedEvent ? `/events/${n.relatedEvent}` : '/events';
    if (n.type === 'tip' || n.type === 'subscription') return '/feed';
    return '/feed';
  };

  const getNotificationIcon = (type) => {
    const icons = {
      friend_request: '👤',
      friend_accept: '👥',
      post: '📝',
      comment: '💬',
      reaction: '❤️',
      mention: '@',
      message: '✉️',
      group: '👥',
      page: '📄',
      event: '📅',
      story: '📖',
      system: '🔔',
    };
    return icons[type] || '🔔';
  };

  return (
    <Layout>
      <div className="mt-2 pb-8">
        <div className="flex items-center justify-between gap-3 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold font-display text-jolshaa-on-surface">{t('notifications.title')}</h1>
          {notifications.some(n => !n.isRead) && (
            <Button size="sm" variant="ghost" onClick={markAllAsRead}>{t('notifications.markAllRead')}</Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex items-center gap-3 p-4 bg-jolshaa-surface-container-lowest rounded-lg animate-pulse">
                <div className="w-10 h-10 bg-jolshaa-surface-container-low rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-jolshaa-surface-container-low rounded w-3/4" />
                  <div className="h-3 bg-jolshaa-surface-container-low rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-jolshaa-surface-container-low rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔔</span>
            </div>
            <p className="text-jolshaa-on-surface-variant">{t('notifications.noNotifications')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <Link
                key={n._id}
                to={getNotificationLink(n)}
                onClick={() => !n.isRead && markAsRead(n._id)}
                className={`flex items-start gap-3 p-4 rounded-lg transition-colors ${
                  n.isRead
                    ? 'bg-jolshaa-surface-container-lowest hover:bg-jolshaa-surface-container-low'
                    : 'bg-jolshaa-teal/10 hover:bg-jolshaa-teal/20'
                }`}
              >
                {n.sender ? (
                  <Avatar src={n.sender.profilePhoto} alt={n.sender.name} size="md" />
                ) : (
                  <div className="w-10 h-10 bg-jolshaa-surface-container-low rounded-full flex items-center justify-center">
                    <span>{getNotificationIcon(n.type)}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-jolshaa-on-surface">
                    <span className="font-semibold">{n.sender?.name || 'System'}</span>{' '}
                    {n.message || n.text || `${n.type} notification`}
                  </p>
                  <p className="text-xs text-jolshaa-on-surface-variant mt-0.5">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                {!n.isRead && (
                  <div className="w-2.5 h-2.5 bg-jolshaa-teal rounded-full flex-shrink-0 mt-1.5" />
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NotificationsPage;
