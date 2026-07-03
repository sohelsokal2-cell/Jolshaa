import { useEffect, useRef } from 'react';

const IncomingCallScreen = ({ callerInfo, callType, onAccept, onReject }) => {
  const ringtoneRef = useRef(null);

  useEffect(() => {
    // Play ringtone
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      const playRing = () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(480, audioContext.currentTime + 0.4);

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.8);
      };

      // Play ring every 1.2 seconds
      playRing();
      const interval = setInterval(playRing, 1200);

      ringtoneRef.current = { audioContext, interval };

      return () => {
        clearInterval(interval);
        audioContext.close();
      };
    } catch (e) {
      // Audio not supported
    }
  }, []);

  const callerName = callerInfo?.name || 'Unknown';
  const callerPhoto = callerInfo?.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }}>

      {/* Background blur effect */}
      <div className="absolute inset-0 overflow-hidden">
        <img src={callerPhoto} alt="" className="w-full h-full object-cover opacity-20 blur-3xl scale-110" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* Caller photo with pulsing ring */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" style={{ animationDuration: '1.5s' }} />
          <div className="absolute -inset-2 rounded-full border-2 border-white/30 animate-pulse" />
          <img
            src={callerPhoto}
            alt={callerName}
            className="w-32 h-32 rounded-full object-cover border-4 border-white/30 relative z-10"
          />
        </div>

        {/* Caller name */}
        <h2 className="text-2xl font-bold text-white mb-2">{callerName}</h2>

        {/* Call type label */}
        <p className="text-lg text-white/70 mb-2">
          {callType === 'video' ? 'Incoming Video Call' : 'Incoming Audio Call'}
        </p>

        {/* Ringing indicator */}
        <div className="flex items-center gap-1.5 mt-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>

      {/* Action buttons */}
      <div className="relative z-10 flex items-center gap-12 mt-16">
        {/* Reject button */}
        <button
          onClick={onReject}
          className="flex flex-col items-center gap-2 group"
        >
          <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center group-hover:bg-red-600 transition shadow-lg shadow-red-500/30">
            <svg className="w-8 h-8 text-white rotate-[135deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <span className="text-white/70 text-sm">Decline</span>
        </button>

        {/* Accept button */}
        <button
          onClick={onAccept}
          className="flex flex-col items-center gap-2 group"
        >
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center group-hover:bg-green-600 transition shadow-lg shadow-green-500/30 animate-pulse">
            {callType === 'video' ? (
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            )}
          </div>
          <span className="text-white/70 text-sm">Accept</span>
        </button>
      </div>
    </div>
  );
};

export default IncomingCallScreen;
