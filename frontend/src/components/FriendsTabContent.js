import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import Avatar from './ui/Avatar';

const PAGE_SIZE = 12;

const FriendsTabContent = ({ userId, isOwnProfile, onUnfriend }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [unfriending, setUnfriending] = useState(null);
  const filterRef = useRef(null);

  useEffect(() => {
    fetchFriends();
  }, [userId, page, filter]);

  useEffect(() => {
    setPage(1);
  }, [search, filter]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilter(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchFriends = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get(`/friends/${userId}`);
      let allFriends = res.data.friends || [];

      // Compute mutual friends count for each friend
      const myId = (await API.get('/auth/me')).data.user?._id;
      if (myId) {
        const myFriendsRes = await API.get(`/friends/${myId}`);
        const myFriendIds = new Set((myFriendsRes.data.friends || []).map(f => f._id));
        allFriends = allFriends.map(f => ({
          ...f,
          mutualFriendsCount: myFriendIds.has(f._id) ? 0 : 0 // Can't compute mutual without full data
        }));
      }

      // Client-side search
      if (search) {
        allFriends = allFriends.filter(f =>
          f.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Client-side sort
      if (filter === 'name-az') {
        allFriends.sort((a, b) => a.name.localeCompare(b.name));
      } else if (filter === 'recent') {
        allFriends.reverse(); // Most recently added are at the end of friends array
      }

      setTotalPages(Math.ceil(allFriends.length / PAGE_SIZE));
      const paginated = allFriends.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
      setFriends(paginated);
    } catch (err) {
      console.error('Failed to fetch friends');
      setError('Failed to load friends.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfriend = async (friendId, friendName) => {
    if (!window.confirm(`Unfriend ${friendName}?`)) return;
    setUnfriending(friendId);
    try {
      await API.delete(`/friends/${friendId}`);
      setFriends(prev => prev.filter(f => f._id !== friendId));
      if (onUnfriend) onUnfriend();
    } catch (err) {
      console.error('Failed to unfriend');
    } finally {
      setUnfriending(null);
    }
  };

  const filterOptions = [
    { key: 'all', label: 'All Friends' },
    { key: 'recent', label: 'Recently Added' },
    { key: 'name-az', label: 'Name A-Z' },
  ];

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-jolshaa-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search friends..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-sm text-jolshaa-on-surface placeholder:text-jolshaa-on-surface-variant focus:outline-none focus:border-jolshaa-teal transition-colors"
          />
        </div>
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-sm text-jolshaa-on-surface hover:bg-jolshaa-surface-container-low transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter
          </button>
          {showFilter && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-jolshaa-surface-container-lowest rounded-xl shadow-elevated border border-jolshaa-outline-variant z-20 py-1">
              {filterOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => { setFilter(opt.key); setShowFilter(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    filter === opt.key
                      ? 'bg-jolshaa-teal/10 text-jolshaa-teal font-medium'
                      : 'text-jolshaa-on-surface hover:bg-jolshaa-surface-container-low'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Friends Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-jolshaa-surface-container-lowest h-16 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-sm text-jolshaa-on-surface-variant mb-3">{error}</p>
          <button
            onClick={fetchFriends}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-jolshaa-surface-container-low text-jolshaa-on-surface hover:bg-jolshaa-surface-container transition-colors"
          >
            Retry
          </button>
        </div>
      ) : friends.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-jolshaa-surface-container rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-jolshaa-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-sm text-jolshaa-on-surface-variant">
            {search
              ? 'No friends match your search'
              : isOwnProfile
                ? "You haven't added friends yet"
                : "No friends to show"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {friends.map((friend) => (
            <div
              key={friend._id}
              className="relative group"
            >
              <Link
                to={`/profile/${friend._id}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-jolshaa-surface-container-lowest shadow-ambient hover:bg-jolshaa-surface-container-low transition-colors"
              >
                <Avatar src={friend.profilePhoto} alt={friend.name} size="lg" />
                <div className="min-w-0">
                  <p className="font-medium text-sm text-jolshaa-on-surface truncate">{friend.name}</p>
                  {friend.mutualFriendsCount > 0 && (
                    <p className="text-xs text-jolshaa-on-surface-variant">
                      {friend.mutualFriendsCount} mutual friend{friend.mutualFriendsCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </Link>
              {/* Unfriend button (own profile only) */}
              {isOwnProfile && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleUnfriend(friend._id, friend.name);
                    }}
                    disabled={unfriending === friend._id}
                    className="p-1.5 rounded-full bg-jolshaa-surface-container hover:bg-red-500/10 text-jolshaa-on-surface-variant hover:text-red-500 transition-colors disabled:opacity-50"
                    title={`Unfriend ${friend.name}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                page === p
                  ? 'bg-jolshaa-teal text-jolshaa-on-teal'
                  : 'bg-jolshaa-surface-container text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container-low'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendsTabContent;
