import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Avatar from './ui/Avatar';
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

  const handleStoryCreated = (newStory) => {
    setMyStories((prev) => [newStory, ...prev]);
    setCreateOpen(false);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-card p-4 mb-4">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-shrink-0 text-center">
              <div className="w-16 h-16 rounded-full skeleton" />
              <div className="w-10 h-2.5 skeleton mt-1.5 mx-auto rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-card p-4 mb-4">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
          {/* Your Story */}
          <button
            onClick={() => setCreateOpen(true)}
            className="flex-shrink-0 text-center group"
          >
            <div className="relative w-16 h-16">
              <Avatar src={user.profilePhoto} alt={user.name} size="lg" className="ring-2 ring-neutral-200 dark:ring-neutral-600 group-hover:ring-primary-500 transition-all" />
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-primary-600 rounded-full border-2 border-white dark:border-neutral-800 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              </div>
            </div>
            <span className="text-2xs text-neutral-600 dark:text-neutral-400 mt-1 block truncate w-16">
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
                    ? 'bg-gradient-to-br from-primary-500 to-accent-500'
                    : 'bg-neutral-300 dark:bg-neutral-600'
                }`}
              >
                <img
                  src={group.author.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'}
                  alt={group.author.name}
                  className="w-full h-full rounded-full object-cover border-2 border-white dark:border-neutral-800"
                />
              </div>
              <span className="text-2xs text-neutral-600 dark:text-neutral-400 mt-1 block truncate w-16">
                {group.author.name?.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {viewerOpen && (
        <StoryViewer
          stories={feed}
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
