import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const ReelsTabContent = ({ userId, isOwnProfile }) => {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReels();
  }, [userId]);

  const fetchReels = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get(`/users/${userId}/reels`);
      setReels(res.data.reels || []);
    } catch (err) {
      console.error('Failed to fetch reels');
      setError('Failed to load reels.');
    } finally {
      setLoading(false);
    }
  };

  const formatViews = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count?.toString() || '0';
  };

  const handleReelClick = (reel) => {
    navigate('/shorts', { state: { initialPostId: reel._id } });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-[9/16] rounded-xl bg-jolshaa-surface-container animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-jolshaa-on-surface-variant mb-3">{error}</p>
        <button
          onClick={fetchReels}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-jolshaa-surface-container-low text-jolshaa-on-surface hover:bg-jolshaa-surface-container transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-jolshaa-surface-container rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-8 h-8 text-jolshaa-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-sm text-jolshaa-on-surface-variant">
          {isOwnProfile ? "You haven't posted any reels yet" : "No reels yet"}
        </p>
        {isOwnProfile && (
          <button
            onClick={() => navigate('/create')}
            className="mt-3 px-4 py-2 rounded-lg text-sm font-medium bg-jolshaa-teal text-jolshaa-on-teal hover:bg-jolshaa-teal-container transition-colors"
          >
            Create Reel
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {reels.map((reel) => (
        <button
          key={reel._id}
          onClick={() => handleReelClick(reel)}
          className="relative aspect-[9/16] rounded-xl overflow-hidden bg-jolshaa-surface-container group"
        >
          {reel.mediaUrl ? (
            <video
              src={reel.mediaUrl}
              className="w-full h-full object-cover"
              muted
              preload="metadata"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-jolshaa-surface-container">
              <svg className="w-12 h-12 text-jolshaa-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {/* Play icon overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
              <svg className="w-6 h-6 text-jolshaa-on-surface ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          {/* View count */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 rounded-full px-2 py-1">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
            </svg>
            <span className="text-xs text-white font-medium">{formatViews(reel.viewCount)}</span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ReelsTabContent;
