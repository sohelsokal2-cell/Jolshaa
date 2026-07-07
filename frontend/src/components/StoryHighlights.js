import { useState, useEffect } from 'react';
import API from '../api/axios';
import CreateHighlightModal from './CreateHighlightModal';

const StoryHighlights = ({ userId, isOwnProfile }) => {
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerHighlight, setViewerHighlight] = useState(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchHighlights();
  }, [userId]);

  const fetchHighlights = async () => {
    try {
      const res = await API.get(`/story-archives/highlights/${userId}`);
      setHighlights(res.data.highlights);
    } catch (err) {
      console.error('Failed to fetch highlights');
    } finally {
      setLoading(false);
    }
  };

  const openViewer = (highlight) => {
    if (!highlight.stories || highlight.stories.length === 0) return;
    setViewerHighlight(highlight);
    setStoryIndex(0);
  };

  const closeViewer = () => {
    setViewerHighlight(null);
    setStoryIndex(0);
  };

  const nextStory = () => {
    if (!viewerHighlight) return;
    if (storyIndex < viewerHighlight.stories.length - 1) {
      setStoryIndex((i) => i + 1);
    } else {
      closeViewer();
    }
  };

  const prevStory = () => {
    if (storyIndex > 0) setStoryIndex((i) => i - 1);
  };

  if (loading || (highlights.length === 0 && !isOwnProfile)) return null;

  const currentStory = viewerHighlight?.stories?.[storyIndex];

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
      <h3 className="font-display font-semibold text-jolshaa-on-surface mb-3 text-sm">Story Highlights</h3>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {highlights.map((highlight) => (
          <button
            key={highlight._id}
            onClick={() => openViewer(highlight)}
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-purple-400 p-0.5">
              {highlight.coverImage ? (
                <img
                  src={highlight.coverImage}
                  alt={highlight.title}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-jolshaa-surface-container flex items-center justify-center text-lg">
                  ✨
                </div>
              )}
            </div>
            <span className="text-xs text-jolshaa-on-surface-variant font-medium text-center w-20 truncate">
              {highlight.title}
            </span>
          </button>
        ))}
        {isOwnProfile && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-jolshaa-outline-variant flex items-center justify-center text-2xl text-jolshaa-on-surface-variant">
              +
            </div>
            <span className="text-xs text-jolshaa-on-surface-variant font-medium text-center w-20 truncate">
              New
            </span>
          </button>
        )}
      </div>

      {viewerHighlight && currentStory && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center" onClick={closeViewer}>
          <div className="absolute top-0 left-0 right-0 flex gap-1 p-2">
            {viewerHighlight.stories.map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded bg-white/30 overflow-hidden">
                <div className={`h-full bg-white ${i <= storyIndex ? 'w-full' : 'w-0'}`} />
              </div>
            ))}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); closeViewer(); }}
            className="absolute top-4 right-4 text-white text-2xl"
          >
            ×
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); prevStory(); }}
            className="absolute left-0 top-0 bottom-0 w-1/3"
          />
          <button
            onClick={(e) => { e.stopPropagation(); nextStory(); }}
            className="absolute right-0 top-0 bottom-0 w-1/3"
          />
          <div className="max-w-md w-full max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {currentStory.mediaType === 'video' ? (
              <video src={currentStory.media} className="max-h-[90vh] w-full object-contain" autoPlay controls={false} onEnded={nextStory} />
            ) : (
              <img src={currentStory.media} alt="" className="max-h-[90vh] w-full object-contain" />
            )}
          </div>
        </div>
      )}

      {showCreate && (
        <CreateHighlightModal
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            fetchHighlights();
          }}
        />
      )}
    </div>
  );
};

export default StoryHighlights;
