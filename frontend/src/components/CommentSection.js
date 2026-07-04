import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import ReportModal from './ReportModal';
import SubscriberBadge from './SubscriberBadge';

const Comment = ({ comment, onDelete, isPinned, onPin }) => {
  const { user } = useAuth();
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reactions, setReactions] = useState(comment.reactions || { count: 0, myReaction: null });

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      await API.post(`/posts/${comment.post}/comments`, {
        text: replyText,
        parentComment: comment._id
      });
      setReplyText('');
      setShowReplies(true);
    } catch (err) {
      console.error('Failed to reply');
    } finally {
      setReplying(false);
    }
  };

  const handleLike = async () => {
    try {
      const res = await API.post(`/comments/${comment._id}/like`);
      if (res.data.liked) {
        setReactions({ count: reactions.count + 1, myReaction: 'like' });
      } else {
        setReactions({ count: Math.max(0, reactions.count - 1), myReaction: null });
      }
    } catch (err) {
      console.error('Failed to like comment');
    }
  };

  const isOwner = user?.id === comment.author?._id;

  return (
    <div className={`ml-4 mt-2 ${isPinned ? 'bg-primary-50 dark:bg-primary-900/20 rounded-lg p-2 -ml-2 -mr-2' : ''}`}>
      {isPinned && (
        <span className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-1 block">📌 Pinned</span>
      )}
      <div className="flex items-start gap-2">
        <img
          src={comment.author?.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'}
          alt={comment.author?.name || 'User avatar'}
          className="w-8 h-8 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="bg-surface-high/50 rounded-lg px-3 py-2">
            <span className="font-semibold text-sm text-on-surface">{comment.author?.name}</span>
            {comment.author?.subscriberTier && <SubscriberBadge tier={comment.author.subscriberTier} size="sm" />}
            <p className="text-sm text-on-surface-variant">{comment.text}</p>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant">
            <button
              onClick={handleLike}
              className={`font-medium hover:text-primary-400 ${reactions.myReaction ? 'text-primary-400' : ''}`}
            >
              {reactions.myReaction ? '❤️' : 'Like'}
              {reactions.count > 0 && ` (${reactions.count})`}
            </button>
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="hover:text-primary-400"
            >
              Reply
            </button>
            {isOwner && (
              <>
                <button onClick={() => onPin(comment._id)} className="hover:text-primary-400">
                  {isPinned ? 'Unpin' : 'Pin'}
                </button>
                <button onClick={() => onDelete(comment._id)} className="hover:text-red-600">Delete</button>
              </>
            )}
            {!isOwner && (
              <button onClick={() => setShowReport(true)} className="hover:text-red-600">Report</button>
            )}
            <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
          </div>

          {showReplies && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                className="flex-1 bg-surface-high/50 rounded-full px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
              <button
                onClick={handleReply}
                disabled={replying || !replyText.trim()}
                className="text-primary-400 text-sm font-medium hover:text-primary-300 disabled:opacity-50"
              >
                Reply
              </button>
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2">
              {!showReplies && (
                <button
                  onClick={() => setShowReplies(true)}
                  className="text-sm text-on-surface-variant hover:text-primary-400 font-medium"
                >
                  View {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </button>
              )}
              {showReplies && comment.replies.map(reply => (
                <div key={reply._id} className="flex items-start gap-2 mt-2 ml-4">
                  <img
                    src={reply.author?.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'}
                    alt={reply.author?.name || 'User avatar'}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="bg-surface-high/30 rounded-lg px-3 py-1">
                      <span className="font-semibold text-xs text-on-surface">{reply.author?.name}</span>
                      <p className="text-xs text-on-surface-variant">{reply.text}</p>
                    </div>
                    <span className="text-xs text-on-surface-variant ml-1">
                      {new Date(reply.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
              {showReplies && (
                <button
                  onClick={() => setShowReplies(false)}
                  className="text-xs text-on-surface-variant hover:text-primary-400 ml-6 mt-1"
                >
                  Hide replies
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showReport && (
        <ReportModal
          targetType="comment"
          targetId={comment._id}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
};

const CommentSection = ({ postId, commentCount }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const loadComments = async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const res = await API.get(`/posts/${postId}/comments?page=${page}&limit=10`);
      setComments(res.data.comments);
      setTotalPages(res.data.totalPages);
      setLoaded(true);
    } catch (err) {
      console.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!text.trim()) return;
    try {
      const res = await API.post(`/posts/${postId}/comments`, { text });
      setComments([...comments, res.data]);
      setText('');
    } catch (err) {
      console.error('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await API.delete(`/comments/${commentId}`);
      setComments(comments.filter(c => c._id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment');
    }
  };

  const handlePinComment = async (commentId) => {
    try {
      const res = await API.post(`/comments/${commentId}/pin`);
      setComments(comments.map(c =>
        c._id === commentId ? { ...c, isPinned: res.data.isPinned } : c
      ));
    } catch (err) {
      console.error('Failed to pin comment');
    }
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  return (
    <div className="border-t border-white/10 pt-3">
      {!loaded && (
        <button
          onClick={loadComments}
          className="text-sm text-on-surface-variant hover:text-primary-400 font-medium mb-2"
        >
          View {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
        </button>
      )}

      {loaded && (
        <>
          {sortedComments.map(comment => (
            <Comment
              key={comment._id}
              comment={comment}
              onDelete={handleDeleteComment}
              isPinned={comment.isPinned}
              onPin={handlePinComment}
            />
          ))}

          {page < totalPages && (
            <button
              onClick={() => setPage(page + 1)}
              className="text-sm text-on-surface-variant hover:text-primary-400 font-medium ml-4 mt-2"
            >
              Load more comments
            </button>
          )}
        </>
      )}

      <div className="flex items-center gap-2 mt-3">
        <img
          src={user.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'}
          alt={user.name || 'Your avatar'}
          className="w-8 h-8 rounded-full object-cover"
        />
        <input
          type="text"
          placeholder="Write a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
          className="flex-1 bg-surface-high/50 rounded-full px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
        <button
          onClick={handleAddComment}
          disabled={!text.trim()}
          className="text-primary-400 text-sm font-medium hover:text-primary-300 disabled:opacity-50"
        >
          Post
        </button>
      </div>
    </div>
  );
};

export default CommentSection;
