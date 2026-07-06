import { useEffect, useState } from 'react';

const formatDuration = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
};

const CallEndedScreen = ({ callDuration, callStatus, callType, remoteUserInfo, onDone }) => {
  const [visible, setVisible] = useState(true);

  const remoteName = remoteUserInfo?.name || 'Unknown';
  const remotePhoto = remoteUserInfo?.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128';

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  // Determine status text
  let statusText = '';
  if (callStatus === 'completed') {
    statusText = 'Call ended';
  } else if (callStatus === 'missed') {
    statusText = 'Missed call';
  } else if (callStatus === 'rejected') {
    statusText = 'Call rejected';
  } else if (callStatus === 'cancelled') {
    statusText = 'Call cancelled';
  } else {
    statusText = 'Call ended';
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center animate-fadeIn"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }}>

      {/* Background blur */}
      <div className="absolute inset-0 overflow-hidden">
        <img src={remotePhoto} alt="" className="w-full h-full object-cover opacity-10 blur-3xl scale-110" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* User photo */}
        <img
          src={remotePhoto}
          alt={remoteName}
          className="w-20 h-20 rounded-full object-cover border-4 border-white/20 mb-4"
        />

        {/* Name */}
        <h2 className="font-display text-xl font-bold text-white mb-2">{remoteName}</h2>

        {/* Status */}
        <p className="text-white/70 text-base mb-1">{statusText}</p>

        {/* Duration */}
        {callDuration > 0 && (
          <p className="text-green-400 font-mono text-lg">
            {formatDuration(callDuration)}
          </p>
        )}

        {/* Call type icon */}
        <div className="mt-4 flex items-center gap-2 text-white/40 text-sm">
          {callType === 'video' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          )}
          <span>{callType === 'video' ? 'Video call' : 'Audio call'}</span>
        </div>
      </div>
    </div>
  );
};

export default CallEndedScreen;
