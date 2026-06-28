import { useState } from 'react';
import API from '../api/axios';

const BoostPostModal = ({ postId, onClose }) => {
  const [duration, setDuration] = useState(24);
  const [gateway, setGateway] = useState('stripe');
  const [loading, setLoading] = useState(false);

  const durations = [
    { hours: 6, label: '6 hours', price: 1 },
    { hours: 12, label: '12 hours', price: 2 },
    { hours: 24, label: '24 hours', price: 3 },
    { hours: 72, label: '3 days', price: 7 },
    { hours: 168, label: '7 days', price: 12 },
  ];

  const selectedDuration = durations.find(d => d.hours === duration);

  const handleBoost = async () => {
    setLoading(true);
    try {
      const checkoutRes = await API.post('/payments/checkout', {
        gateway,
        amount: selectedDuration.price,
        currency: gateway === 'sslcommerz' ? 'BDT' : 'USD',
        type: 'boost_payment',
        referenceId: postId,
        description: `Boost post for ${selectedDuration.label}`,
      });

      if (checkoutRes.data.sessionUrl) {
        window.location.href = checkoutRes.data.sessionUrl;
        return;
      }
      if (checkoutRes.data.gatewayUrl) {
        window.location.href = checkoutRes.data.gatewayUrl;
        return;
      }

      await API.post(`/boost/${postId}/boost`, { duration, paymentMethod: gateway });
      onClose();
    } catch (err) {
      console.error('Failed to boost post', err);
      alert(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-neutral-900 rounded-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Boost Post</h3>
          <p className="text-sm text-neutral-500">Increase your post's reach</p>
        </div>

        <div className="p-4 space-y-3">
          {durations.map((d) => (
            <button
              key={d.hours}
              onClick={() => setDuration(d.hours)}
              className={`w-full flex justify-between items-center p-3 rounded-lg border transition-colors ${
                duration === d.hours
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
              }`}
            >
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{d.label}</span>
              <span className="text-sm font-bold text-primary-600 dark:text-primary-400">${d.price}.00</span>
            </button>
          ))}
        </div>

        <div className="px-4 pb-3">
          <label className="block text-xs font-medium text-neutral-500 mb-1.5">Payment Method</label>
          <div className="flex gap-2">
            <button
              onClick={() => setGateway('stripe')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                gateway === 'stripe'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              💳 Card (Stripe)
            </button>
            <button
              onClick={() => setGateway('sslcommerz')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                gateway === 'sslcommerz'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              📱 bKash/SSLCommerz
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
          >
            Cancel
          </button>
          <button
            onClick={handleBoost}
            disabled={loading}
            className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Processing...' : `Pay $${selectedDuration.price}.00 & Boost`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BoostPostModal;
