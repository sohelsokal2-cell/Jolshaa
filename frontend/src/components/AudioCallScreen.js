import { useState } from 'react';

const formatDuration = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const AudioCallScreen = ({
  remoteUserId,
  remoteUserInfo,
  callType,
  callDuration,
  isMuted,
  onToggleMute,
  onEndCall,
}) => {
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);

  const remoteName = remoteUserInfo?.name || 'Unknown';
  const remotePhoto = remoteUserInfo?.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }}>

      {/* Background blur effect */}
      <div className="absolute inset-0 overflow-hidden">
        <img src={remotePhoto} alt="" className="w-full h-full object-cover opacity-15 blur-3xl scale-110" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* Remote user photo */}
        <div className="relative mb-6">
          <div className="absolute -inset-3 rounded-full border border-white/10" />
          <img
            src={remotePhoto}
            alt={remoteName}
            className="w-28 h-28 rounded-full object-cover border-4 border-white/20 relative z-10"
          />
        </div>

        {/* User name */}
        <h2 className="font-display text-xl font-bold text-white mb-1">{remoteName}</h2>

        {/* Call duration */}
        <p className="text-lg text-green-400 font-mono mt-1">
          {formatDuration(callDuration)}
        </p>
      </div>

      {/* Controls */}
      <div className="relative z-10 flex items-center gap-8 mt-20">
        {/* Mute button */}
        <button
          onClick={onToggleMute}
          className="flex flex-col items-center gap-2 group"
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-lg ${
            isMuted
              ? 'bg-white text-black'
              : 'bg-white/10 text-white group-hover:bg-white/20'
          }`}>
            {isMuted ? (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </div>
          <span className="text-white/60 text-xs">{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        {/* End call button */}
        <button
          onClick={onEndCall}
          className="flex flex-col items-center gap-2 group"
        >
          <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center group-hover:bg-red-600 transition shadow-lg shadow-red-500/30">
            <svg className="w-8 h-8 text-white rotate-[135deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <span className="text-white/60 text-xs">End Call</span>
        </button>

        {/* Speaker button */}
        <button
          onClick={() => setIsSpeakerOn(!isSpeakerOn)}
          className="flex flex-col items-center gap-2 group"
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-lg ${
            isSpeakerOn
              ? 'bg-white text-black'
              : 'bg-white/10 text-white group-hover:bg-white/20'
          }`}>
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </div>
          <span className="text-white/60 text-xs">Speaker</span>
        </button>
      </div>
    </div>
  );
};

export default AudioCallScreen;
