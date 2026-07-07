import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Modal from './ui/Modal';
import Avatar from './ui/Avatar';
import API from '../api/axios';

const FollowButton = ({ userId, initialIsFollowing, onToggle }) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await API.post(`/users/follow/${userId}`);
      setIsFollowing(res.data.isFollowing);
      onToggle?.(res.data);
    } catch (_) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (isFollowing === undefined) return null;

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
        isFollowing
          ? 'bg-jolshaa-surface-container text-jolshaa-on-surface hover:bg-jolshaa-surface-container-low'
          : 'bg-jolshaa-teal text-jolshaa-on-teal hover:bg-jolshaa-teal-container'
      }`}
    >
      {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
    </button>
  );
};

const FollowersListModal = ({ isOpen, onClose, userId, isOwner }) => {
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);

  const fetchFollowers = useCallback(async (pageNum, searchTerm = '') => {
    setLoading(true);
    try {
      const res = await API.get(`/users/followers/${userId}`, {
        params: { page: pageNum, limit: 20, search: searchTerm }
      });
      if (pageNum === 1) {
        setFollowers(res.data.followers);
      } else {
        setFollowers(prev => [...prev, ...res.data.followers]);
      }
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (_) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen) {
      setPage(1);
      setSearch('');
      fetchFollowers(1);
    }
  }, [isOpen, fetchFollowers]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setPage(1);
      fetchFollowers(1, value);
    }, 300);
    setSearchTimeout(timeout);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchFollowers(nextPage, search);
  };

  const handleFollowToggle = (data) => {
    // Update follower count on profile if needed
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Followers" size="md">
      <div className="p-4">
        {/* Search */}
        <div className="relative mb-4">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-jolshaa-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search followers..."
            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm bg-jolshaa-surface-container-low border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
          />
        </div>

        {/* Total count */}
        <p className="text-xs text-jolshaa-on-surface-variant mb-3">{total} follower{total !== 1 ? 's' : ''}</p>

        {/* List */}
        <div className="space-y-1 max-h-[50vh] overflow-y-auto">
          {followers.length === 0 && !loading ? (
            <div className="text-center py-8">
              <p className="text-sm text-jolshaa-on-surface-variant">
                {search ? 'No followers found' : 'No followers yet'}
              </p>
            </div>
          ) : (
            followers.map((follower) => (
              <div key={follower._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-jolshaa-surface-container-low transition-colors">
                <Link to={`/profile/${follower._id}`} onClick={onClose}>
                  <Avatar src={follower.profilePhoto} alt={follower.name} size="md" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${follower._id}`} onClick={onClose} className="block">
                    <p className="text-sm font-medium text-jolshaa-on-surface truncate hover:underline">{follower.name}</p>
                  </Link>
                  {follower.mutualFriendsCount > 0 && (
                    <p className="text-xs text-jolshaa-on-surface-variant">
                      {follower.mutualFriendsCount} mutual friend{follower.mutualFriendsCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                {!isOwner && (
                  <FollowButton
                    userId={follower._id}
                    initialIsFollowing={follower.isFollowing}
                    onToggle={handleFollowToggle}
                  />
                )}
              </div>
            ))
          )}

          {/* Load more */}
          {page < totalPages && (
            <div className="pt-2">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="w-full py-2 text-sm text-jolshaa-teal hover:bg-jolshaa-teal/10 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}

          {loading && followers.length === 0 && (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2 skeleton h-14 rounded-lg" />
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default FollowersListModal;
