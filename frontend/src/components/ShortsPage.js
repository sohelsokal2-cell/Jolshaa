import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ShortsPlayer from './ShortsPlayer';

const ShortsPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef(null);
  const seenIdsRef = useRef([]);

  useEffect(() => {
    fetchShorts();
  }, [page]);

  const fetchShorts = async () => {
    try {
      setError('');
      const seenParam = seenIdsRef.current.length > 0
        ? `&seen=${seenIdsRef.current.join(',')}`
        : '';
      const res = await API.get(`/videos/shorts-feed?page=${page}&limit=10${seenParam}`);

      const newPosts = res.data.posts || [];
      if (page === 1) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }

      // Track seen IDs
      newPosts.forEach(p => seenIdsRef.current.push(p._id));

      setHasMore(res.data.hasMore && newPosts.length > 0);
    } catch (err) {
      console.error('Failed to fetch shorts');
      setError('Failed to load shorts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Scroll detection for snap
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const itemHeight = clientHeight;
    const newIndex = Math.round(scrollTop / itemHeight);

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < posts.length) {
      setCurrentIndex(newIndex);
    }

    // Load more when near the end
    if (scrollHeight - scrollTop - clientHeight < itemHeight * 2 && hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  }, [currentIndex, posts.length, hasMore, loading]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        scrollToIndex(Math.min(currentIndex + 1, posts.length - 1));
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        scrollToIndex(Math.max(currentIndex - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex, posts.length]);

  const scrollToIndex = (index) => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({
      top: index * container.clientHeight,
      behavior: 'smooth',
    });
  };

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/60 text-sm">Loading shorts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
        <p className="text-lg">{error}</p>
        <button
          onClick={() => { setLoading(true); setPage(1); seenIdsRef.current = []; }}
          className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
        <span className="text-5xl">🎬</span>
        <p className="text-xl font-semibold">No Shorts Yet</p>
        <p className="text-white/50 text-sm">Be the first to post a short video!</p>
        <Link
          to="/feed"
          className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 text-sm"
        >
          Go to Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-white font-bold text-lg pointer-events-auto">Shorts</h1>
          <div className="flex items-center gap-3">
            {/* Navigation dots */}
            <div className="flex gap-1 pointer-events-auto">
              {posts.slice(
                Math.max(0, currentIndex - 3),
                Math.min(posts.length, currentIndex + 4)
              ).map((_, i) => {
                const actualIndex = Math.max(0, currentIndex - 3) + i;
                return (
                  <button
                    key={actualIndex}
                    onClick={() => scrollToIndex(actualIndex)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      actualIndex === currentIndex ? 'bg-white w-4' : 'bg-white/40'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Shorts container */}
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {posts.map((post, index) => (
          <div
            key={post._id}
            className="h-full snap-start"
            style={{ scrollSnapAlign: 'start' }}
          >
            <ShortsPlayer
              post={post}
              isActive={index === currentIndex}
            />
          </div>
        ))}

        {/* End of feed */}
        {!hasMore && posts.length > 0 && (
          <div className="h-full snap-start bg-black flex items-center justify-center">
            <div className="text-center">
              <span className="text-4xl mb-3 block">🎉</span>
              <p className="text-white font-medium">You've seen all shorts!</p>
              <p className="text-white/50 text-sm mt-1">Check back later for more</p>
            </div>
          </div>
        )}
      </div>

      {/* Scroll hint (only on first video) */}
      {currentIndex === 0 && posts.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 animate-bounce">
          <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default ShortsPage;
