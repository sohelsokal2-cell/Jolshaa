import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import PostCard from '../components/PostCard';

const SavedPostsPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedPosts();
  }, []);

  const fetchSavedPosts = async () => {
    try {
      const res = await API.get(`/posts/saved/${user.id}`);
      setPosts(res.data.posts);
    } catch (err) {
      console.error('Failed to fetch saved posts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Saved Posts</h1>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-20 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-4">💾</p>
          <p className="text-gray-500">No saved posts yet</p>
          <p className="text-sm text-gray-400 mt-1">Save posts to read them later</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => <PostCard key={post._id} post={post} />)}
        </div>
      )}
    </div>
  );
};

export default SavedPostsPage;
