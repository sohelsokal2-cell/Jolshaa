import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Avatar from './ui/Avatar';
import ReactionPicker from './ReactionPicker';
import CommentSection from './CommentSection';
import ReportModal from './ReportModal';
import ShareModal from './ShareModal';
import SaveButton from './SaveButton';
import Poll from './Poll';
import QAPost from './QAPost';
import BoostPostModal from './BoostPostModal';
import MediaCarousel from './MediaCarousel';
import FactCheckBadge from './FactCheckBadge';

const PostCard = ({ post, onDelete }) => {
  const { user } = useAuth();
  const [reactions, setReactions] = useState(post.reactions || { count: 0, myReaction: null });
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.text);
  const [displayText, setDisplayText] = useState(post.text);
  const [isEdited, setIsEdited] = useState(post.isEdited);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showBoost, setShowBoost] = useState(false);
  const [contentRevealed, setContentRevealed] = useState(!post.contentWarning || post.contentWarning === 'none');
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleReact = async (type) => {
    try {
      const res = await API.post(`/posts/${post._id}/react`, { type });
      if (res.data.myReaction) {
        setReactions({ count: reactions.myReaction ? reactions.count : reactions.count + 1, myReaction: res.data.myReaction });
      } else {
        setReactions({ count: reactions.count - 1, myReaction: null });
      }
    } catch (err) {
      console.error('Failed to react');
    }
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;
    try {
      const res = await API.put(`/posts/${post._id}`, { text: editText });
      setDisplayText(res.data.text);
      setIsEdited(true);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to edit post');
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/posts/${post._id}`);
      if (onDelete) onDelete(post._id);
    } catch (err) {
      console.error('Failed to delete post');
    }
  };

  const isOwner = user?.id === post.author?._id;
  const sharedPost = post.sharedPost;

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const renderMedia = (media) => {
    if (!media || media.length === 0) return null;
    return <MediaCarousel media={media} />;
  };

  return (
    <article className="bg-white dark:bg-neutral-800 rounded-xl shadow-card overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${post.author?._id}`}>
              <Avatar src={post.author?.profilePhoto} alt={post.author?.name} size="md" />
            </Link>
            <div>
              <Link to={`/profile/${post.author?._id}`} className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 hover:underline">
                {post.author?.name}
              </Link>
              {post.collaborators?.length > 0 && (
                <span className="text-xs text-neutral-500">
                  with {post.collaborators.map(c => c.user?.name).filter(Boolean).join(', ')}
                </span>
              )}
              <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                <span>{timeAgo(post.createdAt)}</span>
                {isEdited && <span>· edited</span>}
                {sharedPost && <span>· shared</span>}
                {post.visibility === 'onlyme' && (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z" /></svg>
                )}
                {post.visibility === 'friends' && (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>
                )}
              </div>
            </div>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-neutral-400"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-neutral-800 rounded-xl shadow-dropdown border border-neutral-100 dark:border-neutral-700 z-20 py-1 animate-scale-in">
                {isOwner ? (
                  <>
                    <button onClick={() => { setIsEditing(true); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-3">
                      <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      Edit post
                    </button>
                    <button onClick={() => { setShowBoost(true); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-3">
                      <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      Boost post
                    </button>
                    <div className="h-px bg-neutral-100 dark:bg-neutral-700 my-1" />
                    <button onClick={() => { handleDelete(); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      Delete
                    </button>
                  </>
                ) : (
                  <button onClick={() => { setShowReport(true); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                    Report post
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {post.communityLabel && (
          <div className="ml-[52px] mt-1">
            <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full font-medium">
              🏷️ {post.communityLabel}
            </span>
          </div>
        )}
        {post.contentWarning && post.contentWarning !== 'none' && (
          <div className="ml-[52px] mt-1">
            <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">
              ⚠️ {post.contentWarning.charAt(0).toUpperCase() + post.contentWarning.slice(1)} content
            </span>
          </div>
        )}
        {post.feeling && (
          <p className="text-sm text-neutral-500 mt-1 ml-[52px]">
            is feeling <span className="font-medium text-neutral-700 dark:text-neutral-300">{post.feeling}</span>
          </p>
        )}

        {post.isSponsored && (
          <div className="ml-[52px] mt-1">
            <span className="text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 rounded">Sponsored</span>
          </div>
        )}
        {post.isBoosted && (
          <div className="ml-[52px] mt-1">
            <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded flex items-center gap-1 w-fit">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M7 2v11h3v9l7-12h-4l4-8z" /></svg>
              Boosted
            </span>
          </div>
        )}

        {/* Fact-check badge */}
        <FactCheckBadge post={post} />
      </div>

      {/* Content */}
      <div className="px-4 pb-2">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 bg-white dark:bg-neutral-700 resize-none"
              rows={4}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={handleEdit} className="px-4 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">Save</button>
              <button onClick={() => { setIsEditing(false); setEditText(displayText); }} className="px-4 py-1.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-lg text-sm font-medium hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            {displayText && (
              <p className="text-sm text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap leading-relaxed line-clamp-4">{displayText}</p>
            )}

            {sharedPost && (
              <div className="mt-2 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden bg-neutral-50 dark:bg-neutral-900">
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar src={sharedPost.author?.profilePhoto} alt={sharedPost.author?.name} size="sm" />
                    <div>
                      <Link to={`/profile/${sharedPost.author?._id}`} className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 hover:underline">
                        {sharedPost.author?.name}
                      </Link>
                      <p className="text-2xs text-neutral-500">{timeAgo(sharedPost.createdAt)}</p>
                    </div>
                  </div>
                  {sharedPost.text && <p className="text-sm text-neutral-700 dark:text-neutral-300">{sharedPost.text}</p>}
                </div>
                {sharedPost.media?.length > 0 && (
                  <MediaCarousel media={sharedPost.media} />
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Media */}
      {!sharedPost && post.media && post.media.length > 0 && (
        <div className="relative">
          <div className={!contentRevealed ? '' : ''}>
            {renderMedia(post.media)}
          </div>
          {!contentRevealed && post.contentWarning && post.contentWarning !== 'none' && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center z-10">
              <span className="text-4xl mb-2">⚠️</span>
              <p className="text-white font-medium text-sm mb-1">
                {post.contentWarning.charAt(0).toUpperCase() + post.contentWarning.slice(1)} content
              </p>
              <button
                onClick={() => setContentRevealed(true)}
                className="px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm rounded-full font-medium transition-colors"
              >
                Show anyway
              </button>
            </div>
          )}
        </div>
      )}

      {/* Poll */}
      <div className="px-4">
        <Poll postId={post._id} isOwner={isOwner} />
      </div>

      {/* Q&A */}
      <div className="px-4">
        <QAPost postId={post._id} isOwner={isOwner} />
      </div>

      {/* Footnotes */}
      {post.footnotes && (
        <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-700">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 italic">
            📝 {post.footnotes}
          </p>
        </div>
      )}

      {/* Reaction & Comment counts */}
      {(reactions.count > 0 || commentCount > 0) && (
        <div className="px-4 py-2 flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center gap-1.5">
            {reactions.count > 0 && (
              <>
                <span className="flex items-center justify-center w-5 h-5 bg-primary-100 dark:bg-primary-900/30 rounded-full text-[10px]">
                  {reactions.myReaction === 'love' ? '❤️' : reactions.myReaction === 'haha' ? '😂' : reactions.myReaction === 'wow' ? '😮' : reactions.myReaction === 'sad' ? '😢' : reactions.myReaction === 'angry' ? '😡' : reactions.myReaction === 'fire' ? '🔥' : reactions.myReaction === 'clap' ? '👏' : reactions.myReaction === 'think' ? '🤔' : reactions.myReaction === 'care' ? '🤗' : '👍'}
                </span>
                <span>{reactions.count}</span>
              </>
            )}
          </div>
          <div className="flex gap-3">
            {commentCount > 0 && (
              <button onClick={() => setShowComments(!showComments)} className="hover:underline">
                {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="px-4 py-1 border-t border-neutral-100 dark:border-neutral-700">
        <div className="flex items-center justify-between">
          <ReactionPicker currentReaction={reactions.myReaction} onReact={handleReact} />
          {post.commentPrivacy === 'none' && !isOwner ? (
            <span className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-neutral-400 cursor-not-allowed">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              Comments off
            </span>
          ) : (
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Comment
            </button>
          )}
            <button
            onClick={() => setShowShare(true)}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
          <SaveButton postId={post._id} initialSaved={post.isSaved} className="flex-shrink-0" />
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="px-4 pb-4 border-t border-neutral-100 dark:border-neutral-700 pt-3">
          <CommentSection postId={post._id} commentCount={commentCount} />
        </div>
      )}

      {showReport && <ReportModal targetType="post" targetId={post._id} onClose={() => setShowReport(false)} />}
      {showShare && <ShareModal post={post} onClose={() => setShowShare(false)} />}
      {showBoost && <BoostPostModal postId={post._id} onClose={() => setShowBoost(false)} />}
    </article>
  );
};

export default PostCard;
