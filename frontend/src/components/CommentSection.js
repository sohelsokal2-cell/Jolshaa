import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import ReportModal from './ReportModal';

const REACTIONS = [
  { type: 'like', emoji: '👍' },
  { type: 'love', emoji: '❤️' },
  { type: 'haha', emoji: '😂' },
  { type: 'wow', emoji: '😮' },
  { type: 'sad', emoji: '😢' },
  { type: 'angry', emoji: '😡' }
];

const Comment = ({ comment, onDelete }) => {
  const { user } = useAuth();
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [showReport, setShowReport] = useState(false);

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

  return (
    <div className="ml-4 mt-2">
      <div className="flex items-start gap-2">
        <img
          src={comment.author?.profilePhoto || 'https://res.cloudinary.com/demo/image/upload/v1556418119/default-avatar.png'}
          alt=""
          className="w-8 h-8 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="bg-gray-100 rounded-lg px-3 py-2">
            <span className="font-semibold text-sm">{comment.author?.name}</span>
            <p className="text-sm text-gray-700">{comment.text}</p>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <button className="hover:text-blue-600">Like</button>
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="hover:text-blue-600"
            >
              Reply
            </button>
            {user?.id === comment.author?._id ? (
              <button
                onClick={() => onDelete(comment._id)}
                className="hover:text-red-600"
              >
                Delete
              </button>
            ) : (
              <button
                onClick={() => setShowReport(true)}
                className="hover:text-red-600"
              >
                Report
              </button>
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
                className="flex-1 bg-gray-100 rounded-full px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleReply}
                disabled={replying || !replyText.trim()}
                className="text-blue-600 text-sm font-medium hover:text-blue-700 disabled:opacity-50"
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
                  className="text-sm text-gray-500 hover:text-blue-600 font-medium"
                >
                  View {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </button>
              )}
              {showReplies && comment.replies.map(reply => (
                <div key={reply._id} className="flex items-start gap-2 mt-2 ml-4">
                  <img
                    src={reply.author?.profilePhoto || 'https://res.cloudinary.com/demo/image/upload/v1556418119/default-avatar.png'}
                    alt=""
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg px-3 py-1">
                      <span className="font-semibold text-xs">{reply.author?.name}</span>
                      <p className="text-xs text-gray-700">{reply.text}</p>
                    </div>
                    <span className="text-xs text-gray-400 ml-1">
                      {new Date(reply.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
              {showReplies && (
                <button
                  onClick={() => setShowReplies(false)}
                  className="text-xs text-gray-500 hover:text-blue-600 ml-6 mt-1"
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

  return (
    <div className="border-t pt-3">
      {!loaded && (
        <button
          onClick={loadComments}
          className="text-sm text-gray-500 hover:text-blue-600 font-medium mb-2"
        >
          View {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
        </button>
      )}

      {loaded && (
        <>
          {comments.map(comment => (
            <Comment
              key={comment._id}
              comment={comment}
              onDelete={handleDeleteComment}
            />
          ))}

          {page < totalPages && (
            <button
              onClick={() => setPage(page + 1)}
              className="text-sm text-gray-500 hover:text-blue-600 font-medium ml-4 mt-2"
            >
              Load more comments
            </button>
          )}
        </>
      )}

      <div className="flex items-center gap-2 mt-3">
        <img
          src={user.profilePhoto || 'https://res.cloudinary.com/demo/image/upload/v1556418119/default-avatar.png'}
          alt=""
          className="w-8 h-8 rounded-full object-cover"
        />
        <input
          type="text"
          placeholder="Write a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
          className="flex-1 bg-gray-100 rounded-full px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAddComment}
          disabled={!text.trim()}
          className="text-blue-600 text-sm font-medium hover:text-blue-700 disabled:opacity-50"
        >
          Post
        </button>
      </div>
    </div>
  );
};

export default CommentSection;
