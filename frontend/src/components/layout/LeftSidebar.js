import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';

const navItems = [
  { path: '/feed', label: 'News Feed', icon: (active) => (
    <svg className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-neutral-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
  )},
  { path: '/friends', label: 'Friends', icon: (active) => (
    <svg className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-neutral-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  )},
  { path: '/groups', label: 'Groups', icon: (active) => (
    <svg className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-neutral-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
  )},
  { path: '/pages', label: 'Pages', icon: (active) => (
    <svg className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-neutral-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
  )},
  { path: '/marketplace', label: 'Marketplace', icon: (active) => (
    <svg className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-neutral-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
  )},
  { path: '/saved', label: 'Saved', icon: (active) => (
    <svg className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-neutral-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
  )},
  { path: '/events', label: 'Events', icon: (active) => (
    <svg className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-neutral-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
  )},
  { path: '/memories', label: 'Memories', icon: (active) => (
    <svg className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-neutral-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  )},
  { path: '/reels', label: 'Reels', icon: (active) => (
    <svg className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-neutral-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
  )},
  { path: '/trending', label: 'Trending', icon: (active) => (
    <svg className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-neutral-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
  )},
  { path: '/topics', label: 'Topics', icon: (active) => (
    <svg className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-neutral-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
  )},
];

const LeftSidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <aside className="hidden lg:block w-[280px] xl:w-[320px] flex-shrink-0">
      <div className="fixed top-14 left-0 w-[280px] xl:w-[320px] h-[calc(100vh-56px)] overflow-y-auto py-4 pl-4 pr-2 scrollbar-hide">
        {/* Profile link */}
        <Link
          to="/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors mb-1"
        >
          <Avatar src={user?.profilePhoto} alt={user?.name} size="md" />
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
            {user?.name}
          </span>
        </Link>

        <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-2 mx-3" />

        {/* Nav items */}
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/feed' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                    : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                }`}
              >
                {item.icon(isActive)}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-3 mx-3" />

        {/* Footer */}
        <div className="px-3 text-2xs text-neutral-400 dark:text-neutral-600 space-y-1">
          <p>Privacy · Terms · Advertising · Cookies</p>
          <p>© 2026 Jolshaa</p>
        </div>
      </div>
    </aside>
  );
};

export default LeftSidebar;
