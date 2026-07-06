import { useState, useRef } from 'react';
import VideoPlayer from './VideoPlayer';

const MediaCarousel = ({ media, postVideo, postId }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  if (!media || media.length === 0) return null;

  const isVideo = (item) => {
    const url = typeof item === 'string' ? item : item.url;
    return item?.type === 'video' || url?.endsWith('.mp4') || url?.endsWith('.webm') || url?.endsWith('.mov');
  };

  const getAltText = (item) => {
    if (typeof item === 'object' && item.altText) return item.altText;
    return '';
  };

  const getCaption = (item) => {
    if (typeof item === 'object' && item.caption) return item.caption;
    return '';
  };

  const getUrl = (item) => {
    return typeof item === 'string' ? item : item.url;
  };

  const getThumbnail = (item) => {
    if (typeof item === 'object' && item.thumbnailUrl) return item.thumbnailUrl;
    return postVideo?.thumbnailUrl || '';
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50 && currentIndex < media.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (diff < -50 && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (media.length === 1) {
    const item = media[0];
    return (
      <div className="relative">
        {isVideo(item) ? (
          <VideoPlayer
            src={getUrl(item)}
            poster={getThumbnail(item)}
            thumbnail={getThumbnail(item)}
            autoplay
            postId={postId}
            qualities={postVideo?.qualities || []}
            className="w-full max-h-[500px]"
          />
        ) : (
          <img
            src={getUrl(item)}
            alt={getAltText(item) || 'Post image'}
            className="w-full object-cover max-h-[500px]"
          />
        )}
        {getCaption(item) && (
          <p className="px-4 py-2 text-sm text-jolshaa-on-surface-variant">{getCaption(item)}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label={`Photo carousel, image ${currentIndex + 1} of ${media.length}`}
    >
      <div
        className="flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {media.map((item, i) => (
          <div key={i} className="w-full flex-shrink-0 relative">
            {isVideo(item) ? (
              <VideoPlayer
                src={getUrl(item)}
                poster={getThumbnail(item)}
                thumbnail={getThumbnail(item)}
                autoplay={i === currentIndex}
                postId={postId}
                qualities={postVideo?.qualities || []}
                className="w-full max-h-[500px]"
              />
            ) : (
              <img
                src={getUrl(item)}
                alt={getAltText(item) || `Photo ${i + 1}`}
                className="w-full object-cover max-h-[500px]"
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            )}
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      {currentIndex > 0 && (
        <button
          onClick={() => setCurrentIndex(prev => prev - 1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
          aria-label="Previous photo"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      {currentIndex < media.length - 1 && (
        <button
          onClick={() => setCurrentIndex(prev => prev + 1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
          aria-label="Next photo"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Dots indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5" role="tablist" aria-label="Carousel navigation">
        {media.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentIndex ? 'bg-white scale-110' : 'bg-white/50'
            }`}
            role="tab"
            aria-selected={i === currentIndex}
            aria-label={`Go to photo ${i + 1}`}
          />
        ))}
      </div>

      {/* Photo counter */}
      <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full" aria-live="polite">
        {currentIndex + 1}/{media.length}
      </div>
    </div>
  );
};

export default MediaCarousel;
