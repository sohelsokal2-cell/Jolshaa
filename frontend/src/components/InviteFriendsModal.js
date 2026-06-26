import { useState, useEffect } from 'react';
import API from '../api/axios';

const InviteFriendsModal = ({ eventId, onClose }) => {
  const [friends, setFriends] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const res = await API.get(`/friends/${JSON.parse(localStorage.getItem('user') || '{}').id || ''}`);
      setFriends(res.data.friends || []);
    } catch (err) {
      console.error('Failed to fetch friends');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (userId) => {
    setSelected(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleInvite = async () => {
    if (selected.length === 0) return;
    setSending(true);
    try {
      await API.post(`/events/${eventId}/invite`, { userIds: selected });
      setSent(true);
    } catch (err) {
      console.error('Failed to invite');
    } finally {
      setSending(false);
    }
  };

  const filtered = friends.filter(f =>
    f.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-800">Invite Friends</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
        </div>

        <div className="p-4">
          {sent ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-medium text-gray-800">Invitations Sent!</p>
              <p className="text-gray-500 text-sm mt-1">{selected.length} friend{selected.length !== 1 ? 's' : ''} invited</p>
              <button onClick={onClose} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Done</button>
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="Search friends..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {loading ? (
                <p className="text-center text-gray-500 text-sm py-4">Loading friends...</p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filtered.map((friend) => (
                    <label
                      key={friend._id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        selected.includes(friend._id) ? 'bg-blue-50 border border-blue-300' : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(friend._id)}
                        onChange={() => toggleSelect(friend._id)}
                        className="text-blue-600 focus:ring-blue-500 rounded"
                      />
                      <img
                        src={friend.profilePhoto || 'https://res.cloudinary.com/demo/image/upload/v1556418119/default-avatar.png'}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-sm font-medium text-gray-700">{friend.name}</span>
                    </label>
                  ))}
                  {filtered.length === 0 && (
                    <p className="text-center text-gray-500 text-sm py-4">No friends found</p>
                  )}
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={selected.length === 0 || sending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {sending ? 'Sending...' : `Invite (${selected.length})`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteFriendsModal;
