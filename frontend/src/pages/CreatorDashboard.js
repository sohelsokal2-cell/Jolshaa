import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import Layout from '../components/layout/Layout';

const CreatorDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    Promise.all([
      API.get('/creator/dashboard').catch(() => ({ data: null })),
      API.get('/creator/earnings-dashboard').catch(() => ({ data: null })),
    ]).then(([dashRes, earnRes]) => {
      setDashboard(dashRes.data);
      setEarnings(earnRes.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3" />
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-neutral-200 dark:bg-neutral-700 rounded-xl" />)}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const earningsCards = earnings ? [
    { label: 'Total Earnings', value: `৳${(earnings.totalEarnings || 0).toLocaleString()}`, color: 'text-neutral-900 dark:text-neutral-100' },
    { label: 'Available Balance', value: `৳${(earnings.availableBalance || 0).toLocaleString()}`, color: 'text-green-600' },
    { label: 'Pending Balance', value: `৳${(earnings.pendingBalance || 0).toLocaleString()}`, color: 'text-amber-600' },
    { label: 'This Month', value: `৳${(earnings.breakdown?.adRevenue || 0 + earnings.breakdown?.subscriptionRevenue || 0 + earnings.breakdown?.starRevenue || 0).toLocaleString()}`, color: 'text-primary-600' },
  ] : [];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Creator Dashboard</h1>
          <div className="flex gap-2">
            <Link to="/creator/earnings" className="px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors">
              View Earnings
            </Link>
            <Link to="/creator/apply" className="px-4 py-2 text-sm font-medium rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              Monetization Settings
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-neutral-200 dark:border-neutral-700 mb-6">
          {['overview', 'earnings', 'audience', 'posts'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2 px-1 font-medium text-sm border-b-2 capitalize transition-colors ${
                tab === t ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Followers', value: dashboard?.stats?.followerCount || 0 },
                { label: 'Posts', value: dashboard?.stats?.totalPosts || 0 },
                { label: 'Total Reach', value: dashboard?.stats?.totalReach?.toLocaleString() || 0 },
                { label: 'Avg Engagement', value: dashboard?.stats?.avgEngagementRate || 0 },
              ].map(s => (
                <div key={s.label} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{s.value}</p>
                  <p className="text-sm text-neutral-500">{s.label}</p>
                </div>
              ))}
            </div>

            {earnings && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {earningsCards.map(c => (
                  <div key={c.label} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 text-center">
                    <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                    <p className="text-sm text-neutral-500">{c.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Earnings Tab */}
        {tab === 'earnings' && earnings && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
                <h3 className="text-sm font-medium text-neutral-500 mb-1">Ad Revenue</h3>
                <p className="text-2xl font-bold text-blue-600">৳{(earnings.breakdown?.adRevenue || 0).toLocaleString()}</p>
                <p className="text-xs text-neutral-400">From in-stream video ads</p>
              </div>
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
                <h3 className="text-sm font-medium text-neutral-500 mb-1">Subscription Revenue</h3>
                <p className="text-2xl font-bold text-purple-600">৳{(earnings.breakdown?.subscriptionRevenue || 0).toLocaleString()}</p>
                <p className="text-xs text-neutral-400">From fan subscriptions</p>
              </div>
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
                <h3 className="text-sm font-medium text-neutral-500 mb-1">Star Gifts</h3>
                <p className="text-2xl font-bold text-amber-600">৳{(earnings.breakdown?.starRevenue || 0).toLocaleString()}</p>
                <p className="text-xs text-neutral-400">From star gifts</p>
              </div>
            </div>

            {earnings.chartData?.length > 0 && (
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
                <h3 className="font-semibold mb-4 text-neutral-900 dark:text-neutral-100">Earnings (Last 30 Days)</h3>
                <div className="space-y-2">
                  {earnings.chartData.map(day => (
                    <div key={day._id} className="flex items-center gap-3">
                      <span className="text-xs text-neutral-500 w-20">{day._id}</span>
                      <div className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-full h-4">
                        <div
                          className="bg-primary-500 h-4 rounded-full"
                          style={{ width: `${Math.min(100, (day.earnings / Math.max(...earnings.chartData.map(d => d.earnings))) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 w-16 text-right">
                        ৳{day.earnings.toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Link to="/creator/earnings" className="block text-center text-primary-600 hover:underline text-sm font-medium">
              View Full Earnings Dashboard →
            </Link>
          </div>
        )}

        {/* Audience Tab */}
        {tab === 'audience' && dashboard && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
            <h3 className="font-semibold mb-4 text-neutral-900 dark:text-neutral-100">Audience Overview</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{dashboard.stats?.followerCount || 0}</p>
                <p className="text-sm text-neutral-500">Followers</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{dashboard.stats?.totalPosts || 0}</p>
                <p className="text-sm text-neutral-500">Posts</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{dashboard.stats?.totalReach?.toLocaleString() || 0}</p>
                <p className="text-sm text-neutral-500">Total Reach</p>
              </div>
            </div>
          </div>
        )}

        {/* Posts Tab */}
        {tab === 'posts' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Top Performing Posts</h3>
            {dashboard?.topPosts?.length === 0 ? (
              <p className="text-neutral-500 text-center py-8">No posts yet</p>
            ) : (
              dashboard?.topPosts?.map(post => (
                <div key={post._id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
                  <p className="text-sm text-neutral-900 dark:text-neutral-100 mb-2">{post.text}...</p>
                  <div className="flex gap-4 text-xs text-neutral-500">
                    <span>Reach: {post.reach}</span>
                    <span>Engagement: {post.engagement}</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CreatorDashboard;
