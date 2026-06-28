import { useState, useEffect } from 'react';
import API from '../api/axios';

const SubscribeButton = ({ userId, onSubscribeChange }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!userId) return;
    API.get(`/subscriptions/check/${userId}`)
      .then(res => {
        setIsSubscribed(res.data.isSubscribed);
        setSubscriberCount(res.data.subscriberCount || 0);
        setPrice(res.data.subscriptionPrice || 0);
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [userId]);

  const handleSubscribe = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await API.post(`/subscriptions/subscribe/${userId}`);
      setIsSubscribed(res.data.isSubscribed);
      setSubscriberCount(res.data.subscriberCount);
      if (onSubscribeChange) onSubscribeChange(res.data.isSubscribed);
    } catch (err) {
      console.error('Subscribe failed', err);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <button disabled className="px-4 py-2 text-sm font-medium rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-wait">
        ...
      </button>
    );
  }

  if (price > 0 && !isSubscribed) {
    return (
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Processing...' : `Subscribe · $${price}/mo`}
      </button>
    );
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
        isSubscribed
          ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400'
          : 'bg-primary-600 text-white hover:bg-primary-700'
      }`}
    >
      {loading ? '...' : isSubscribed ? 'Subscribed ✓' : 'Subscribe'}
    </button>
  );
};

export default SubscribeButton;
