import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import API from '../api/axios';

const CreatorEarnings = () => {
  const [earnings, setEarnings] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [earningsRes, payoutsRes] = await Promise.all([
        API.get('/creator/dashboard'),
        API.get('/payouts/history'),
      ]);
      setEarnings(earningsRes.data);
      setPayouts(payoutsRes.data.payouts || []);
    } catch (err) {
      console.error('Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-jolshaa-surface-container-high rounded w-1/3" />
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-jolshaa-surface-container-high rounded" />)}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!earnings) return null;

  const statusColors = {
    pending: 'text-amber-600 bg-amber-50',
    processing: 'text-blue-600 bg-blue-50',
    completed: 'text-green-600 bg-green-50',
    rejected: 'text-red-600 bg-red-50',
    failed: 'text-red-600 bg-red-50',
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="font-display text-2xl font-bold mb-4 text-jolshaa-on-surface">Creator Earnings</h1>

        <div className="flex gap-4 border-b border-jolshaa-outline-variant mb-6">
          {['overview', 'payouts'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2 px-1 font-medium text-sm border-b-2 capitalize transition-colors ${
                tab === t
                  ? 'border-jolshaa-teal text-jolshaa-teal'
                  : 'border-transparent text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Earned', value: `${earnings.totalEarned?.toFixed(0) || '0'} BDT`, color: 'text-jolshaa-on-surface' },
                { label: 'Available Balance', value: `${earnings.availableBalance?.toFixed(0) || '0'} BDT`, color: 'text-green-600' },
                { label: 'Total Paid Out', value: `${earnings.totalPaidOut?.toFixed(0) || '0'} BDT`, color: 'text-blue-600' },
                { label: 'Pending Payout', value: `${earnings.pendingPayout?.toFixed(0) || '0'} BDT`, color: 'text-amber-600' },
              ].map(s => (
                <div key={s.label} className="bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-xl p-4 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-sm text-jolshaa-on-surface-variant">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-xl p-4">
                <h3 className="font-display text-sm font-semibold mb-2 text-jolshaa-on-surface">Star Gifts</h3>
                <p className="text-2xl font-bold text-amber-500">{earnings.starEarnings?.toFixed(0) || '0'} BDT</p>
              </div>
              <div className="bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-xl p-4">
                <h3 className="font-display text-sm font-semibold mb-2 text-jolshaa-on-surface">Subscriptions</h3>
                <p className="text-2xl font-bold text-purple-600">{earnings.subscriptionEarnings?.toFixed(0) || '0'} BDT</p>
              </div>
              <div className="bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-xl p-4">
                <h3 className="font-display text-sm font-semibold mb-2 text-jolshaa-on-surface">Video Ads</h3>
                <p className="text-2xl font-bold text-blue-600">{earnings.videoAdEarnings?.toFixed(0) || '0'} BDT</p>
              </div>
              <div className="bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-xl p-4">
                <h3 className="font-display text-sm font-semibold mb-2 text-jolshaa-on-surface">Ad Revenue</h3>
                <p className="text-2xl font-bold text-emerald-600">{earnings.adEarnings?.toFixed(0) || '0'} BDT</p>
              </div>
            </div>
          </div>
        )}

        {tab === 'payouts' && (
          <div className="bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-xl p-4">
            <h3 className="font-display font-semibold mb-4 text-jolshaa-on-surface">Payout History</h3>
            {payouts.length === 0 ? (
              <p className="text-jolshaa-on-surface-variant text-center py-8">No payouts yet. Minimum payout is 1,000 BDT.</p>
            ) : (
              <div className="space-y-3">
                {payouts.map(p => (
                  <div key={p._id} className="flex items-center justify-between p-3 bg-jolshaa-surface-container-high rounded-lg">
                    <div>
                      <p className="font-medium text-jolshaa-on-surface">{p.amount} BDT</p>
                      <p className="text-xs text-jolshaa-on-surface-variant">
                        {p.paymentMethod} &middot; {new Date(p.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusColors[p.status] || ''}`}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CreatorEarnings;
