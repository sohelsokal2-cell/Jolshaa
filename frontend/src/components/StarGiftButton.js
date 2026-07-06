import { useState } from 'react';
import StarGiftModal from './StarGiftModal';

const StarGiftButton = ({ toUserId, postId, creatorName, className = '' }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors ${className}`}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        Gift Stars
      </button>

      <StarGiftModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        toUserId={toUserId}
        postId={postId}
        creatorName={creatorName}
      />
    </>
  );
};

export default StarGiftButton;
