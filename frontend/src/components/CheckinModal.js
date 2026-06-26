import { useState } from 'react';
import API from '../api/axios';

const CheckinModal = ({ onClose, onCheckin }) => {
  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const popularLocations = [
    'Restaurant', 'Cafe', 'Gym', 'Park', 'Mall',
    'Movie Theater', 'Airport', 'Hotel', 'Beach', 'Library',
  ];

  const handleCheckin = async () => {
    if (!locationName.trim()) return;

    setLoading(true);
    try {
      await API.post('/hashtags/checkins', {
        locationName: locationName.trim(),
        address,
        message,
      });
      onCheckin?.();
      onClose();
    } catch (err) {
      console.error('Failed to check in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b">
          <h3 className="font-semibold">Check In</h3>
        </div>

        <div className="p-4 space-y-3">
          <input
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="Where are you?"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex flex-wrap gap-2">
            {popularLocations.map(loc => (
              <button
                key={loc}
                onClick={() => setLocationName(loc)}
                className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full"
              >
                {loc}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Address (optional)"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
          />
        </div>

        <div className="p-4 border-t flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 border rounded-lg text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleCheckin}
            disabled={!locationName.trim() || loading}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Checking in...' : 'Check In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckinModal;
