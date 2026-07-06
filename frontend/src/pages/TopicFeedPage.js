import { useState, useEffect } from 'react';
import API from '../api/axios';
import PostCard from '../components/PostCard';
import Layout from '../components/layout/Layout';

const TopicFeedPage = () => {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopics();
  }, []);

  useEffect(() => {
    if (selectedTopic) fetchTopicPosts();
  }, [selectedTopic]);

  const fetchTopics = async () => {
    try {
      const res = await API.get('/topics');
      setTopics(res.data.topics);
      if (res.data.topics.length > 0) {
        setSelectedTopic(res.data.topics[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch topics');
    }
  };

  const fetchTopicPosts = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/topics/${selectedTopic}`);
      setPosts(res.data.posts);
    } catch (err) {
      console.error('Failed to fetch topic posts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4">
      <h1 className="font-display text-2xl font-bold mb-4 text-jolshaa-on-surface">Topic Feeds</h1>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
        {topics.map(topic => (
          <button
            key={topic.id}
            onClick={() => setSelectedTopic(topic.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              selectedTopic === topic.id
                ? 'bg-jolshaa-teal text-jolshaa-on-teal'
                : 'bg-jolshaa-surface-container-lowest text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container-low'
            }`}
          >
            {topic.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-jolshaa-surface-container-lowest rounded-2xl shadow-ambient p-4 animate-pulse">
              <div className="h-4 bg-jolshaa-surface-container rounded w-1/3 mb-3" />
              <div className="h-20 bg-jolshaa-surface-container rounded" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-jolshaa-on-surface-variant">
          <p className="text-4xl mb-4">📰</p>
          <p>No posts in this topic yet</p>
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

export default TopicFeedPage;
