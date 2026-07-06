import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function CloseFriendsManager({ dark, onClose }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [closeFriends, setCloseFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [friendsRes, closeFriendsRes] = await Promise.all([
        API.get(`/friends/${user.id}`),
        API.get('/privacy/close-friends')
      ]);
      setFriends(friendsRes.data.friends || []);
      setCloseFriends((closeFriendsRes.data.closeFriends || []).map(f => f._id || f));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCloseFriend = async (userId) => {
    try {
      if (closeFriends.includes(userId)) {
        await API.delete(`/privacy/close-friends/${userId}`);
        setCloseFriends(closeFriends.filter(id => id !== userId));
      } else {
        await API.post('/privacy/close-friends', { userId });
        setCloseFriends([...closeFriends, userId]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = friends.filter(f =>
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm`}>
      <div className={`w-full max-w-md mx-4 rounded-2xl border shadow-2xl overflow-hidden
        ${dark ? 'bg-[#131b2e] border-white/10' : 'bg-white border-black/10'}`}>
        
        <div className={`flex items-center justify-between p-4 border-b
          ${dark ? 'border-white/10' : 'border-black/10'}`}>
          <h2 className={`font-display text-lg font-bold ${dark ? 'text-[#dae2fd]' : 'text-[#202020]'}`}>
            Close Friends
          </h2>
          <button onClick={onClose} className={`p-1 rounded-lg ${dark ? 'hover:bg-white/10 text-white/50' : 'hover:bg-black/5 text-black/50'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <input
            type="text"
            placeholder="Search friends..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full px-4 py-2 rounded-xl text-sm outline-none
              ${dark ? 'bg-white/5 text-[#dae2fd] placeholder-white/30 border border-white/10 focus:border-purple-500' : 'bg-black/5 text-[#202020] placeholder-black/30 border border-black/10 focus:border-purple-500'}`}
          />
        </div>

        <div className="max-h-80 overflow-y-auto px-4 pb-4">
          {loading ? (
            <div className="text-center py-8 text-sm opacity-50">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-sm opacity-50">No friends found</div>
          ) : (
            filtered.map(friend => {
              const isClose = closeFriends.includes(friend._id);
              return (
                <div key={friend._id} className={`flex items-center gap-3 p-3 rounded-xl mb-1 transition-colors
                  ${dark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                  <img
                    src={friend.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name || 'U')}&background=494454&color=dae2fd&size=128`}
                    alt={friend.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm truncate ${dark ? 'text-[#dae2fd]' : 'text-[#202020]'}`}>
                      {friend.name}
                    </div>
                    <div className={`text-xs truncate ${dark ? 'text-white/50' : 'text-black/50'}`}>
                      @{friend.username}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleCloseFriend(friend._id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                      ${isClose
                        ? 'bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400'
                        : dark ? 'bg-white/10 text-[#dae2fd] hover:bg-purple-500/20' : 'bg-black/10 text-[#202020] hover:bg-purple-100'
                      }`}
                  >
                    {isClose ? '✓ Close' : 'Add'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}