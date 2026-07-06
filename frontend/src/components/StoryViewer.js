import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const StoryViewer = ({ stories, initialIndex, onClose, onStoryViewed }) => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [showReply, setShowReply] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showViewers, setShowViewers] = useState(false);

  const authorStories = stories[currentIndex];
  const story = authorStories?.stories[currentStoryIndex];

  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goNext();
          return 0;
        }
        return prev + 2;
      });
    }, 100);

    if (story?._id) {
      API.put(`/stories/${story._id}/view`).catch(() => {});
    }

    return () => clearInterval(interval);
  }, [currentIndex, currentStoryIndex, story?._id]);

  const goNext = () => {
    if (currentStoryIndex < authorStories.stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
      setProgress(0);
    } else if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
      setProgress(0);
    } else if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      const prevAuthorStories = stories[currentIndex - 1];
      setCurrentStoryIndex(prevAuthorStories.stories.length - 1);
      setProgress(0);
    }
  };

  const handleReact = async (emoji) => {
    if (!story?._id) return;
    try {
      await API.post(`/stories/${story._id}/react`, { emoji });
      setShowReactions(false);
    } catch (err) {}
  };

  const handleReply = async () => {
    if (!replyText.trim() || !story?._id) return;
    try {
      await API.post(`/stories/${story._id}/reply`, { text: replyText });
      setReplyText('');
      setShowReply(false);
    } catch (err) {
      console.error('Failed to reply to story');
    }
  };

  const handleArchive = async () => {
    if (!story?._id) return;
    try {
      await API.post(`/story-archives/archive/${story._id}`);
      alert('Story archived!');
    } catch (err) {
      alert('Failed to archive story');
    }
  };

  if (!story) return null;

  return (
    <div className="fixed inset-0 bg-black z-[70] flex items-center justify-center">
      <button onClick={onClose} className="absolute top-4 right-4 text-white text-3xl z-50">&times;</button>

      <button onClick={goPrev} className="absolute left-4 text-white text-4xl z-50 hover:text-jolshaa-outline-variant">&#8249;</button>
      <button onClick={goNext} className="absolute right-12 text-white text-4xl z-50 hover:text-jolshaa-outline-variant">&#8250;</button>

      <div className="relative w-full max-w-md h-[90vh] bg-black rounded-lg overflow-hidden">
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-50">
          {authorStories.stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-jolshaa-surface-container-high rounded">
              <div
                className="h-full bg-white rounded transition-all"
                style={{
                  width: i < currentStoryIndex ? '100%' : i === currentStoryIndex ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Author info */}
        <div className="absolute top-4 left-0 right-0 flex items-center gap-2 px-4 z-50">
          <img src={authorStories.author.profilePhoto} alt="" className="w-8 h-8 rounded-full object-cover" />
          <span className="text-white text-sm font-medium">{authorStories.author.name}</span>
          <span className="text-jolshaa-on-surface-variant/60 text-xs">{new Date(story.createdAt).toLocaleTimeString()}</span>
        </div>

        {/* Story content */}
        {story.mediaType === 'video' ? (
          <video src={story.media} className="w-full h-full object-contain" autoPlay muted loop />
        ) : (
          <img src={story.media} alt="" className="w-full h-full object-contain" />
        )}

        {/* Reaction bar */}
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4 z-50">
          <div className="relative">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="text-2xl"
            >
              😊
            </button>
            {showReactions && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-jolshaa-surface-container-high rounded-full px-3 py-2 flex gap-3">
                {['❤️', '😂', '😮', '😢', '😡', '👍'].map((emoji) => (
                  <button key={emoji} onClick={() => handleReact(emoji)} className="text-xl hover:scale-125 transition-transform">
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setShowReply(!showReply)} className="text-white text-sm">Reply</button>
          {story.author?._id === user?.id && (
            <button onClick={handleArchive} className="text-white text-sm">Archive</button>
          )}
          <button onClick={() => setShowViewers(!showViewers)} className="text-white text-sm">
            {story.viewCount || 0} views
          </button>
        </div>

        {/* Reply input */}
        {showReply && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50 z-50">
            <div className="flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                placeholder="Reply to story..."
                className="flex-1 bg-transparent border border-jolshaa-outline-variant rounded-full px-4 py-2 text-white text-sm focus:outline-none"
              />
              <button onClick={handleReply} className="text-blue-400 font-medium text-sm">Send</button>
            </div>
          </div>
        )}

        {/* Viewers list */}
        {showViewers && (
          <div className="absolute bottom-0 left-0 right-0 bg-jolshaa-surface-container-high rounded-t-xl p-4 z-50 max-h-[40vh] overflow-y-auto">
            <h3 className="font-display text-white font-semibold mb-3">Viewed by {story.viewCount || 0}</h3>
            <p className="text-jolshaa-on-surface-variant/60 text-sm">Viewer list will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;
