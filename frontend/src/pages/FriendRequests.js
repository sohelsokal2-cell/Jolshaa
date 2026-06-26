import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const FriendRequests = () => {
  const { user, logout } = useAuth();
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [friends, setFriends] = useState([]);
  const [activeTab, setActiveTab] = useState('requests');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
      await API.put(`/friends/${requestId}/accept`);
      const request = incoming.find(r => r._id === requestId);
      setIncoming(prev => prev.filter(r => r._id !== requestId));
      if (request?.from) {
        setFriends(prev => [request.from, ...prev]);
      }
    } catch (err) {
      console.error('Failed to accept');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await API.put(`/friends/${requestId}/reject`);
      setIncoming(prev => prev.filter(r => r._id !== requestId));
    } catch (err) {
      console.error('Failed to reject');
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await API.put(`/friends/${requestId}/reject`);
      setOutgoing(prev => prev.filter(r => r._id !== requestId));
    } catch (err) {
      console.error('Failed to cancel');
    }
  };

  const handleUnfriend = async (userId) => {
    try {
      await API.delete(`/friends/${userId}`);
      setFriends(prev => prev.filter(f => f._id !== userId));
    } catch (err) {
      console.error('Failed to unfriend');
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
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md px-6 py-3 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <Link to="/feed" className="text-xl font-bold text-blue-600">Jolshaa</Link>
          <div className="flex items-center gap-4">
            <Link to="/feed" className="text-sm text-gray-600 hover:text-blue-600">Feed</Link>
            <button onClick={logout} className="text-sm text-red-600 hover:underline">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto mt-4 px-4 pb-8">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h1 className="text-xl font-bold text-gray-800">Friends</h1>
        </div>

        <div className="flex gap-2 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : (
          <>
            {/* Incoming Requests */}
            {activeTab === 'requests' && (
              <div className="space-y-3">
                {incoming.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500 text-sm">
                    No pending friend requests
                  </div>
                ) : (
                  incoming.map((request) => (
                    <div key={request._id} className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4">
                      <Link to={`/profile/${request.from?._id}`}>
                        <img
                          src={request.from?.profilePhoto || 'https://res.cloudinary.com/demo/image/upload/v1556418119/default-avatar.png'}
                          alt=""
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      </Link>
                      <div className="flex-1">
                        <Link to={`/profile/${request.from?._id}`} className="font-semibold text-gray-800 hover:underline">
                          {request.from?.name}
                        </Link>
                        {request.from?.bio && (
                          <p className="text-gray-500 text-sm truncate">{request.from.bio}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(request._id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(request._id)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
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
                  <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500 text-sm">
                    No outgoing friend requests
                  </div>
                ) : (
                  outgoing.map((request) => (
                    <div key={request._id} className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4">
                      <Link to={`/profile/${request.to?._id}`}>
                        <img
                          src={request.to?.profilePhoto || 'https://res.cloudinary.com/demo/image/upload/v1556418119/default-avatar.png'}
                          alt=""
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      </Link>
                      <div className="flex-1">
                        <Link to={`/profile/${request.to?._id}`} className="font-semibold text-gray-800 hover:underline">
                          {request.to?.name}
                        </Link>
                        <p className="text-gray-500 text-xs">Request pending</p>
                      </div>
                      <button
                        onClick={() => handleCancelRequest(request._id)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
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
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-3">
                  {filteredFriends.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500 text-sm">
                      {friends.length === 0 ? 'No friends yet' : 'No friends match your search'}
                    </div>
                  ) : (
                    filteredFriends.map((friend) => (
                      <div key={friend._id} className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4">
                        <Link to={`/profile/${friend._id}`}>
                          <img
                            src={friend.profilePhoto || 'https://res.cloudinary.com/demo/image/upload/v1556418119/default-avatar.png'}
                            alt=""
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        </Link>
                        <div className="flex-1">
                          <Link to={`/profile/${friend._id}`} className="font-semibold text-gray-800 hover:underline">
                            {friend.name}
                          </Link>
                          {friend.bio && (
                            <p className="text-gray-500 text-sm truncate">{friend.bio}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleUnfriend(friend._id)}
                          className="text-sm text-red-600 hover:underline"
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
    </div>
  );
};

export default FriendRequests;
