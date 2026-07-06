import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Layout from '../components/layout/Layout';

const FriendRequests = () => {
  const { user } = useAuth();
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [friends, setFriends] = useState([]);
  const [activeTab, setActiveTab] = useState('requests');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, friendsRes] = await Promise.all([
        API.get('/friends/requests'),
        API.get(`/friends/${user.id}`)
      ]);
      setIncoming(reqRes.data.incoming);
      setOutgoing(reqRes.data.outgoing);
      setFriends(friendsRes.data.friends);
    } catch (err) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      setError('');
      await API.put(`/friends/${requestId}/accept`);
      const request = incoming.find(r => r._id === requestId);
      setIncoming(prev => prev.filter(r => r._id !== requestId));
      if (request?.from) {
        setFriends(prev => [request.from, ...prev]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleReject = async (requestId) => {
    try {
      setError('');
      await API.put(`/friends/${requestId}/reject`);
      setIncoming(prev => prev.filter(r => r._id !== requestId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject request');
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      setError('');
      await API.put(`/friends/${requestId}/reject`);
      setOutgoing(prev => prev.filter(r => r._id !== requestId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel request');
    }
  };

  const handleUnfriend = async (userId) => {
    try {
      setError('');
      await API.delete(`/friends/${userId}`);
      setFriends(prev => prev.filter(f => f._id !== userId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unfriend');
    }
  };

  const filteredFriends = friends.filter(f =>
    f.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { key: 'requests', label: `Requests (${incoming.length})` },
    { key: 'sent', label: `Sent (${outgoing.length})` },
    { key: 'friends', label: `All Friends (${friends.length})` },
  ];

  return (
    <Layout>
      <div className="mt-2 pb-8">
        <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-4 mb-4">
          <h1 className="text-xl font-bold font-display text-jolshaa-on-surface">Friends</h1>
        </div>

        <div className="flex gap-2 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-jolshaa-teal text-jolshaa-on-teal'
                  : 'bg-jolshaa-surface-container-lowest text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container-low'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>
        ) : (
          <>
            {/* Incoming Requests */}
            {activeTab === 'requests' && (
              <div className="space-y-3">
                {incoming.length === 0 ? (
                  <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-6 text-center text-jolshaa-on-surface-variant text-sm">
                    No pending friend requests
                  </div>
                ) : (
                  incoming.map((request) => (
                    <div key={request._id} className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-4 flex items-center gap-4">
                      <Link to={`/profile/${request.from?._id}`}>
                        <img
                          src={request.from?.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'}
                          alt={request.from?.name || 'User avatar'}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      </Link>
                      <div className="flex-1">
                        <Link to={`/profile/${request.from?._id}`} className="font-semibold text-jolshaa-on-surface hover:underline">
                          {request.from?.name}
                        </Link>
                        {request.from?.bio && (
                          <p className="text-jolshaa-on-surface-variant text-sm truncate">{request.from.bio}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(request._id)}
                          className="px-4 py-2 bg-jolshaa-teal text-jolshaa-on-teal rounded-lg text-sm font-medium hover:bg-jolshaa-teal-container transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(request._id)}
                          className="px-4 py-2 bg-jolshaa-surface-container-low text-jolshaa-on-surface-variant rounded-lg text-sm font-medium hover:bg-jolshaa-surface-container transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Outgoing Requests */}
            {activeTab === 'sent' && (
              <div className="space-y-3">
                {outgoing.length === 0 ? (
                  <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-6 text-center text-jolshaa-on-surface-variant text-sm">
                    No outgoing friend requests
                  </div>
                ) : (
                    outgoing.map((request) => (
                    <div key={request._id} className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-4 flex items-center gap-4">
                      <Link to={`/profile/${request.to?._id}`}>
                        <img
                          src={request.to?.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'}
                          alt={request.to?.name || 'User avatar'}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      </Link>
                      <div className="flex-1">
                        <Link to={`/profile/${request.to?._id}`} className="font-semibold text-jolshaa-on-surface hover:underline">
                          {request.to?.name}
                        </Link>
                        <p className="text-jolshaa-on-surface-variant text-xs">Request pending</p>
                      </div>
                      <button
                        onClick={() => handleCancelRequest(request._id)}
                        className="px-4 py-2 bg-jolshaa-surface-container-low text-jolshaa-on-surface-variant rounded-lg text-sm font-medium hover:bg-jolshaa-surface-container transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* All Friends */}
            {activeTab === 'friends' && (
              <div>
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Search friends..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jolshaa-teal text-jolshaa-on-surface"
                  />
                </div>
                <div className="space-y-3">
                  {filteredFriends.length === 0 ? (
                    <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-6 text-center text-jolshaa-on-surface-variant text-sm">
                      {friends.length === 0 ? 'No friends yet' : 'No friends match your search'}
                    </div>
                  ) : (
                      filteredFriends.map((friend) => (
                      <div key={friend._id} className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-4 flex items-center gap-4">
                        <Link to={`/profile/${friend._id}`}>
                          <img
                            src={friend.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'}
                            alt={friend.name || 'Friend avatar'}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        </Link>
                        <div className="flex-1">
                          <Link to={`/profile/${friend._id}`} className="font-semibold text-jolshaa-on-surface hover:underline">
                            {friend.name}
                          </Link>
                          {friend.bio && (
                            <p className="text-jolshaa-on-surface-variant text-sm truncate">{friend.bio}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleUnfriend(friend._id)}
                          className="text-sm text-red-500 hover:underline"
                        >
                          Unfriend
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default FriendRequests;
