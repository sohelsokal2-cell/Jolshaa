import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import FriendButton from './FriendButton';

const SuggestedPeople = () => {
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuggested();
  }, []);

  const fetchSuggested = async () => {
    try {
      const res = await API.get('/friends/suggested');
      setSuggested(res.data.suggested);
    } catch (err) {
      console.error('Failed to fetch suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (userId, newStatus) => {
    if (newStatus === 'none' || newStatus === 'friends') {
      setSuggested(prev => prev.filter(u => u._id !== userId));
    }
  };

  if (loading) return null;
  if (suggested.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <h3 className="font-semibold text-gray-800 mb-3 text-sm">People You May Know</h3>
      <div className="space-y-3">
        {suggested.slice(0, 8).map((person) => (
          <div key={person._id} className="flex items-center gap-3">
            <Link to={`/profile/${person._id}`}>
              <img
                src={person.profilePhoto || 'https://res.cloudinary.com/demo/image/upload/v1556418119/default-avatar.png'}
                alt=""
                className="w-10 h-10 rounded-full object-cover"
              />
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/profile/${person._id}`} className="font-medium text-sm text-gray-800 hover:underline block truncate">
                {person.name}
              </Link>
              {person.mutualCount > 0 && (
                <p className="text-xs text-gray-500">{person.mutualCount} mutual friend{person.mutualCount !== 1 ? 's' : ''}</p>
              )}
            </div>
            <FriendButton
              userId={person._id}
              initialStatus="none"
              onStatusChange={(s) => handleStatusChange(person._id, s)}
            />
          </div>
        ))}
      </div>
      {suggested.length > 8 && (
        <Link to="/friends" className="block text-center text-blue-600 text-sm hover:underline mt-3">
          See More
        </Link>
      )}
    </div>
  );
};

export default SuggestedPeople;
