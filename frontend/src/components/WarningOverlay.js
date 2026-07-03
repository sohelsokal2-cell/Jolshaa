import { useState } from 'react';

const WarningOverlay = ({ post, factCheck, isCommunity }) => {
  const [revealed, setRevealed] = useState(() => {
    // Remember preference for this session
    try {
      return sessionStorage.getItem(`fc_revealed_${post._id}`) === 'true';
    } catch {
      return false;
    }
  });

  if (revealed) return null;

  const handleReveal = () => {
    setRevealed(true);
    try {
      sessionStorage.setItem(`fc_revealed_${post._id}`, 'true');
    } catch {}
  };

  return (
    <div className="relative">
      {/* Blur the post content */}
      <style>{`
        .fc-warning-blur-${post._id} > *:not(.fc-warning-overlay-${post._id}) {
          filter: blur(6px);
          user-select: none;
          pointer-events: none;
        }
      `}</style>

      <div className={`fc-warning-blur-${post._id}`}>
        {/* Warning overlay box */}
        <div className={`fc-warning-overlay-${post._id} relative z-10 mx-4 my-3 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
              <span className="text-red-500 text-lg">⚠</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                এই পোস্টে ভুল তথ্য থাকতে পারে
              </p>
              <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">
                {isCommunity
                  ? 'কমিউনিটি ভোটের ভিত্তিতে এটি চিহ্নিত করা হয়েছে'
                  : 'অ্যাডমিন দ্বারা যাচাইকৃত'}
              </p>
              <button
                onClick={handleReveal}
                className="mt-3 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg font-medium transition-colors"
              >
                তবুও দেখুন
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarningOverlay;
