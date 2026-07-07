import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { useLanguage } from '../../context/LanguageContext';
import API from '../../api/axios';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
};

const navItems = [
  {
    path: '/feed', label: 'Home', labelKey: 'nav.home',
    ariaLabel: 'Home feed',
    icon: (active) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    path: '/search', label: 'Search', labelKey: 'nav.search',
    ariaLabel: 'Search',
    hideOnMobile: true,
    icon: (active) => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    path: '/create', label: 'Create',
    ariaLabel: 'Create new post',
    isCreate: true,
    icon: () => (
      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-jolshaa-teal to-jolshaa-teal-container shadow-ambient flex items-center justify-center -mt-3 transition-all duration-300">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </div>
    ),
  },
  {
    path: '/messages', label: 'Chat', labelKey: 'nav.chat',
    ariaLabel: 'Messages',
    hasMessageBadge: true,
    icon: (active, msgCount) => (
      <span className="relative">
        <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {msgCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-2xs font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 leading-none">
            {msgCount > 99 ? '99+' : msgCount}
          </span>
        )}
      </span>
    ),
  },
  {
    path: '/reels', label: 'Reels', labelKey: 'nav.reels',
    ariaLabel: 'Reels',
    hideOnMobile: true,
    icon: (active) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    path: '/help', label: 'Help', labelKey: 'nav.help',
    ariaLabel: 'Help requests',
    icon: (active) => (
      <span className="relative">
        <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </span>
    ),
  },
  {
    path: '/para', label: 'Para', labelKey: 'nav.para',
    ariaLabel: 'Local community',
    icon: (active) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    path: '/notifications', label: 'Alerts', labelKey: 'nav.alerts',
    ariaLabel: 'Notifications',
    hasBadge: true,
    icon: (active, unreadCount) => (
      <span className="relative">
        <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-2xs font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </span>
    ),
  },
  {
    path: '/notes', label: 'Notes', labelKey: 'nav.notes',
    ariaLabel: 'Notes',
    hideOnMobile: true,
    icon: (active) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    path: '/profile', label: 'Profile', labelKey: 'nav.profile',
    ariaLabel: 'View profile',
    icon: (active) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

const BottomNav = () => {
  const location = useLocation();
  const { socket, unreadMessageCount } = useSocket();
  const { t } = useLanguage();
  const [unreadCount, setUnreadCount] = useState(0);
  const isMobile = useIsMobile();

  const visibleItems = isMobile
    ? navItems.filter(item => !item.hideOnMobile)
    : navItems;

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = () => setUnreadCount(prev => prev + 1);
    socket.on('newNotification', handleNewNotification);
    return () => { socket.off('newNotification', handleNewNotification); };
  }, [socket]);

  const fetchUnreadCount = async () => {
    try {
      const res = await API.get('/notifications?limit=1');
      setUnreadCount(res.data.unreadCount);
    } catch {
      // silently fail
    }
  };

  const isActive = (path) => {
    if (path === '/feed')    return location.pathname === '/feed';
    if (path === '/profile') return location.pathname.startsWith('/profile');
    if (path === '/messages') return location.pathname.startsWith('/messages');
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-jolshaa-surface-container-lowest/95 border-t border-jolshaa-outline-variant backdrop-blur-[24px] shadow-ambient safe-area-bottom"
    >
      <div className="flex items-center justify-around h-14 px-2">
        {visibleItems.map((item) => {
          const active = isActive(item.path);

          if (item.isCreate) {
            return (
              <Link
                key={item.path}
                to="/create"
                className="relative flex items-center justify-center"
                aria-label={item.ariaLabel}
              >
                {item.icon()}
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 min-w-0 flex-1 gap-0.5 transition-all duration-150 ${
                active ? 'text-jolshaa-teal' : 'text-jolshaa-on-surface-variant'
              }`}
              aria-label={item.ariaLabel}
            >
              {item.hasMessageBadge
                ? item.icon(active, unreadMessageCount)
                : item.hasBadge
                ? item.icon(active, unreadCount)
                : item.icon(active)}
              <span
                className={`font-medium text-2xs tracking-[0.02em] ${
                  active ? 'text-jolshaa-teal' : 'text-jolshaa-on-surface-variant'
                }`}
              >
                {t(item.labelKey)}
              </span>
              {active && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-jolshaa-teal shadow-[0_0_6px_rgba(0,104,95,0.6)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
