import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const ShareModal = ({ post, onClose, shareType, shareId }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleShare = async () => {
    setLoading(true);
    try {
      if (shareType === 'album') {
        await API.put(`/albums/${shareId}/share`, { text });
      } else {
        await API.post(`/posts/${post._id}/share`, { text });
      }
      onClose();
      navigate('/feed');
    } catch (err) {
      console.error('Failed to share');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const url = shareType === 'album'
      ? `${window.location.origin}/profile`
      : `${window.location.origin}/feed`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-gray-800">{shareType === 'album' ? 'Share Album' : 'Share Post'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        <div className="p-4">
          {post && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <img
                  src={post.author?.profilePhoto || 'https://res.cloudinary.com/demo/image/upload/v1556418119/default-avatar.png'}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">{post.author?.name}</p>
                  <p className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 line-clamp-3">{post.text}</p>
            </div>
          )}

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Say something about this..."
            className="w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
          />

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleCopyLink}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <button
              onClick={handleShare}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? 'Sharing...' : 'Share Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
