import { useState, useRef } from 'react';

const formatDuration = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const VideoCallScreen = ({
  remoteUserId,
  remoteUserInfo,
  callDuration,
  isMuted,
  isCameraOff,
  onToggleMute,
  onToggleCamera,
  onEndCall,
  localVideoRef,
  remoteVideoRef,
}) => {
  const [isPipExpanded, setIsPipExpanded] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const localPipRef = useRef(null);

  const remoteName = remoteUserInfo?.name || 'Unknown';
  const remotePhoto = remoteUserInfo?.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128';

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Remote video (full screen) */}
      <div className="flex-1 relative">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        {/* Fallback when no remote video */}
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <img
            src={remotePhoto}
            alt={remoteName}
            className="w-24 h-24 rounded-full object-cover border-4 border-white/20 opacity-0"
          />
        </div>

        {/* Duration badge */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-1.5 rounded-full">
          <span className="text-white font-mono text-sm">{formatDuration(callDuration)}</span>
        </div>

        {/* Name badge */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-1.5 rounded-full">
          <span className="text-white text-sm font-medium">{remoteName}</span>
        </div>
      </div>

      {/* Local video (PIP) */}
      <div
        ref={localPipRef}
        className={`absolute z-10 bg-jolshaa-surface-container-high rounded-xl overflow-hidden shadow-2xl border border-white/20 transition-all duration-300 ${
          isPipExpanded ? 'w-48 h-36' : 'w-28 h-20'
        } bottom-24 right-4`}
        onClick={() => setIsPipExpanded(!isPipExpanded)}
        style={{ cursor: 'pointer' }}
      >
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: isFrontCamera ? 'scaleX(-1)' : 'none' }}
        />
        {isCameraOff && (
          <div className="absolute inset-0 flex items-center justify-center bg-jolshaa-surface-container-high">
            <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-20 pb-8">
        <div className="flex items-center justify-center gap-6 px-4">
          {/* Mute button */}
          <button
            onClick={onToggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
              isMuted ? 'bg-white text-black' : 'bg-white/15 text-white hover:bg-white/25'
            }`}
          >
            {isMuted ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          {/* Camera toggle */}
          <button
            onClick={onToggleCamera}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
              isCameraOff ? 'bg-white text-black' : 'bg-white/15 text-white hover:bg-white/25'
            }`}
          >
            {isCameraOff ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>

          {/* End call button */}
          <button
            onClick={onEndCall}
            className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition shadow-lg shadow-red-500/30"
          >
            <svg className="w-7 h-7 text-white rotate-[135deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>

          {/* Flip camera */}
          <button
            onClick={() => setIsFrontCamera(!isFrontCamera)}
            className="w-12 h-12 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallScreen;
