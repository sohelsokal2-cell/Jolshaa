import { useState } from 'react';
import API from '../api/axios';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

const MessageReactions = ({ messageId, reactions, currentUserId }) => {
  const [showPicker, setShowPicker] = useState(false);

  const handleReact = async (emoji) => {
    try {
      await API.put(`/messages/${messageId}/react`, { emoji });
      setShowPicker(false);
    } catch (err) {
      console.error('Failed to react');
    }
  };

  const myReaction = reactions?.find(r => r.user === currentUserId || r.user?._id === currentUserId);

  return (
    <div className="relative inline-block">
      {reactions && reactions.length > 0 && (
        <div className="flex gap-1 mt-1">
          {[...new Set(reactions.map(r => r.emoji))].map(emoji => (
            <span key={emoji} className="text-sm bg-jolshaa-surface-container-low rounded-full px-1.5 py-0.5">
              {emoji} {reactions.filter(r => r.emoji === emoji).length}
            </span>
          ))}
        </div>
      )}

      <button
        onClick={() => setShowPicker(!showPicker)}
        className="text-xs text-jolshaa-on-surface-variant/60 hover:text-jolshaa-on-surface-variant ml-1"
      >
        😊
      </button>

      {showPicker && (
        <div className="absolute bottom-full left-0 mb-1 bg-white rounded-full shadow-lg px-2 py-1 flex gap-1 z-50">
          {EMOJIS.map(emoji => (
            <button
              key={emoji}
              onClick={() => handleReact(emoji)}
              className="text-lg hover:scale-125 transition-transform p-1"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageReactions;
