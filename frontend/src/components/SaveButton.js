import { useState, useEffect } from 'react';
import API from '../api/axios';

const SaveButton = ({ postId, initialSaved }) => {
  const [isSaved, setIsSaved] = useState(initialSaved || false);

  const handleToggle = async () => {
    try {
      const res = await API.put(`/posts/${postId}/save`);
      setIsSaved(res.data.isSaved);
    } catch (err) {
      console.error('Failed to save post');
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600"
    >
      {isSaved ? (
        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      )}
    </button>
  );
};

export default SaveButton;
