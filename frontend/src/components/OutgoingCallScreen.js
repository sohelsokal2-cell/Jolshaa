const OutgoingCallScreen = ({ recipientInfo, callType, onEndCall }) => {
  const recipientName = recipientInfo?.name || 'Unknown';
  const recipientPhoto = recipientInfo?.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }}>

      {/* Background blur effect */}
      <div className="absolute inset-0 overflow-hidden">
        <img src={recipientPhoto} alt="" className="w-full h-full object-cover opacity-20 blur-3xl scale-110" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* Recipient photo with pulsing ring */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" style={{ animationDuration: '1.5s' }} />
          <div className="absolute -inset-2 rounded-full border-2 border-white/30 animate-pulse" />
          <img
            src={recipientPhoto}
            alt={recipientName}
            className="w-32 h-32 rounded-full object-cover border-4 border-white/30 relative z-10"
          />
        </div>

        {/* Recipient name */}
        <h2 className="font-display text-2xl font-bold text-white mb-2">{recipientName}</h2>

        {/* Call type label + elapsed */}
        <p className="text-lg text-white/70 mb-2">
          {callType === 'video' ? 'Video Call' : 'Audio Call'}
        </p>

        {/* Calling animation */}
        <p className="text-white/50 text-sm mt-1">Calling...</p>
      </div>

      {/* End call button */}
      <div className="relative z-10 mt-16">
        <button
          onClick={onEndCall}
          className="flex flex-col items-center gap-2 group"
        >
          <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center group-hover:bg-red-600 transition shadow-lg shadow-red-500/30">
            <svg className="w-8 h-8 text-white rotate-[135deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <span className="text-white/70 text-sm">End Call</span>
        </button>
      </div>
    </div>
  );
};

export default OutgoingCallScreen;
