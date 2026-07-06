import { useState, useRef, useEffect, useCallback } from 'react';
import { useDataSaver } from '../context/DataSaverContext';
import API from '../api/axios';

const VideoPlayer = ({
  src,
  poster,
  thumbnail,
  autoplay = false,
  muted: initialMuted = true,
  loop = false,
  postId,
  qualities = [],
  onPlay,
  onPause,
  className = '',
}) => {
  const { dataSaver } = useDataSaver();
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressRef = useRef(null);
  const hideControlsTimerRef = useRef(null);
  const viewTrackingRef = useRef(null);
  const lastTapRef = useRef(0);
  const adEligibilityRef = useRef(null);
  const midRollAdShownRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showPlayOverlay, setShowPlayOverlay] = useState(!autoplay);
  const [sourceLoaded, setSourceLoaded] = useState(false);
  const [showMidRollAd, setShowMidRollAd] = useState(false);
  const [adSkippable, setAdSkippable] = useState(false);
  const isPlayingRef = useRef(false);

  const posterUrl = poster || thumbnail;
  const currentAdRef = useRef(null);

  const handleSkipAd = async () => {
    setShowMidRollAd(false);
    // Track the click via ad server
    if (currentAdRef.current?.impressionId) {
      try {
        await API.post(`/ads/${currentAdRef.current.campaignId}/track-click`, {
          impressionId: currentAdRef.current.impressionId,
        });
      } catch (e) { /* ignore */ }
    }
    // Resume video
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => {});
    }
  };

  // Format time mm:ss
  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle quality selection changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !sourceLoaded) return;

    const currentTime = video.currentTime;
    const wasPlaying = !video.paused;

    if (selectedQuality === 'auto') {
      video.src = src;
    } else {
      const quality = qualities.find((q) => q.resolution === selectedQuality);
      if (quality) {
        video.src = quality.url;
      }
    }
    video.load();
    video.currentTime = currentTime;
    if (wasPlaying) video.play().catch(() => {});
  }, [selectedQuality, qualities, src, sourceLoaded]);

  // IntersectionObserver for lazy-load + auto-play/pause
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Lazy-load: set src only when visible
          if (!sourceLoaded && src) {
            video.src = src;
            video.load();
            setSourceLoaded(true);
          }
          // Data saver: don't autoplay when enabled
          if (autoplay && !dataSaver) {
            video.play().catch(() => {});
          }
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [autoplay, dataSaver, src, sourceLoaded]);

  // View tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !postId) return;

    const lastTrackedRef = { current: -1 };

    const trackView = async (watchedSecs, pct) => {
      try {
        await API.post(`/videos/${postId}/track-view`, {
          watchedSeconds: Math.floor(watchedSecs),
          watchedPercentage: Math.round(pct),
          device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        });
      } catch (e) { /* ignore */ }
    };

    const handleTimeUpdate = () => {
      const pct = duration > 0 ? (video.currentTime / duration) * 100 : 0;
      setCurrentTime(video.currentTime);

      // Track only once per 5-second interval
      const currentInterval = Math.floor(video.currentTime / 5);
      if (currentInterval > lastTrackedRef.current && video.currentTime > 0) {
        lastTrackedRef.current = currentInterval;
        trackView(video.currentTime, pct);
      }

      // Mid-roll ad: show at 50% of video (only once, only if eligible)
      if (
        duration >= 60 &&
        !midRollAdShownRef.current &&
        adEligibilityRef.current?.eligible &&
        adEligibilityRef.current?.ad &&
        pct >= 50 &&
        isPlaying
      ) {
        midRollAdShownRef.current = true;
        currentAdRef.current = adEligibilityRef.current.ad;
        video.pause();
        setShowMidRollAd(true);
        setAdSkippable(false);
        // Allow skip after 5 seconds
        setTimeout(() => setAdSkippable(true), 5000);
      }
    };

    const handleEnded = () => {
      const pct = duration > 0 ? (video.currentTime / duration) * 100 : 0;
      trackView(video.currentTime, pct);
      setIsPlaying(false);
      setShowPlayOverlay(true);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [postId, duration, isPlaying]);

  // Check ad eligibility when video loads
  useEffect(() => {
    if (!postId) return;
    API.get(`/ads/video/${postId}/serve`)
      .then(res => {
        if (res.data.eligible) {
          adEligibilityRef.current = res.data;
        } else {
          adEligibilityRef.current = { eligible: false };
        }
      })
      .catch(() => { adEligibilityRef.current = { eligible: false }; });
  }, [postId]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      isPlayingRef.current = true;
      setIsPlaying(true);
      setShowPlayOverlay(false);
      clearTimeout(hideControlsTimerRef.current);
      hideControlsTimerRef.current = setTimeout(() => {
        if (isPlayingRef.current) setShowControls(false);
      }, 3000);
      if (onPlay) onPlay();
    };
    const handlePause = () => {
      isPlayingRef.current = false;
      setIsPlaying(false);
      setShowControls(true);
      if (onPause) onPause();
    };
    const onLoadedMetadata = () => {
      setDuration(video.duration);
      setIsBuffering(false);
    };
    const onWaiting = () => setIsBuffering(true);
    const onCanPlay = () => setIsBuffering(false);
    const onVolumeChange = () => {
      setIsMuted(video.muted);
      setVolume(video.volume);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('volumechange', onVolumeChange);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('volumechange', onVolumeChange);
    };
  }, [onPlay, onPause]);

  // Auto-hide controls timer
  const startHideControlsTimer = useCallback(() => {
    clearTimeout(hideControlsTimerRef.current);
    setShowControls(true);
    hideControlsTimerRef.current = setTimeout(() => {
      if (isPlayingRef.current) setShowControls(false);
    }, 3000);
  }, []);

  // Mouse move shows controls
  const handleMouseMove = useCallback(() => {
    startHideControlsTimer();
  }, [startHideControlsTimer]);

  // Play/pause toggle
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, []);

  // Mute toggle
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  }, []);

  // Seek
  const handleSeek = useCallback((e) => {
    const video = videoRef.current;
    const bar = progressRef.current;
    if (!video || !bar) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = pct * duration;
  }, [duration]);

  // Volume
  const handleVolumeChange = useCallback((e) => {
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    video.volume = val;
    video.muted = val === 0;
  }, []);

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // Picture-in-Picture
  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiP(false);
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
        setIsPiP(true);
      }
    } catch (e) { /* ignore */ }
  }, []);

  // Double-tap to skip
  const handleDoubleTap = useCallback((e) => {
    const video = videoRef.current;
    if (!video) return;

    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x < rect.width / 2) {
        video.currentTime = Math.max(0, video.currentTime - 10);
      } else {
        video.currentTime = Math.min(duration, video.currentTime + 10);
      }
    } else {
      togglePlay();
    }
    lastTapRef.current = now;
  }, [duration, togglePlay]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'm':
          toggleMute();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (videoRef.current) videoRef.current.currentTime -= 10;
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (videoRef.current) videoRef.current.currentTime += 10;
          break;
        default:
          break;
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKey);
      return () => container.removeEventListener('keydown', handleKey);
    }
  }, [togglePlay, toggleMute, toggleFullscreen]);

  // Cleanup
  useEffect(() => {
    return () => {
      clearTimeout(hideControlsTimerRef.current);
    };
  }, []);

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`relative bg-black overflow-hidden group select-none ${className}`}
      onMouseMove={handleMouseMove}
      tabIndex={0}
    >
      {/* Video element — lazy-load: no src until visible */}
      <video
        ref={videoRef}
        poster={posterUrl}
        loop={loop}
        muted={initialMuted}
        playsInline
        preload="none"
        className="w-full h-full object-contain"
        onClick={handleDoubleTap}
      />

      {/* Buffering spinner */}
      {isBuffering && isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Play overlay (before first play) */}
      {showPlayOverlay && !isBuffering && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={togglePlay}
        >
          <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors">
            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Mid-roll ad overlay */}
      {showMidRollAd && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90">
          <div className="bg-jolshaa-surface-container-high rounded-xl p-6 max-w-sm mx-4 text-center shadow-2xl border border-jolshaa-outline-variant">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-xs font-medium text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">Sponsored</span>
            </div>
            <div className="w-full h-32 bg-gradient-to-br from-jolshaa-teal to-jolshaa-teal-dark rounded-lg mb-4 flex items-center justify-center">
              <span className="text-white text-lg font-bold">Advertisement</span>
            </div>
            <p className="text-sm text-jolshaa-on-surface-variant mb-4">Support this creator by watching the ad</p>
            <button
              onClick={handleSkipAd}
              disabled={!adSkippable}
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                adSkippable
                  ? 'bg-jolshaa-teal text-white hover:bg-jolshaa-teal-dark'
                  : 'bg-jolshaa-surface-container text-jolshaa-on-surface-variant cursor-not-allowed'
              }`}
            >
              {adSkippable ? 'Skip Ad' : 'Ad playing...'}
            </button>
          </div>
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="w-full h-1 bg-white/30 cursor-pointer group/progress hover:h-1.5 transition-all"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-blue-500 relative"
            style={{ width: `${progressPct}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button onClick={togglePlay} className="text-white hover:text-blue-400 transition-colors">
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1.5 group/vol">
              <button onClick={toggleMute} className="text-white hover:text-blue-400 transition-colors">
                {isMuted || volume === 0 ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : volume < 0.5 ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6l-4 4H4v4h4l4 4V6z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/vol:w-20 transition-all duration-200 accent-blue-500 h-1 cursor-pointer"
              />
            </div>

            {/* Time */}
            <span className="text-white text-xs font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quality selector */}
            {qualities && qualities.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowQualityMenu(!showQualityMenu)}
                  className="text-white text-xs px-2 py-1 rounded border border-white/30 hover:bg-white/10 transition-colors"
                >
                  {selectedQuality === 'auto' ? 'Auto' : selectedQuality}
                </button>
                {showQualityMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowQualityMenu(false)} />
                    <div className="absolute bottom-full right-0 mb-2 bg-jolshaa-surface-container-high rounded-lg shadow-xl border border-jolshaa-outline-variant py-1 z-20 min-w-[100px]">
                      <button
                        onClick={() => { setSelectedQuality('auto'); setShowQualityMenu(false); }}
                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-jolshaa-surface-container-highest ${selectedQuality === 'auto' ? 'text-blue-400' : 'text-white'}`}
                      >
                        Auto
                      </button>
                      {qualities.map((q) => (
                        <button
                          key={q.resolution}
                          onClick={() => { setSelectedQuality(q.resolution); setShowQualityMenu(false); }}
                          className={`w-full text-left px-3 py-1.5 text-xs hover:bg-jolshaa-surface-container-highest ${selectedQuality === q.resolution ? 'text-blue-400' : 'text-white'}`}
                        >
                          {q.resolution}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* PiP */}
            {document.pictureInPictureEnabled && (
              <button onClick={togglePiP} className="text-white hover:text-blue-400 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm9 7l5-3.5V16l-5-3.5z" />
                </svg>
              </button>
            )}

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="text-white hover:text-blue-400 transition-colors">
              {isFullscreen ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
