import { useState } from 'react';
import API from '../api/axios';

const FriendButton = ({ userId, initialStatus, initialRequestId, onStatusChange }) => {
  const [status, setStatus] = useState(initialStatus || 'none');
  const [requestId, setRequestId] = useState(initialRequestId || null);
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleSendRequest = async () => {
    setLoading(true);
    try {
      const res = await API.post('/friends/request', { userId });
      setStatus('pending_sent');
      setRequestId(res.data.request?._id);
      if (onStatusChange) onStatusChange('pending_sent');
    } catch (err) {
      console.error('Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!requestId) return;
    setLoading(true);
    try {
      await API.put(`/friends/${requestId}/accept`);
      setStatus('friends');
      setRequestId(null);
      if (onStatusChange) onStatusChange('friends');
    } catch (err) {
      console.error('Failed to accept');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!requestId) return;
    setLoading(true);
    try {
      await API.put(`/friends/${requestId}/reject`);
      setStatus('none');
      setRequestId(null);
      if (onStatusChange) onStatusChange('none');
    } catch (err) {
      console.error('Failed to reject');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfriend = async () => {
    setLoading(true);
    setShowMenu(false);
    try {
      await API.delete(`/friends/${userId}`);
      setStatus('none');
      if (onStatusChange) onStatusChange('none');
    } catch (err) {
      console.error('Failed to unfriend');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    setLoading(true);
    try {
      if (requestId) {
        await API.put(`/friends/${requestId}/reject`);
      } else {
        await API.delete(`/friends/${userId}`);
      }
      setStatus('none');
      setRequestId(null);
      if (onStatusChange) onStatusChange('none');
    } catch (err) {
      console.error('Failed to cancel');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'friends') {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          disabled={loading}
          className="flex items-center gap-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Friends
        </button>
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-lg border py-1 z-10 w-40">
            <button
              onClick={handleUnfriend}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              Unfriend
            </button>
          </div>
        )}
      </div>
    );
  }

  if (status === 'pending_sent') {
    return (
      <button
        onClick={handleCancelRequest}
        disabled={loading}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 disabled:opacity-50"
      >
        {loading ? 'Canceling...' : 'Cancel Request'}
      </button>
    );
  }

  if (status === 'pending_received') {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleAccept}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Accepting...' : 'Accept'}
        </button>
        <button
          onClick={handleReject}
          disabled={loading}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleSendRequest}
      disabled={loading}
      className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      {loading ? 'Sending...' : 'Add Friend'}
    </button>
  );
};

export default FriendButton;
