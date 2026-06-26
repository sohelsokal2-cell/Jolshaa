import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ReelsFeed = () => {
  const { user } = useAuth();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentReel, setCurrentReel] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchReels();
  }, [page]);

  const fetchReels = async () => {
    try {
      const res = await API.get(`/reels/feed?page=${page}`);
      if (page === 1) {
        setReels(res.data.reels);
      } else {
        setReels((prev) => [...prev, ...res.data.reels]);
      }
      setHasMore(page < res.data.totalPages);
    } catch (err) {
      console.error('Failed to fetch reels');
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const reelHeight = clientHeight;

    const newIndex = Math.round(scrollTop / reelHeight);
    if (newIndex !== currentReel) {
      setCurrentReel(newIndex);
    }

    if (scrollHeight - scrollTop - clientHeight < 200 && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  const toggleLike = async (reelId) => {
    try {
      const res = await API.put(`/reels/${reelId}/like`);
      setReels((prev) =>
        prev.map((r) =>
          r._id === reelId
            ? { ...r, isLiked: res.data.isLiked, likeCount: res.data.likeCount }
            : r
        )
      );
    } catch (err) {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-[calc(100vh-64px)] overflow-y-scroll snap-y snap-mandatory"
    >
      {reels.map((reel, index) => (
        <div
          key={reel._id}
          className="h-[calc(100vh-64px)] snap-start flex items-center justify-center bg-black relative"
        >
          <div className="relative w-full max-w-md h-full">
            <video
              src={reel.video}
              className="w-full h-full object-contain"
              autoPlay={index === currentReel}
              muted
              loop
              playsInline
            />

            {/* Reel info */}
            <div className="absolute bottom-4 left-4 right-16 text-white">
              <div className="flex items-center gap-2 mb-2">
                <img
                  src={reel.author.profilePhoto}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span className="font-semibold text-sm">{reel.author.name}</span>
                <Link
                  to={`/profile/${reel.author._id}`}
                  className="text-xs border border-white px-2 py-0.5 rounded"
                >
                  Follow
                </Link>
              </div>
              <p className="text-sm mb-2">{reel.caption}</p>
              {reel.music && (
                <p className="text-xs text-gray-300">🎵 {reel.music}</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="absolute bottom-4 right-4 flex flex-col items-center gap-5">
              <button onClick={() => toggleLike(reel._id)} className="flex flex-col items-center">
                <span className="text-2xl">{reel.isLiked ? '❤️' : '🤍'}</span>
                <span className="text-white text-xs">{reel.likeCount}</span>
              </button>
              <Link to={`/reels/${reel._id}`} className="flex flex-col items-center">
                <span className="text-2xl">💬</span>
                <span className="text-white text-xs">{reel.commentCount}</span>
              </Link>
              <button className="flex flex-col items-center">
                <span className="text-2xl">↗️</span>
                <span className="text-white text-xs">{reel.shares}</span>
              </button>
            </div>
          </div>
        </div>
      ))}

      {!hasMore && reels.length > 0 && (
        <div className="h-[calc(100vh-64px)] flex items-center justify-center text-white">
          <p>You've reached the end! 🎬</p>
        </div>
      )}
    </div>
  );
};

export default ReelsFeed;
