import PostCard from './PostCard';

const PinnedPostCard = ({ post, onDelete, onUnpin }) => {
  if (!post) return null;

  return (
    <div className="relative">
      {/* Pin badge */}
      <div className="absolute -top-2 left-4 z-10 flex items-center gap-1 bg-jolshaa-surface-container-lowest px-2.5 py-1 rounded-full shadow-ambient border border-jolshaa-outline-variant/50">
        <svg className="w-3.5 h-3.5 text-jolshaa-teal" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" />
        </svg>
        <span className="text-xs font-medium text-jolshaa-teal">Pinned</span>
        {onUnpin && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Unpin this post from your profile?')) {
                onUnpin();
              }
            }}
            className="ml-1 text-jolshaa-on-surface-variant hover:text-red-500 transition-colors"
            aria-label="Unpin post"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {/* Subtle border tint for pinned post */}
      <div className="border border-jolshaa-teal/20 rounded-xl overflow-hidden">
        <PostCard post={post} onDelete={onDelete} isPinned={true} onUnpin={onUnpin} />
      </div>
    </div>
  );
};

export default PinnedPostCard;
