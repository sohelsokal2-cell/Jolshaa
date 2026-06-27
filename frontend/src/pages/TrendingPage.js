import { useState, useEffect } from 'react';
import API from '../api/axios';
import PostCard from '../components/PostCard';
import Layout from '../components/layout/Layout';

const TrendingPage = () => {
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [hashtags, setHashtags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('posts');

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      const [postsRes, tagsRes] = await Promise.all([
        API.get('/posts/trending'),
        API.get('/posts/trending-hashtags'),
      ]);
      setTrendingPosts(postsRes.data.posts);
      setHashtags(tagsRes.data.hashtags);
    } catch (err) {
      console.error('Failed to fetch trending');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface rounded-lg shadow-sm p-4 animate-pulse">
              <div className="h-4 bg-surface-high rounded w-1/3 mb-3" />
              <div className="h-20 bg-surface-high rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-on-surface">Trending</h1>

      {/* Tabs */}
      <div className="flex gap-4 border-b mb-4">
        <button
          onClick={() => setTab('posts')}
          className={`pb-2 px-1 font-medium text-sm border-b-2 ${
            tab === 'posts' ? 'border-primary-500 text-primary-400' : 'text-on-surface-variant'
          }`}
        >
          Trending Posts
        </button>
        <button
          onClick={() => setTab('hashtags')}
          className={`pb-2 px-1 font-medium text-sm border-b-2 ${
            tab === 'hashtags' ? 'border-primary-500 text-primary-400' : 'text-on-surface-variant'
          }`}
        >
          Trending Hashtags
        </button>
      </div>

      {tab === 'posts' && (
        <div className="space-y-4">
          {trendingPosts.length === 0 ? (
            <p className="text-on-surface-variant text-center py-8">No trending posts yet</p>
          ) : (
            trendingPosts.map((post) => <PostCard key={post._id} post={post} />)
          )}
        </div>
      )}

      {tab === 'hashtags' && (
        <div className="grid grid-cols-2 gap-3">
          {hashtags.length === 0 ? (
            <p className="text-on-surface-variant text-center py-8 col-span-2">No trending hashtags yet</p>
          ) : (
            hashtags.map((tag) => (
              <div
                key={tag._id}
                className="bg-surface rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <p className="font-semibold text-primary-400">#{tag._id}</p>
                <p className="text-sm text-on-surface-variant">{tag.count} posts</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
    </Layout>
  );
};

export default TrendingPage;
