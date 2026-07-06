import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';

const SubscribeButton = ({ userId, onSubscribeChange }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [hasTiers, setHasTiers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      API.get(`/subscriptions/check/${userId}`).catch(() => ({ data: {} })),
      API.get(`/subscriptions/tiers/${userId}`).catch(() => ({ data: { tiers: [] } })),
    ]).then(([checkRes, tiersRes]) => {
      setIsSubscribed(checkRes.data.isSubscribed || false);
      setHasTiers((tiersRes.data.tiers || []).length > 0);
    }).finally(() => setChecking(false));
  }, [userId]);

  if (checking) {
    return (
      <button disabled className="px-4 py-2 text-sm font-medium rounded-lg bg-jolshaa-surface-container text-jolshaa-on-surface-variant/60 cursor-wait">
        ...
      </button>
    );
  }

  if (hasTiers) {
    return (
      <Link
        to={`/creator/subscriptions/${userId}`}
        className="px-4 py-2 text-sm font-medium rounded-lg bg-jolshaa-teal text-white hover:bg-jolshaa-teal-dark transition-colors inline-block"
      >
        {isSubscribed ? 'Subscribed ✓' : 'Subscribe'}
      </Link>
    );
  }

  return (
    <Link
      to={`/creator/subscriptions/${userId}`}
      className="px-4 py-2 text-sm font-medium rounded-lg bg-jolshaa-teal text-white hover:bg-jolshaa-teal-dark transition-colors inline-block"
    >
      View Tiers
    </Link>
  );
};

export default SubscribeButton;
