import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ReelCommentsDrawer = ({ reelId, onClose, onCommentAdded }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    API.get(`/reels/${reelId}`)
      .then((res) => {
        if (!cancelled) setComments(res.data.reel.comments || []);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reelId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || posting) return;
    setPosting(true);
    try {
      const res = await API.post(`/reels/${reelId}/comments`, { text: text.trim() });
      setComments((prev) => [...prev, res.data.comment]);
      setText('');
      onCommentAdded?.();
    } catch (err) {
      // no-op, keep drafted text so the user can retry
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md rounded-t-2xl max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-sm">Comments</h3>
          <button onClick={onClose} className="text-jolshaa-on-surface-variant text-xl leading-none">&times;</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <p className="text-sm text-jolshaa-on-surface-variant">Loading...</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-jolshaa-on-surface-variant">No comments yet. Be the first!</p>
          ) : (
            comments.map((c) => (
              <div key={c._id} className="flex gap-2 text-sm">
                <img
                  src={c.user?.profilePhoto}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
                <div>
                  <span className="font-semibold mr-1">{c.user?.name}</span>
                  <span>{c.text}</span>
                </div>
              </div>
            ))
          )}
        </div>
        <form onSubmit={handleSubmit} className="p-3 border-t flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!text.trim() || posting}
            className="text-blue-600 font-semibold text-sm px-3 disabled:opacity-40"
          >
            Post
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReelCommentsDrawer;
