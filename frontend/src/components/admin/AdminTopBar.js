import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../context/DarkModeContext';
import Avatar from '../ui/Avatar';
import NotificationBell from '../NotificationBell';
import API from '../../api/axios';

const AdminTopBar = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleDark } = useDarkMode();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const searchRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/admin?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery('');
    setShowSearch(false);
  };

  const quickSearch = async (q) => {
    if (q.length < 2) { setSearchResults(null); return; }
    try {
      const res = await API.get(`/admin/ops/search?q=${encodeURIComponent(q)}&type=all`);
      setSearchResults(res.data);
    } catch (e) { /* ignore */ }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-neutral-800 shadow-nav z-50 h-14">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left: Menu toggle + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <svg className="w-5 h-5 text-neutral-600 dark:text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">J</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold text-primary-600 dark:text-primary-400">Jolshaa</span>
              <span className="ml-2 text-xs font-medium text-neutral-500 bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 rounded-full">Admin</span>
            </div>
          </div>
        </div>

        {/* Center: Global Search */}
        <div className="flex-1 max-w-xl mx-4" ref={searchRef}>
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                quickSearch(e.target.value);
              }}
              onFocus={() => setShowSearch(true)}
              placeholder="Search users, posts, reports..."
              className="w-full bg-neutral-100 dark:bg-neutral-700 rounded-lg px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:bg-white dark:focus:bg-neutral-600 transition-all"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button type="button" onClick={() => { setSearchQuery(''); setSearchResults(null); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="w-4 h-4 text-neutral-400 hover:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </form>

          {/* Search dropdown */}
          {showSearch && searchResults && (
            <div className="absolute top-full left-0 right-0 sm:left-auto sm:right-auto sm:w-full mt-1 bg-white dark:bg-neutral-800 rounded-xl shadow-dropdown border border-neutral-100 dark:border-neutral-700 z-50 py-2 max-h-96 overflow-y-auto">
              {searchResults.users?.data?.length > 0 && (
                <div className="px-3 pb-2">
                  <p className="text-xs font-semibold text-neutral-400 uppercase mb-1">Users</p>
                  {searchResults.users.data.slice(0, 3).map(u => (
                    <button key={u._id} onClick={() => { setShowSearch(false); setSearchResults(null); }} className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 text-left">
                      <Avatar src={u.profilePhoto} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{u.name}</p>
                        <p className="text-xs text-neutral-500">{u.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {searchResults.posts?.data?.length > 0 && (
                <div className="px-3 pb-2">
                  <p className="text-xs font-semibold text-neutral-400 uppercase mb-1">Posts</p>
                  {searchResults.posts.data.slice(0, 3).map(p => (
                    <button key={p._id} onClick={() => { setShowSearch(false); setSearchResults(null); }} className="w-full p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 text-left">
                      <p className="text-sm text-neutral-900 dark:text-neutral-100 line-clamp-2">{p.text}</p>
                    </button>
                  ))}
                </div>
              )}
              {searchResults.reports?.data?.length > 0 && (
                <div className="px-3 pb-2">
                  <p className="text-xs font-semibold text-neutral-400 uppercase mb-1">Reports</p>
                  {searchResults.reports.data.slice(0, 3).map(r => (
                    <button key={r._id} onClick={() => { setShowSearch(false); setSearchResults(null); }} className="w-full p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 text-left">
                      <p className="text-sm text-neutral-900 dark:text-neutral-100">{r.reason} - {r.targetType}</p>
                    </button>
                  ))}
                </div>
              )}
              <div className="px-3 pt-1 border-t border-neutral-100 dark:border-neutral-700">
                <button onClick={handleSearch} className="w-full text-center text-sm text-primary-600 hover:text-primary-700 py-2">
                  See all results
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <NotificationBell />

          <button
            onClick={toggleDark}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? (
              <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Profile menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              <Avatar src={user?.profilePhoto} alt={user?.name} size="sm" />
              <svg className="w-4 h-4 text-neutral-500 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-800 rounded-xl shadow-dropdown border border-neutral-100 dark:border-neutral-700 z-50 py-2 animate-scale-in">
                <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-700">
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">{user?.name}</p>
                  <p className="text-xs text-primary-600 dark:text-primary-400 capitalize">{user?.role}</p>
                </div>
                <div className="py-1">
                  <button onClick={() => { logout(); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10">
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
    </nav>
  );
};

export default AdminTopBar;
