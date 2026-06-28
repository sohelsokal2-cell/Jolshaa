import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Layout from '../components/layout/Layout';

const CreatorSubscriptionManager = () => {
  const { user } = useAuth();
  const [price, setPrice] = useState(0);
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subRes, priceRes] = await Promise.all([
        API.get('/subscriptions/subscribers'),
        API.get('/subscriptions/check/' + user.id),
      ]);
      setSubscribers(subRes.data.subscribers || []);
      setPrice(priceRes.data.subscriptionPrice || 0);
    } catch (err) {
      console.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrice = async () => {
    const newPrice = parseFloat(price);
    if (isNaN(newPrice) || newPrice < 0) {
      setMessage('Please enter a valid price');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      await API.put('/subscriptions/price', { price: newPrice });
      setMessage('Price updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update price');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3" />
            <div className="h-40 bg-neutral-200 dark:bg-neutral-700 rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">Subscription Management</h1>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100">Set Subscription Price</h2>
          <p className="text-sm text-neutral-500 mb-4">
            Set a monthly price for your subscribers. They'll be charged this amount each month to access your exclusive content.
          </p>
          <div className="flex items-end gap-3">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Monthly Price ($)</label>
              <input
                type="number"
                min="0"
                step="0.99"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSavePrice}
              disabled={saving}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
          {message && (
            <p className={`text-sm mt-2 ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
          {price > 0 && (
            <p className="text-xs text-neutral-400 mt-2">
              Set to $0 to make subscriptions free
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
            Your Subscribers ({subscribers.length})
          </h2>
          {subscribers.length === 0 ? (
            <p className="text-neutral-500 text-center py-8">No subscribers yet</p>
          ) : (
            <div className="space-y-3">
              {subscribers.map(sub => (
                <div key={sub._id} className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  {sub.profilePhoto ? (
                    <img src={sub.profilePhoto} alt={sub.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 font-bold text-sm">
                      {sub.name?.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{sub.name}</p>
                    <p className="text-xs text-neutral-500">Subscriber</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CreatorSubscriptionManager;
