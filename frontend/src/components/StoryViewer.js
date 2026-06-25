import { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';

const StoryViewer = ({ feed, initialIndex, onClose, onStoryViewed }) => {
  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const currentGroup = feed[currentGroupIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];

  const goToNext = useCallback(() => {
    if (!currentGroup) return;

    if (currentStoryIndex < currentGroup.stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
      setProgress(0);
    } else if (currentGroupIndex < feed.length - 1) {
      setCurrentGroupIndex((prev) => prev + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentGroupIndex, currentStoryIndex, currentGroup, feed.length, onClose]);

  const goToPrev = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
      setProgress(0);
    } else if (currentGroupIndex > 0) {
      setCurrentGroupIndex((prev) => prev - 1);
      const prevGroup = feed[currentGroupIndex - 1];
      setCurrentStoryIndex(prevGroup.stories.length - 1);
      setProgress(0);
    }
  }, [currentGroupIndex, currentStoryIndex, feed]);

  // Mark story as viewed
  useEffect(() => {
    if (currentStory && !currentStory.hasViewed) {
      API.put(`/stories/${currentStory._id}/view`).catch(() => {});
      onStoryViewed(currentStory._id, currentGroup.author._id);
    }
  }, [currentStory, currentGroup, onStoryViewed]);

  // Auto-advance timer
  useEffect(() => {
    if (!currentStory) return;

    const duration = currentStory.mediaType === 'video' ? 10000 : 5000;
    const interval = 50;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      setProgress((elapsed / duration) * 100);
      if (elapsed >= duration) {
        clearInterval(timer);
        goToNext();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [currentStory, goToNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, onClose]);

  if (!currentGroup || !currentStory) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-3xl z-50 hover:text-gray-300"
      >
        &times;
      </button>

      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-50">
        {currentGroup.stories.map((story, idx) => (
          <div key={story._id} className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-100"
              style={{
                width:
                  idx < currentStoryIndex
                    ? '100%'
                    : idx === currentStoryIndex
                    ? `${progress}%`
                    : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Author info */}
      <div className="absolute top-6 left-4 flex items-center gap-3 z-50">
        <img
          src={currentGroup.author.profilePhoto || 'https://res.cloudinary.com/demo/image/upload/v1556418119/default-avatar.png'}
          alt={currentGroup.author.name}
          className="w-10 h-10 rounded-full object-cover border-2 border-white"
        />
        <div>
          <p className="text-white font-semibold text-sm">{currentGroup.author.name}</p>
          <p className="text-gray-400 text-xs">
            {new Date(currentStory.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        {currentStory.viewCount > 0 && (
          <span className="text-gray-400 text-xs ml-2">
            {currentStory.viewCount} view{currentStory.viewCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Navigation areas */}
      <button
        onClick={goToPrev}
        className="absolute left-0 top-0 bottom-0 w-1/3 z-40 cursor-pointer"
        aria-label="Previous story"
      />
      <button
        onClick={goToNext}
        className="absolute right-0 top-0 bottom-0 w-2/3 z-40 cursor-pointer"
        aria-label="Next story"
      />

      {/* Story media */}
      <div className="max-w-lg w-full h-full flex items-center justify-center p-4">
        {currentStory.mediaType === 'video' ? (
          <video
            src={currentStory.media}
            className="max-h-full max-w-full object-contain rounded-lg"
            autoPlay
            muted
            playsInline
          />
        ) : (
          <img
            src={currentStory.media}
            alt="Story"
            className="max-h-full max-w-full object-contain rounded-lg"
          />
        )}
      </div>
    </div>
  );
};

export default StoryViewer;
