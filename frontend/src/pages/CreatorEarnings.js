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
            <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3" />
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-neutral-200 dark:bg-neutral-700 rounded" />)}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!earnings) return null;

  const statusColors = {
    pending: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
    processing: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    completed: 'text-green-600 bg-green-50 dark:bg-green-900/20',
    rejected: 'text-red-600 bg-red-50 dark:bg-red-900/20',
    failed: 'text-red-600 bg-red-50 dark:bg-red-900/20',
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">Creator Earnings</h1>

        <div className="flex gap-4 border-b border-neutral-200 dark:border-neutral-700 mb-6">
          {['overview', 'payouts'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2 px-1 font-medium text-sm border-b-2 capitalize transition-colors ${
                tab === t
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
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
                { label: 'Total Earned', value: `${earnings.totalEarned?.toFixed(0) || '0'} BDT`, color: 'text-neutral-900 dark:text-neutral-100' },
                { label: 'Available Balance', value: `${earnings.availableBalance?.toFixed(0) || '0'} BDT`, color: 'text-green-600' },
                { label: 'Total Paid Out', value: `${earnings.totalPaidOut?.toFixed(0) || '0'} BDT`, color: 'text-blue-600' },
                { label: 'Pending Payout', value: `${earnings.pendingPayout?.toFixed(0) || '0'} BDT`, color: 'text-amber-600' },
              ].map(s => (
                <div key={s.label} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-sm text-neutral-500">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-2 text-neutral-900 dark:text-neutral-100">Star Gifts</h3>
                <p className="text-2xl font-bold text-amber-500">{earnings.starEarnings?.toFixed(0) || '0'} BDT</p>
              </div>
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-2 text-neutral-900 dark:text-neutral-100">Subscriptions</h3>
                <p className="text-2xl font-bold text-purple-600">{earnings.subscriptionEarnings?.toFixed(0) || '0'} BDT</p>
              </div>
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-2 text-neutral-900 dark:text-neutral-100">Video Ads</h3>
                <p className="text-2xl font-bold text-blue-600">{earnings.videoAdEarnings?.toFixed(0) || '0'} BDT</p>
              </div>
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-2 text-neutral-900 dark:text-neutral-100">Ad Revenue</h3>
                <p className="text-2xl font-bold text-emerald-600">{earnings.adEarnings?.toFixed(0) || '0'} BDT</p>
              </div>
            </div>
          </div>
        )}

        {tab === 'payouts' && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
            <h3 className="font-semibold mb-4 text-neutral-900 dark:text-neutral-100">Payout History</h3>
            {payouts.length === 0 ? (
              <p className="text-neutral-500 text-center py-8">No payouts yet. Minimum payout is 1,000 BDT.</p>
            ) : (
              <div className="space-y-3">
                {payouts.map(p => (
                  <div key={p._id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">{p.amount} BDT</p>
                      <p className="text-xs text-neutral-500">
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
