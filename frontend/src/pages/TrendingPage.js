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
      <div className="mt-2 pb-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-4 animate-pulse">
              <div className="h-4 bg-jolshaa-surface-container-low rounded w-1/3 mb-3" />
              <div className="h-20 bg-jolshaa-surface-container-low rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="mt-2 pb-8">
      <h1 className="text-2xl font-bold font-display mb-4 text-jolshaa-on-surface">Trending</h1>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-jolshaa-outline-variant mb-4">
        <button
          onClick={() => setTab('posts')}
          className={`pb-2 px-1 font-medium text-sm border-b-2 transition-colors ${
            tab === 'posts' ? 'border-jolshaa-teal text-jolshaa-teal' : 'border-transparent text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface'
          }`}
        >
          Trending Posts
        </button>
        <button
          onClick={() => setTab('hashtags')}
          className={`pb-2 px-1 font-medium text-sm border-b-2 transition-colors ${
            tab === 'hashtags' ? 'border-jolshaa-teal text-jolshaa-teal' : 'border-transparent text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface'
          }`}
        >
          Trending Hashtags
        </button>
      </div>

      {tab === 'posts' && (
        <div className="space-y-4">
          {trendingPosts.length === 0 ? (
            <p className="text-jolshaa-on-surface-variant text-center py-8">No trending posts yet</p>
          ) : (
            trendingPosts.map((post) => <PostCard key={post._id} post={post} />)
          )}
        </div>
      )}

      {tab === 'hashtags' && (
        <div className="grid grid-cols-2 gap-3">
          {hashtags.length === 0 ? (
            <p className="text-jolshaa-on-surface-variant text-center py-8 col-span-2">No trending hashtags yet</p>
          ) : (
            hashtags.map((tag) => (
              <div
                key={tag._id}
                className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-4 hover:shadow-ambient-hover transition-shadow"
              >
                <p className="font-semibold text-jolshaa-teal">#{tag._id}</p>
                <p className="text-sm text-jolshaa-on-surface-variant">{tag.count} posts</p>
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
