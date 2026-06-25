import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import StoryViewer from './StoryViewer';
import CreateStory from './CreateStory';

const StoriesBar = () => {
  const { user } = useAuth();
  const [myStories, setMyStories] = useState([]);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const res = await API.get('/stories/feed');
      setMyStories(res.data.myStories);
      setFeed(res.data.feed);
    } catch (err) {
      console.error('Failed to fetch stories');
    } finally {
      setLoading(false);
    }
  };

  const handleStoryClick = (index) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const handleCreateStory = () => {
    setCreateOpen(true);
  };

  const handleStoryCreated = (newStory) => {
    setMyStories((prev) => [newStory, ...prev]);
    setCreateOpen(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex gap-4 overflow-x-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse" />
              <div className="w-12 h-3 bg-gray-200 rounded mt-1 mx-auto animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex gap-4 overflow-x-auto pb-2">
          {/* Your Story */}
          <button
            onClick={handleCreateStory}
            className="flex-shrink-0 text-center group"
          >
            <div className="relative w-16 h-16">
              <img
                src={user.profilePhoto || 'https://res.cloudinary.com/demo/image/upload/v1556418119/default-avatar.png'}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 group-hover:border-blue-500 transition-colors"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-white text-lg font-bold leading-none">+</span>
              </div>
            </div>
            <span className="text-xs text-gray-600 mt-1 block truncate w-16">
              Your Story
            </span>
          </button>

          {/* Other users' stories */}
          {feed.map((group, index) => (
            <button
              key={group.author._id}
              onClick={() => handleStoryClick(index)}
              className="flex-shrink-0 text-center"
            >
              <div
                className={`w-16 h-16 rounded-full p-0.5 ${
                  group.stories.some((s) => !s.hasViewed)
                    ? 'bg-gradient-to-br from-blue-500 to-purple-500'
                    : 'bg-gray-300'
                }`}
              >
                <img
                  src={group.author.profilePhoto || 'https://res.cloudinary.com/demo/image/upload/v1556418119/default-avatar.png'}
                  alt={group.author.name}
                  className="w-full h-full rounded-full object-cover border-2 border-white"
                />
              </div>
              <span className="text-xs text-gray-600 mt-1 block truncate w-16">
                {group.author.name?.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {viewerOpen && (
        <StoryViewer
          feed={feed}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
          onStoryViewed={(storyId, authorId) => {
            setFeed((prev) =>
              prev.map((g) => {
                if (g.author._id === authorId) {
                  return {
                    ...g,
                    stories: g.stories.map((s) =>
                      s._id === storyId ? { ...s, hasViewed: true } : s
                    ),
                  };
                }
                return g;
              })
            );
          }}
        />
      )}

      {createOpen && (
        <CreateStory
          onClose={() => setCreateOpen(false)}
          onStoryCreated={handleStoryCreated}
        />
      )}
    </>
  );
};

export default StoriesBar;
