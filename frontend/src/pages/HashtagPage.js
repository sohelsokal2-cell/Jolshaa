import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/axios';
import PostCard from '../components/PostCard';
import Layout from '../components/layout/Layout';

const HashtagPage = () => {
  const { name } = useParams();
  const [hashtag, setHashtag] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHashtag();
  }, [name]);

  const fetchHashtag = async () => {
    try {
      const res = await API.get(`/hashtags/hashtags/${name}`);
      setHashtag(res.data.hashtag);
      setPosts(res.data.posts);
    } catch (err) {
      console.error('Failed to fetch hashtag');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-40 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blue-600">#{name}</h1>
        {hashtag && (
          <p className="text-gray-500 mt-1">{hashtag.postCount} posts</p>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-4">#</p>
          <p>No posts with this hashtag yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}
    </div>
    </Layout>
  );
};

export default HashtagPage;
