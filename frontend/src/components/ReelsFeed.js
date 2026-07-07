import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ReelCommentsDrawer from './ReelCommentsDrawer';

const ReelsFeed = () => {
  const { user } = useAuth();
  const { id: focusedReelId } = useParams();
  const navigate = useNavigate();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentReel, setCurrentReel] = useState(0);
  const [commentsReelId, setCommentsReelId] = useState(null);
  const containerRef = useRef(null);
  const reelRefs = useRef({});

  useEffect(() => {
    fetchReels();
  }, [page]);

  useEffect(() => {
    if (!focusedReelId || reels.length === 0) return;
    const index = reels.findIndex((r) => r._id === focusedReelId);
    if (index !== -1) {
      setCurrentReel(index);
      reelRefs.current[focusedReelId]?.scrollIntoView({ block: 'start' });
      setCommentsReelId(focusedReelId);
    }
  }, [focusedReelId, reels]);

  const fetchReels = async () => {
    try {
      setError(false);
      const res = await API.get(`/reels/feed?page=${page}`);
      if (page === 1) {
        setReels(res.data.reels);
      } else {
        setReels((prev) => [...prev, ...res.data.reels]);
      }
      setHasMore(page < res.data.totalPages);
    } catch (err) {
      console.error('Failed to fetch reels');
      setError(true);
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-white gap-4">
        <p className="text-xl">Failed to load reels</p>
        <button
          onClick={() => { setLoading(true); setPage(1); fetchReels(); }}
          className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!loading && reels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-white gap-4">
        <span className="text-5xl">🎬</span>
        <p className="text-xl font-semibold">No Reels Yet</p>
        <p className="text-jolshaa-on-surface-variant/60">Be the first to create a reel!</p>
        <Link
          to="/reels/create"
          className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Create Reel
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-[calc(100dvh-56px)] lg:h-[calc(100vh-56px)] overflow-y-scroll snap-y snap-mandatory"
    >
      {reels.map((reel, index) => {
        const isNearActive = Math.abs(index - currentReel) <= 1;
        return (
        <div
          key={reel._id}
          ref={(el) => { reelRefs.current[reel._id] = el; }}
          className="h-[calc(100dvh-56px)] lg:h-[calc(100vh-56px)] snap-start flex items-center justify-center bg-black relative"
        >
          <div className="relative w-full max-w-md h-full">
            <video
              src={isNearActive ? reel.video : undefined}
              poster={reel.thumbnail || undefined}
              className="w-full h-full object-contain"
              autoPlay={index === currentReel}
              muted
              loop
              playsInline
              preload={isNearActive ? 'auto' : 'none'}
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
                <p className="text-xs text-jolshaa-outline-variant">🎵 {reel.music}</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="absolute bottom-20 lg:bottom-4 right-4 flex flex-col items-center gap-5">
              <button onClick={() => toggleLike(reel._id)} className="flex flex-col items-center">
                <span className="text-2xl">{reel.isLiked ? '❤️' : '🤍'}</span>
                <span className="text-white text-xs">{reel.likeCount}</span>
              </button>
              <button
                onClick={() => { setCommentsReelId(reel._id); navigate(`/reels/${reel._id}`, { replace: true }); }}
                className="flex flex-col items-center"
              >
                <span className="text-2xl">💬</span>
                <span className="text-white text-xs">{reel.commentCount}</span>
              </button>
              <button className="flex flex-col items-center">
                <span className="text-2xl">↗️</span>
                <span className="text-white text-xs">{reel.shares}</span>
              </button>
            </div>
          </div>
        </div>
        );
      })}

      {!hasMore && reels.length > 0 && (
        <div className="h-[calc(100vh-64px)] flex items-center justify-center text-white">
          <p>You've reached the end! 🎬</p>
        </div>
      )}

      {commentsReelId && (
        <ReelCommentsDrawer
          reelId={commentsReelId}
          onCommentAdded={() =>
            setReels((prev) =>
              prev.map((r) => (r._id === commentsReelId ? { ...r, commentCount: r.commentCount + 1 } : r))
            )
          }
          onClose={() => { setCommentsReelId(null); navigate('/reels', { replace: true }); }}
        />
      )}
    </div>
  );
};

export default ReelsFeed;
