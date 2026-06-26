import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const PrivacySettings = () => {
  const { user, logout } = useAuth();
  const [privacy, setPrivacy] = useState({
    postVisibility: 'public',
    friendRequests: 'everyone',
    showFriendsList: 'everyone',
    commentPrivacy: 'everyone',
    storyVisibility: 'friends',
    messagePrivacy: 'everyone',
  });
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPrivacy();
    fetchBlockedUsers();
  }, []);

  const fetchPrivacy = async () => {
    try {
      const res = await API.get('/users/privacy');
      setPrivacy(res.data.privacy);
    } catch (err) {
      console.error('Failed to fetch privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      const res = await API.get('/users/blocked');
      setBlockedUsers(res.data.blockedUsers);
    } catch (err) {
      console.error('Failed to fetch blocked users');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await API.put('/users/privacy', privacy);
      setMessage('Settings saved!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleUnblock = async (userId) => {
    try {
      await API.post('/users/block', { userId });
      setBlockedUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      console.error('Failed to unblock user');
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) return;
    setDeleting(true);
    try {
      await API.delete('/auth/account', { data: { password: deletePassword } });
      localStorage.removeItem('token');
      window.location.href = '/login';
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-md px-6 py-3 sticky top-0 z-40">
          <div className="max-w-2xl mx-auto flex justify-between items-center">
            <Link to="/feed" className="text-xl font-bold text-blue-600">Jolshaa</Link>
          </div>
        </nav>
        <div className="max-w-2xl mx-auto mt-4 px-4 text-center py-8 text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md px-6 py-3 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <Link to="/feed" className="text-xl font-bold text-blue-600">Jolshaa</Link>
          <div className="flex items-center gap-4">
            <Link to="/security" className="text-sm text-gray-600 hover:text-blue-600">Security</Link>
            <Link to="/profile" className="text-sm text-gray-600 hover:text-blue-600">
              {user.name?.split(' ')[0]}
            </Link>
            <button onClick={logout} className="text-sm text-red-600 hover:underline">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto mt-4 px-4 pb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Privacy Settings</h2>

          {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              message.includes('saved') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {message}
            </div>
          )}

          {/* Post Visibility */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Default Post Visibility</label>
            <select
              value={privacy.postVisibility}
              onChange={(e) => setPrivacy({ ...privacy, postVisibility: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="public">Public - Anyone can see</option>
              <option value="friends">Friends - Only friends can see</option>
              <option value="onlyme">Only Me - Private</option>
            </select>
          </div>

          {/* Comment Privacy */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Who Can Comment On Your Posts</label>
            <select
              value={privacy.commentPrivacy}
              onChange={(e) => setPrivacy({ ...privacy, commentPrivacy: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="everyone">Everyone</option>
              <option value="friends">Friends Only</option>
              <option value="none">No One</option>
            </select>
          </div>

          {/* Story Visibility */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Who Can See Your Stories</label>
            <select
              value={privacy.storyVisibility}
              onChange={(e) => setPrivacy({ ...privacy, storyVisibility: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="public">Public</option>
              <option value="friends">Friends Only</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Message Privacy */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Who Can Send You Messages</label>
            <select
              value={privacy.messagePrivacy}
              onChange={(e) => setPrivacy({ ...privacy, messagePrivacy: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="everyone">Everyone</option>
              <option value="friends">Friends Only</option>
              <option value="none">No One</option>
            </select>
          </div>

          {/* Friend Requests */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Who Can Send Friend Requests</label>
            <select
              value={privacy.friendRequests}
              onChange={(e) => setPrivacy({ ...privacy, friendRequests: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="everyone">Everyone</option>
              <option value="friends_of_friends">Friends of Friends</option>
            </select>
          </div>

          {/* Friends List Visibility */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Who Can See Your Friends List</label>
            <select
              value={privacy.showFriendsList}
              onChange={(e) => setPrivacy({ ...privacy, showFriendsList: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="everyone">Everyone</option>
              <option value="friends">Friends Only</option>
              <option value="onlyme">Only Me</option>
            </select>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {/* Blocked Users */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Blocked Users</h3>
          {blockedUsers.length === 0 ? (
            <p className="text-gray-500 text-sm">You haven't blocked anyone</p>
          ) : (
            <div className="space-y-3">
              {blockedUsers.map((u) => (
                <div key={u._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <img
                      src={u.profilePhoto || 'https://res.cloudinary.com/demo/image/upload/v1556418119/default-avatar.png'}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className="font-medium text-gray-800">{u.name}</span>
                  </div>
                  <button
                    onClick={() => handleUnblock(u._id)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-4 border-2 border-red-200">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h3>
          <p className="text-sm text-gray-500 mb-4">Once you delete your account, there is no going back.</p>
          {!showDeleteAccount ? (
            <button
              onClick={() => setShowDeleteAccount(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700"
            >
              Delete Account
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-700">Enter your password to confirm:</p>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={!deletePassword || deleting}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
                <button
                  onClick={() => { setShowDeleteAccount(false); setDeletePassword(''); }}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;
