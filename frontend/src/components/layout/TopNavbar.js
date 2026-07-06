import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../context/DarkModeContext';
import { useDataSaver } from '../../context/DataSaverContext';
import Avatar from '../ui/Avatar';
import NotificationBell from '../NotificationBell';

const TopNavbar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleDark } = useDarkMode();
  const { dataSaver, toggleDataSaver } = useDataSaver();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowMobileSearch(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-jolshaa-surface-container-lowest/95 backdrop-blur-xl border-b border-jolshaa-outline-variant shadow-ambient">
      <div className="h-full max-w-[1920px] mx-auto px-4 flex items-center justify-between">

        {/* Left: Logo + Search */}
        <div className="flex items-center gap-4">
          <Link to="/feed" className="flex items-center gap-2.5 flex-shrink-0 group">
            {/* Logo mark */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #00685f 0%, #008378 100%)',
                boxShadow: '0 2px 8px rgba(0, 104, 95, 0.35)',
              }}
            >
              <span className="text-white font-bold text-lg tracking-tight">J</span>
            </div>
            <span className="text-xl font-bold font-display hidden sm:block text-jolshaa-teal">
              Jolshaa
            </span>
          </Link>

          {/* Desktop search */}
          <form onSubmit={handleSearch} className="relative hidden md:block">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Jolshaa…"
              className="w-60 lg:w-72 rounded-full px-4 py-2 pl-10 text-sm transition-all duration-200 focus:outline-none bg-jolshaa-surface-container-low border border-jolshaa-outline-variant text-jolshaa-on-surface placeholder-jolshaa-on-surface-variant focus:bg-jolshaa-surface-container-lowest focus:border-jolshaa-teal/40 focus:ring-3 focus:ring-jolshaa-teal/10"
              aria-label="Search"
            />
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-jolshaa-on-surface-variant"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </form>

          {/* Mobile search toggle */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="md:hidden p-2 rounded-full transition-colors text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container-low"
            aria-label="Toggle search"
            aria-expanded={showMobileSearch}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <NotificationBell />

          {/* Dark mode toggle */}
          <button
            onClick={toggleDark}
            className="p-2 rounded-full transition-all duration-200 text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container-low hover:text-jolshaa-teal"
            title={isDark ? 'Light mode' : 'Dark mode'}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Data saver toggle */}
          <button
            onClick={toggleDataSaver}
            className={`p-2 rounded-full transition-all duration-200 hover:bg-jolshaa-surface-container-low ${
              dataSaver ? 'text-green-600 hover:text-green-500' : 'text-jolshaa-on-surface-variant hover:text-jolshaa-teal'
            }`}
            title={dataSaver ? 'Data saver ON — tap to disable' : 'Data saver OFF — tap to enable'}
            aria-label={dataSaver ? 'Disable data saver' : 'Enable data saver'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>

          {/* Profile menu */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 rounded-full transition-all duration-200 hover:bg-jolshaa-surface-container-low"
              aria-expanded={showProfileMenu}
              aria-haspopup="true"
              aria-label="Profile menu"
            >
              <div className="outline outline-2 outline-jolshaa-teal/50 outline-offset-2 rounded-full">
                <Avatar src={user?.profilePhoto} alt={user?.name} size="sm" />
              </div>
              <svg
                className={`w-4 h-4 hidden sm:block transition-transform duration-200 text-jolshaa-on-surface-variant ${showProfileMenu ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showProfileMenu && (
              <div
                className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-2xl z-50 py-2 animate-scale-in bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant shadow-ambient-hover"
              >
                {/* Profile header */}
                <div className="px-4 py-3 mb-1 border-b border-jolshaa-outline-variant">
                  <div className="flex items-center gap-3">
                    <div className="outline outline-2 outline-jolshaa-teal outline-offset-2 rounded-full shadow-lg shadow-jolshaa-teal/30">
                      <Avatar src={user?.profilePhoto} alt={user?.name} size="lg" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-jolshaa-on-surface">{user?.name}</p>
                      <p className="text-xs text-jolshaa-on-surface-variant">See your profile</p>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  {[
                    {
                      to: '/profile', label: 'Your profile',
                      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    },
                    {
                      to: '/saved', label: 'Saved posts',
                      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    },
                    {
                      to: '/notes', label: 'Notes',
                      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    },
                    {
                      to: '/memories', label: 'Memories',
                      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    },
                    {
                      to: '/privacy', label: 'Settings & privacy',
                      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    },
                  ].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-jolshaa-on-surface-variant hover:bg-jolshaa-teal/10 hover:text-jolshaa-on-surface"
                    >
                      <svg className="w-5 h-5 text-jolshaa-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {item.icon}
                      </svg>
                      {item.label}
                    </Link>
                  ))}

                  {(user?.isAdmin || user?.role === 'superadmin') && (
                    <Link
                      to="/admin"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-jolshaa-on-surface-variant hover:bg-jolshaa-teal/10 hover:text-jolshaa-on-surface"
                    >
                      <svg className="w-5 h-5 text-jolshaa-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Admin panel
                    </Link>
                  )}
                </div>

                {/* Logout */}
                <div className="border-t border-jolshaa-outline-variant pt-1">
                  <button
                    onClick={() => { logout(); setShowProfileMenu(false); }}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors w-full text-red-500 hover:bg-red-500/10"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      {showMobileSearch && (
        <div
          className="md:hidden absolute top-full left-0 right-0 p-3 animate-slide-down bg-jolshaa-surface-container-lowest border-b border-jolshaa-outline-variant backdrop-blur-xl"
        >
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Jolshaa…"
              autoFocus
              className="w-full rounded-full px-4 py-2.5 pl-10 text-sm focus:outline-none bg-jolshaa-surface-container-low border border-jolshaa-outline-variant text-jolshaa-on-surface"
              aria-label="Search"
            />
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-jolshaa-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </form>
        </div>
      )}
    </nav>
  );
};

export default TopNavbar;
