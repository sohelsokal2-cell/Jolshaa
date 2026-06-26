import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

const navItems = [
  { path: '/feed', label: 'Home', icon: (active) => (
    <svg className={`w-6 h-6 ${active ? 'text-primary-600' : 'text-neutral-500'}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
  )},
  { path: '/search', label: 'Search', icon: (active) => (
    <svg className={`w-6 h-6 ${active ? 'text-primary-600' : 'text-neutral-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
  )},
  { path: '/create', label: 'Create', icon: () => (
    <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center -mt-4 shadow-lg">
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
    </div>
  )},
  { path: '/notifications', label: 'Notifications', icon: (active) => (
    <svg className={`w-6 h-6 ${active ? 'text-primary-600' : 'text-neutral-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
  )},
  { path: '/profile', label: 'Profile', icon: (active) => (
    <svg className={`w-6 h-6 ${active ? 'text-primary-600' : 'text-neutral-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
  )},
];

const BottomNav = () => {
  const location = useLocation();
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const isActive = (path) => {
    if (path === '/feed') return location.pathname === '/feed';
    if (path === '/profile') return location.pathname.startsWith('/profile');
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const active = isActive(item.path);
          if (item.path === '/create') {
            return (
              <Link key={item.path} to="/feed" className="relative">
                {item.icon(active)}
              </Link>
            );
          }
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center py-1 min-w-[48px]"
            >
              {item.icon(active)}
              <span className={`text-2xs mt-0.5 ${active ? 'text-primary-600 font-semibold' : 'text-neutral-500'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
