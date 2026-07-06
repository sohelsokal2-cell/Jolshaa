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
        <div className="mt-2 pb-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-jolshaa-surface-container-low rounded w-1/3" />
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-jolshaa-surface-container-low rounded-xl" />)}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const earningsCards = earnings ? [
    { label: 'Total Earnings', value: `৳${(earnings.totalEarnings || 0).toLocaleString()}`, color: 'text-jolshaa-on-surface' },
    { label: 'Available Balance', value: `৳${(earnings.availableBalance || 0).toLocaleString()}`, color: 'text-green-600' },
    { label: 'Pending Balance', value: `৳${(earnings.pendingBalance || 0).toLocaleString()}`, color: 'text-amber-600' },
    { label: 'This Month', value: `৳${(earnings.breakdown?.adRevenue || 0 + earnings.breakdown?.subscriptionRevenue || 0 + earnings.breakdown?.starRevenue || 0).toLocaleString()}`, color: 'text-jolshaa-indigo' },
  ] : [];

  return (
    <Layout>
      <div className="mt-2 pb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-display text-jolshaa-on-surface">Creator Dashboard</h1>
          <div className="flex gap-2">
            <Link to="/creator/earnings" className="px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors">
              View Earnings
            </Link>
            <Link to="/creator/apply" className="px-4 py-2 text-sm font-medium rounded-lg border border-jolshaa-outline-variant text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container-low transition-colors">
              Monetization Settings
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-jolshaa-outline-variant mb-6">
          {['overview', 'earnings', 'audience', 'posts'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2 px-1 font-medium text-sm border-b-2 capitalize transition-colors ${
                tab === t ? 'border-jolshaa-indigo text-jolshaa-indigo' : 'border-transparent text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface'
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
                <div key={s.label} className="bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-xl p-4 text-center shadow-ambient">
                  <p className="text-2xl font-bold text-jolshaa-on-surface">{s.value}</p>
                  <p className="text-sm text-jolshaa-on-surface-variant">{s.label}</p>
                </div>
              ))}
            </div>

            {earnings && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {earningsCards.map(c => (
                  <div key={c.label} className="bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-xl p-4 text-center shadow-ambient">
                    <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                    <p className="text-sm text-jolshaa-on-surface-variant">{c.label}</p>
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
              <div className="bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-xl p-4 shadow-ambient">
                <h3 className="text-sm font-medium text-jolshaa-on-surface-variant mb-1">Ad Revenue</h3>
                <p className="text-2xl font-bold text-blue-600">৳{(earnings.breakdown?.adRevenue || 0).toLocaleString()}</p>
                <p className="text-xs text-jolshaa-on-surface-variant">From in-stream video ads</p>
              </div>
              <div className="bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-xl p-4 shadow-ambient">
                <h3 className="text-sm font-medium text-jolshaa-on-surface-variant mb-1">Subscription Revenue</h3>
                <p className="text-2xl font-bold text-jolshaa-indigo">৳{(earnings.breakdown?.subscriptionRevenue || 0).toLocaleString()}</p>
                <p className="text-xs text-jolshaa-on-surface-variant">From fan subscriptions</p>
              </div>
              <div className="bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-xl p-4 shadow-ambient">
                <h3 className="text-sm font-medium text-jolshaa-on-surface-variant mb-1">Star Gifts</h3>
                <p className="text-2xl font-bold text-amber-600">৳{(earnings.breakdown?.starRevenue || 0).toLocaleString()}</p>
                <p className="text-xs text-jolshaa-on-surface-variant">From star gifts</p>
              </div>
            </div>

            {earnings.chartData?.length > 0 && (
              <div className="bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-xl p-4 shadow-ambient">
                <h3 className="font-semibold font-display mb-4 text-jolshaa-on-surface">Earnings (Last 30 Days)</h3>
                <div className="space-y-2">
                  {earnings.chartData.map(day => (
                    <div key={day._id} className="flex items-center gap-3">
                      <span className="text-xs text-jolshaa-on-surface-variant w-20">{day._id}</span>
                      <div className="flex-1 bg-jolshaa-surface-container-low rounded-full h-4">
                        <div
                          className="bg-jolshaa-indigo h-4 rounded-full"
                          style={{ width: `${Math.min(100, (day.earnings / Math.max(...earnings.chartData.map(d => d.earnings))) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-jolshaa-on-surface w-16 text-right">
                        ৳{day.earnings.toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Link to="/creator/earnings" className="block text-center text-jolshaa-indigo hover:underline text-sm font-medium">
              View Full Earnings Dashboard →
            </Link>
          </div>
        )}

        {/* Audience Tab */}
        {tab === 'audience' && dashboard && (
          <div className="bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-xl p-6 shadow-ambient">
            <h3 className="font-semibold font-display mb-4 text-jolshaa-on-surface">Audience Overview</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-jolshaa-on-surface">{dashboard.stats?.followerCount || 0}</p>
                <p className="text-sm text-jolshaa-on-surface-variant">Followers</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-jolshaa-on-surface">{dashboard.stats?.totalPosts || 0}</p>
                <p className="text-sm text-jolshaa-on-surface-variant">Posts</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-jolshaa-on-surface">{dashboard.stats?.totalReach?.toLocaleString() || 0}</p>
                <p className="text-sm text-jolshaa-on-surface-variant">Total Reach</p>
              </div>
            </div>
          </div>
        )}

        {/* Posts Tab */}
        {tab === 'posts' && (
          <div className="space-y-4">
            <h3 className="font-semibold font-display text-jolshaa-on-surface">Top Performing Posts</h3>
            {dashboard?.topPosts?.length === 0 ? (
              <p className="text-jolshaa-on-surface-variant text-center py-8">No posts yet</p>
            ) : (
              dashboard?.topPosts?.map(post => (
                <div key={post._id} className="bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-xl p-4 shadow-ambient">
                  <p className="text-sm text-jolshaa-on-surface mb-2">{post.text}...</p>
                  <div className="flex gap-4 text-xs text-jolshaa-on-surface-variant">
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
