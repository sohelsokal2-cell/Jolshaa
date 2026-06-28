import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Layout from '../components/layout/Layout';

const CreatorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [topPosts, setTopPosts] = useState([]);
  const [audience, setAudience] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [dashRes, audienceRes, earningsRes] = await Promise.all([
        API.get('/creator/dashboard'),
        API.get('/creator/audience'),
        API.get('/creator/earnings').catch(() => ({ data: null })),
      ]);
      setStats(dashRes.data.stats);
      setTopPosts(dashRes.data.topPosts);
      setAudience(audienceRes.data);
      setEarnings(earningsRes.data);
    } catch (err) {
      console.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface-high/50 rounded w-1/3" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-surface-high/50 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-on-surface">Creator Dashboard</h1>

      <div className="flex gap-4 border-b mb-6">
        {['overview', 'audience', 'posts', 'earnings', 'subscriptions'].map((t) => (
          <button
            key={t}
            onClick={() => t === 'earnings' || t === 'subscriptions' ? null : setTab(t)}
            className={`pb-2 px-1 font-medium text-sm border-b-2 capitalize ${
              tab === t ? 'border-primary-500 text-primary-400' : 'text-on-surface-variant'
            }`}
          >
            {t === 'earnings' ? (
              <Link to="/creator/earnings" className="text-on-surface-variant hover:text-primary-400">earnings</Link>
            ) : t === 'subscriptions' ? (
              <Link to="/creator/subscriptions" className="text-on-surface-variant hover:text-primary-400">subscriptions</Link>
            ) : t}
          </button>
        ))}
      </div>

      {tab === 'overview' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Followers', value: stats.followerCount },
              { label: 'Subscribers', value: stats.subscriberCount },
              { label: 'Posts', value: stats.totalPosts },
              { label: 'Avg Engagement', value: stats.avgEngagementRate },
            ].map((s) => (
              <div key={s.label} className="bg-surface rounded-lg shadow-sm p-4 text-center">
                <p className="text-2xl font-bold text-on-surface">{s.value}</p>
                <p className="text-sm text-on-surface-variant">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface rounded-lg shadow-sm p-4 text-center">
              <p className="text-xl font-bold text-primary-400">{stats.totalReach}</p>
              <p className="text-sm text-on-surface-variant">Total Reach</p>
            </div>
            <div className="bg-surface rounded-lg shadow-sm p-4 text-center">
              <p className="text-xl font-bold text-purple-600">{stats.totalImpressions}</p>
              <p className="text-sm text-on-surface-variant">Total Impressions</p>
            </div>
            <div className="bg-surface rounded-lg shadow-sm p-4 text-center">
              <p className="text-xl font-bold text-green-600">{stats.totalEngagement}</p>
              <p className="text-sm text-on-surface-variant">Total Engagement</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'audience' && audience && (
        <div className="space-y-6">
          <div className="bg-surface rounded-lg shadow-sm p-4">
            <h3 className="font-semibold mb-3 text-on-surface">Gender Breakdown</h3>
            <div className="flex gap-4">
              {Object.entries(audience.genderBreakdown).map(([gender, count]) => (
                <div key={gender} className="text-center">
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-sm text-on-surface-variant capitalize">{gender}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface rounded-lg shadow-sm p-4">
            <h3 className="font-semibold mb-3 text-on-surface">Top Locations</h3>
            <div className="space-y-2">
              {audience.topLocations.map((loc, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{loc.name}</span>
                  <span className="text-on-surface-variant">{loc.count} followers</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'posts' && (
        <div className="space-y-4">
          <h3 className="font-semibold text-on-surface">Top Performing Posts</h3>
          {topPosts.length === 0 ? (
            <p className="text-on-surface-variant text-center py-8">No posts yet</p>
          ) : (
            topPosts.map((post) => (
              <div key={post._id} className="bg-surface rounded-lg shadow-sm p-4">
                <p className="text-sm text-on-surface mb-2">{post.text}...</p>
                <div className="flex gap-4 text-xs text-on-surface-variant">
                  <span>Reach: {post.reach}</span>
                  <span>Engagement: {post.engagement}</span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'earnings' && (
        <div className="space-y-6">
          {earnings ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Earned', value: `$${earnings.totalEarned?.toFixed(2) || '0.00'}`, color: 'text-on-surface' },
                  { label: 'Available Balance', value: `$${earnings.availableBalance?.toFixed(2) || '0.00'}`, color: 'text-green-600' },
                  { label: 'Total Paid Out', value: `$${earnings.totalPaidOut?.toFixed(2) || '0.00'}`, color: 'text-blue-600' },
                  { label: 'Pending Payout', value: `$${earnings.pendingPayout?.toFixed(2) || '0.00'}`, color: 'text-amber-600' },
                ].map(s => (
                  <div key={s.label} className="bg-surface rounded-lg shadow-sm p-4 text-center">
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-sm text-on-surface-variant">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface rounded-lg shadow-sm p-4">
                  <h3 className="font-semibold mb-3 text-on-surface">Tips</h3>
                  <p className="text-2xl font-bold text-emerald-600">${earnings.tipRevenue?.toFixed(2) || '0.00'}</p>
                  <p className="text-sm text-on-surface-variant">{earnings.tipCount || 0} tips received</p>
                </div>
                <div className="bg-surface rounded-lg shadow-sm p-4">
                  <h3 className="font-semibold mb-3 text-on-surface">Subscriptions</h3>
                  <p className="text-2xl font-bold text-purple-600">${earnings.subscriptionRevenue?.toFixed(2) || '0.00'}</p>
                  <p className="text-sm text-on-surface-variant">{earnings.subscriptionCount || 0} subscriptions</p>
                </div>
              </div>

              <div className="bg-surface rounded-lg shadow-sm p-4">
                <h3 className="font-semibold mb-3 text-on-surface">Recent Transactions</h3>
                {earnings.recentTransactions?.length === 0 ? (
                  <p className="text-on-surface-variant text-center py-4">No transactions yet</p>
                ) : (
                  <div className="space-y-2">
                    {earnings.recentTransactions?.slice(0, 5).map(tx => (
                      <div key={tx._id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-on-surface">
                            {tx.type === 'tip' ? 'Tip' : tx.type === 'subscription' ? 'Subscription' : tx.type}
                          </p>
                          <p className="text-xs text-on-surface-variant">{new Date(tx.createdAt).toLocaleDateString()}</p>
                        </div>
                        <p className="font-bold text-green-600">+${tx.amount.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Link to="/creator/earnings" className="block text-center text-primary-600 hover:underline text-sm font-medium">
                View Full Earnings Dashboard →
              </Link>
            </>
          ) : (
            <p className="text-on-surface-variant text-center py-8">Earnings data not available</p>
          )}
        </div>
      )}

      {tab === 'subscriptions' && (
        <div className="space-y-6">
          <div className="bg-surface rounded-lg shadow-sm p-6">
            <h3 className="font-semibold mb-4 text-on-surface">Subscription Management</h3>
            <p className="text-sm text-on-surface-variant mb-4">
              Set a monthly price for your subscribers. They'll be charged this amount each month to access your exclusive content.
            </p>
            <Link to="/creator/subscriptions" className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors">
              Manage Subscriptions
            </Link>
          </div>
        </div>
      )}
    </div>
    </Layout>
  );
};

export default CreatorDashboard;
