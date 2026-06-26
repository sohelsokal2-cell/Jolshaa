import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const CreatorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [topPosts, setTopPosts] = useState([]);
  const [audience, setAudience] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [dashRes, audienceRes] = await Promise.all([
        API.get('/creator/dashboard'),
        API.get('/creator/audience'),
      ]);
      setStats(dashRes.data.stats);
      setTopPosts(dashRes.data.topPosts);
      setAudience(audienceRes.data);
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
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Creator Dashboard</h1>

      <div className="flex gap-4 border-b mb-6">
        {['overview', 'audience', 'posts'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 px-1 font-medium text-sm border-b-2 capitalize ${
              tab === t ? 'border-blue-600 text-blue-600' : 'text-gray-500'
            }`}
          >
            {t}
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
              <div key={s.label} className="bg-white rounded-lg shadow-sm p-4 text-center">
                <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <p className="text-xl font-bold text-blue-600">{stats.totalReach}</p>
              <p className="text-sm text-gray-500">Total Reach</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <p className="text-xl font-bold text-purple-600">{stats.totalImpressions}</p>
              <p className="text-sm text-gray-500">Total Impressions</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <p className="text-xl font-bold text-green-600">{stats.totalEngagement}</p>
              <p className="text-sm text-gray-500">Total Engagement</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'audience' && audience && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-semibold mb-3">Gender Breakdown</h3>
            <div className="flex gap-4">
              {Object.entries(audience.genderBreakdown).map(([gender, count]) => (
                <div key={gender} className="text-center">
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-sm text-gray-500 capitalize">{gender}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-semibold mb-3">Top Locations</h3>
            <div className="space-y-2">
              {audience.topLocations.map((loc, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{loc.name}</span>
                  <span className="text-gray-500">{loc.count} followers</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'posts' && (
        <div className="space-y-4">
          <h3 className="font-semibold">Top Performing Posts</h3>
          {topPosts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No posts yet</p>
          ) : (
            topPosts.map((post) => (
              <div key={post._id} className="bg-white rounded-lg shadow-sm p-4">
                <p className="text-sm text-gray-800 mb-2">{post.text}...</p>
                <div className="flex gap-4 text-xs text-gray-500">
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
  );
};

export default CreatorDashboard;
