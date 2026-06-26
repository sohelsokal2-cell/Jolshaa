import { useState } from 'react';
import API from '../api/axios';

const BoostPostModal = ({ postId, onClose }) => {
  const [duration, setDuration] = useState(24);
  const [loading, setLoading] = useState(false);

  const durations = [
    { hours: 6, label: '6 hours', price: '$1.00' },
    { hours: 12, label: '12 hours', price: '$2.00' },
    { hours: 24, label: '24 hours', price: '$3.00' },
    { hours: 72, label: '3 days', price: '$7.00' },
    { hours: 168, label: '7 days', price: '$12.00' },
  ];

  const handleBoost = async () => {
    setLoading(true);
    try {
      await API.post(`/boost/${postId}/boost`, { duration });
      onClose();
    } catch (err) {
      console.error('Failed to boost post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-800">Boost Post</h3>
          <p className="text-sm text-gray-500">Increase your post's reach</p>
        </div>

        <div className="p-4 space-y-3">
          {durations.map((d) => (
            <button
              key={d.hours}
              onClick={() => setDuration(d.hours)}
              className={`w-full flex justify-between items-center p-3 rounded-lg border ${
                duration === d.hours ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <span className="text-sm font-medium">{d.label}</span>
              <span className="text-sm font-bold text-blue-600">{d.price}</span>
            </button>
          ))}
        </div>

        <div className="p-4 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleBoost}
            disabled={loading}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Boosting...' : 'Boost Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BoostPostModal;
