import { useState } from 'react';

const REACTIONS = [
  { type: 'like', emoji: '👍', label: 'Like' },
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'haha', emoji: '😂', label: 'Haha' },
  { type: 'wow', emoji: '😮', label: 'Wow' },
  { type: 'sad', emoji: '😢', label: 'Sad' },
  { type: 'angry', emoji: '😡', label: 'Angry' }
];

const ReactionPicker = ({ currentReaction, onReact }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState(null);

  const handleMouseEnter = () => {
    clearTimeout(hoverTimeout);
    setHoverTimeout(setTimeout(() => setShowPicker(true), 500));
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimeout);
    setHoverTimeout(setTimeout(() => setShowPicker(false), 300));
  };

  const handleReaction = (type) => {
    onReact(type);
    setShowPicker(false);
  };

  const currentEmoji = REACTIONS.find(r => r.type === currentReaction);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={() => handleReaction(currentReaction || 'like')}
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition ${
          currentReaction
            ? 'bg-blue-100 text-blue-600 font-medium'
            : 'hover:bg-gray-100 text-gray-500'
        }`}
      >
        {currentEmoji ? (
          <span className="text-base">{currentEmoji.emoji}</span>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
        )}
        <span>{currentEmoji ? currentEmoji.label : 'Like'}</span>
      </button>

      {showPicker && (
        <div className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-lg border px-2 py-1 flex gap-1 z-50">
          {REACTIONS.map(reaction => (
            <button
              key={reaction.type}
              onClick={() => handleReaction(reaction.type)}
              className={`text-2xl hover:scale-125 transition-transform p-1 rounded-full ${
                currentReaction === reaction.type ? 'bg-blue-50' : ''
              }`}
              title={reaction.label}
            >
              {reaction.emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReactionPicker;
