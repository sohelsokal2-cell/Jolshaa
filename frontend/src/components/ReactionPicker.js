import { useState, useRef, useEffect } from 'react';

const REACTIONS = [
  { type: 'like', emoji: '👍', label: 'Like' },
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'haha', emoji: '😂', label: 'Haha' },
  { type: 'wow', emoji: '😮', label: 'Wow' },
  { type: 'sad', emoji: '😢', label: 'Sad' },
  { type: 'angry', emoji: '😡', label: 'Angry' },
  { type: 'fire', emoji: '🔥', label: 'Fire' },
  { type: 'clap', emoji: '👏', label: 'Clap' },
  { type: 'think', emoji: '🤔', label: 'Think' },
  { type: 'care', emoji: '🤗', label: 'Care' },
];

const ReactionPicker = ({ currentReaction, onReact }) => {
  const [showPicker, setShowPicker] = useState(false);
  const timeoutRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShowPicker(true), 400);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShowPicker(false), 200);
  };

  const handleReaction = (type) => {
    onReact(type);
    setShowPicker(false);
  };

  const currentEmoji = REACTIONS.find(r => r.type === currentReaction);

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={() => handleReaction(currentReaction || 'like')}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
          currentReaction
            ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
            : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
        }`}
      >
        {currentEmoji ? (
          <span className="text-base leading-none">{currentEmoji.emoji}</span>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
        )}
        <span>{currentEmoji ? currentEmoji.label : 'Like'}</span>
      </button>

      {showPicker && (
        <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-neutral-800 rounded-full shadow-dropdown border border-neutral-100 dark:border-neutral-700 px-2 py-1.5 flex gap-0.5 z-50 animate-scale-in">
          {REACTIONS.map(reaction => (
            <button
              key={reaction.type}
              onClick={() => handleReaction(reaction.type)}
              className={`text-xl hover:scale-125 active:scale-95 transition-all p-1.5 rounded-full ${
                currentReaction === reaction.type ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
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
