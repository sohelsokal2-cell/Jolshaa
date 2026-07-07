import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDataSaver } from '../context/DataSaverContext';
import API from '../api/axios';

const ShortsPlayer = ({ post, isActive, onLike, onComment }) => {
  const { dataSaver, addSavedMB } = useDataSaver();
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const lastTapRef = useRef(0);
  const hideControlsTimerRef = useRef(null);
  const savingsCountedRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [heartPos, setHeartPos] = useState({ x: 0, y: 0 });
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [sourceLoaded, setSourceLoaded] = useState(false);
  const isLikedRef = useRef(false);

  const video = post.video || {};
  const author = post.author || {};
  const posterUrl = video.thumbnailUrl || '';

  useEffect(() => {
    if (post.reactions) {
      const liked = !!post.reactions.myReaction;
      setIsLiked(liked);
      isLikedRef.current = liked;
      setLikeCount(post.reactions.count || 0);
    }
    setCommentCount(post.commentCount || 0);
  }, [post.reactions, post.commentCount]);

  // Auto-play/pause based on isActive
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    if (isActive) {
      // Lazy-load: set src only when first active
      if (!sourceLoaded && video.url) {
        vid.src = video.url;
        vid.load();
        setSourceLoaded(true);
      }
      vid.muted = false;
      // Data saver: don't autoplay when enabled
      if (!dataSaver) {
        vid.play().catch(() => {});
      } else {
        vid.pause();
        if (!savingsCountedRef.current) {
          savingsCountedRef.current = true;
          addSavedMB(2.5);
        }
      }
    } else {
      vid.pause();
      vid.currentTime = 0;
    }
  }, [isActive, dataSaver, sourceLoaded, video.url, addSavedMB]);

  // Video event listeners
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onLoadedMetadata = () => {
      setDuration(vid.duration);
      setIsBuffering(false);
    };
    const onWaiting = () => setIsBuffering(true);
    const onCanPlay = () => setIsBuffering(false);
    const onTimeUpdate = () => setCurrentTime(vid.currentTime);
    const onEnded = () => {
      vid.currentTime = 0;
      vid.play().catch(() => {});
    };

    vid.addEventListener('play', onPlay);
    vid.addEventListener('pause', onPause);
    vid.addEventListener('loadedmetadata', onLoadedMetadata);
    vid.addEventListener('waiting', onWaiting);
    vid.addEventListener('canplay', onCanPlay);
    vid.addEventListener('timeupdate', onTimeUpdate);
    vid.addEventListener('ended', onEnded);

    return () => {
      vid.removeEventListener('play', onPlay);
      vid.removeEventListener('pause', onPause);
      vid.removeEventListener('loadedmetadata', onLoadedMetadata);
      vid.removeEventListener('waiting', onWaiting);
      vid.removeEventListener('canplay', onCanPlay);
      vid.removeEventListener('timeupdate', onTimeUpdate);
      vid.removeEventListener('ended', onEnded);
    };
  }, []);

  // View tracking
  useEffect(() => {
    if (!isActive || !post._id) return;
    const vid = videoRef.current;
    if (!vid) return;

    let trackingInterval;
    const trackView = async (secs, pct) => {
      try {
        await API.post(`/videos/${post._id}/track-view`, {
          watchedSeconds: Math.floor(secs),
          watchedPercentage: Math.round(pct),
          device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        });
      } catch (e) { /* ignore */ }
    };

    trackingInterval = setInterval(() => {
      if (!vid.paused && vid.currentTime > 0) {
        const pct = duration > 0 ? (vid.currentTime / duration) * 100 : 0;
        trackView(vid.currentTime, pct);
      }
    }, 5000);

    return () => clearInterval(trackingInterval);
  }, [isActive, post._id, duration]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  }, []);

  // Like handler
  const handleLike = useCallback(async () => {
    try {
      const res = await API.post(`/posts/${post._id}/react`, { type: 'like' });
      if (res.data.myReaction) {
        isLikedRef.current = true;
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      } else {
        isLikedRef.current = false;
        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      }
      if (onLike) onLike(post._id);
    } catch (e) { /* ignore */ }
  }, [post._id, onLike]);

  // Double-tap to like
  const handleTap = useCallback((e) => {
    const now = Date.now();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (now - lastTapRef.current < 300) {
      // Double tap = like
      setHeartPos({ x, y });
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
      if (!isLikedRef.current) {
        handleLike();
      }
    } else {
      togglePlay();
    }
    lastTapRef.current = now;
  }, [togglePlay, handleLike]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = !vid.muted;
    setIsMuted(vid.muted);
  }, []);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    try {
      const res = await API.get(`/posts/${post._id}/comments`);
      setComments(res.data.comments || []);
    } catch (e) { /* ignore */ }
  }, [post._id]);

  // Submit comment
  const handleCommentSubmit = useCallback(async () => {
    if (!commentText.trim()) return;
    try {
      const res = await API.post(`/posts/${post._id}/comments`, { text: commentText.trim() });
      setComments(prev => [...prev, res.data.comment || res.data]);
      setCommentCount(prev => prev + 1);
      setCommentText('');
    } catch (e) { /* ignore */ }
  }, [post._id, commentText]);

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {/* Video — lazy-load: no src until first active */}
      <video
        ref={videoRef}
        poster={posterUrl}
        loop
        playsInline
        muted={isMuted}
        preload="none"
        className="w-full h-full object-contain"
        onClick={handleTap}
      />

      {/* Buffering spinner */}
      {isBuffering && isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Heart animation on double-tap */}
      {showHeart && (
        <div
          className="absolute pointer-events-none z-30"
          style={{ left: heartPos.x - 40, top: heartPos.y - 40 }}
        >
          <svg
            className="w-20 h-20 text-red-500 animate-bounce"
            fill="currentColor"
            viewBox="0 0 24 24"
            style={{ animationDuration: '0.6s' }}
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
      )}

      {/* Progress bar at top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/20 z-20">
        <div
          className="h-full bg-white transition-all duration-200"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Right side action buttons */}
      <div className="absolute right-3 bottom-24 lg:bottom-8 flex flex-col items-center gap-5 z-20">
        {/* Creator avatar */}
        <Link to={`/profile/${author._id}`} className="relative mb-2">
          <img
            src={author.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'}
            alt={author.name}
            className="w-11 h-11 rounded-full object-cover border-2 border-white"
          />
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-black">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </Link>

        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center gap-0.5">
          <span className="text-2xl">{isLiked ? '❤️' : '🤍'}</span>
          <span className="text-white text-xs font-medium">{likeCount}</span>
        </button>

        {/* Comment */}
        <button
          onClick={() => {
            setShowComments(true);
            fetchComments();
          }}
          className="flex flex-col items-center gap-0.5"
        >
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-white text-xs font-medium">{commentCount}</span>
        </button>

        {/* Share */}
        <button className="flex flex-col items-center gap-0.5">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span className="text-white text-xs font-medium">Share</span>
        </button>

        {/* Mute toggle */}
        <button onClick={toggleMute} className="mt-2">
          {isMuted ? (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
      </div>

      {/* Bottom overlay — creator info + caption */}
      <div className="absolute bottom-20 lg:bottom-4 left-4 right-20 text-white z-20">
        <Link to={`/profile/${author._id}`} className="font-bold text-sm hover:underline">
          {author.name}
        </Link>
        {post.text && (
          <p className="text-sm mt-1 line-clamp-2">{post.text}</p>
        )}
        {video.audioTrack && (
          <p className="text-xs text-white/70 mt-1.5">🎵 {video.audioTrack}</p>
        )}
      </div>

      {/* Comment drawer */}
      {showComments && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowComments(false)} />
          <div className="relative bg-jolshaa-surface-container-lowest rounded-t-2xl max-h-[60vh] flex flex-col">
            <div className="p-3 border-b border-jolshaa-outline-variant/50 flex items-center justify-between">
              <span className="font-semibold text-sm text-jolshaa-on-surface">
                {commentCount} Comments
              </span>
              <button onClick={() => setShowComments(false)} className="p-1">
                <svg className="w-5 h-5 text-jolshaa-on-surface-variant/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {comments.length === 0 ? (
                <p className="text-center text-jolshaa-on-surface-variant/60 text-sm py-4">No comments yet</p>
              ) : (
                comments.map((c, i) => (
                  <div key={c._id || i} className="flex gap-2">
                    <img
                      src={c.author?.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                    <div>
                      <span className="text-xs font-semibold text-jolshaa-on-surface">
                        {c.author?.name || 'User'}
                      </span>
                      <p className="text-sm text-jolshaa-on-surface-variant">{c.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t border-jolshaa-outline-variant/50 flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()}
                placeholder="Add a comment..."
                className="flex-1 bg-jolshaa-surface-container rounded-full px-4 py-2 text-sm text-jolshaa-on-surface placeholder-jolshaa-on-surface-variant/60 focus:outline-none"
              />
              <button
                onClick={handleCommentSubmit}
                disabled={!commentText.trim()}
                className="text-blue-500 font-semibold text-sm disabled:opacity-40"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShortsPlayer;
