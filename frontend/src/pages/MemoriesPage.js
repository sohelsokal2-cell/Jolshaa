import { useState, useEffect } from 'react';
import API from '../api/axios';
import PostCard from '../components/PostCard';
import Layout from '../components/layout/Layout';

const MemoriesPage = () => {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    try {
      const res = await API.get('/posts/memories');
      setMemories(res.data.posts);
    } catch (err) {
      console.error('Failed to fetch memories');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2 text-on-surface">On This Day</h1>
      <p className="text-on-surface-variant text-sm mb-4">Your posts from this day in previous years</p>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-surface rounded-lg shadow-sm p-4 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
              <div className="h-20 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      ) : memories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-4">📷</p>
          <p className="text-on-surface-variant">No memories for today</p>
          <p className="text-sm text-on-surface-variant mt-1">Posts from this day in previous years will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {memories.map((post) => (
            <div key={post._id} className="relative">
              <div className="absolute -left-2 top-4 bg-primary-500/15 text-primary-400 text-xs font-medium px-2 py-1 rounded-r-lg z-10">
                {new Date(post.createdAt).getFullYear()}
              </div>
              <PostCard post={post} />
            </div>
          ))}
        </div>
      )}
    </div>
    </Layout>
  );
};

export default MemoriesPage;
