import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const ShareModal = ({ post, onClose, shareType, shareId }) => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [activeTab, setActiveTab] = useState('share');
  const navigate = useNavigate();

  useEffect(() => {
    if (activeTab === 'message') fetchConversations();
  }, [activeTab]);

  const fetchConversations = async () => {
    try {
      const res = await API.get('/conversations');
      setConversations(res.data.conversations || res.data || []);
    } catch (err) {
      console.error('Failed to fetch conversations');
    }
  };

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

  const handleShareToMessage = async () => {
    if (!selectedConv) return;
    setLoading(true);
    try {
      const postId = post?._id || shareId;
      const postUrl = `${window.location.origin}/feed?post=${postId}`;
      const shareText = text || post?.text || 'Check this out!';
      await API.post(`/messages/${selectedConv._id}`, {
        text: `${shareText}\n\n${postUrl}`,
      });
      onClose();
      navigate(`/messages/${selectedConv._id}`);
    } catch (err) {
      console.error('Failed to share via message');
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
          <h3 className="font-display font-semibold text-jolshaa-on-surface">{shareType === 'album' ? 'Share Album' : 'Share Post'}</h3>
          <button onClick={onClose} className="text-jolshaa-on-surface-variant/60 hover:text-jolshaa-on-surface-variant text-xl">&times;</button>
        </div>

        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('share')}
            className={`flex-1 py-2.5 text-sm font-medium ${activeTab === 'share' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-jolshaa-on-surface-variant'}`}
          >
            Share to Feed
          </button>
          <button
            onClick={() => setActiveTab('message')}
            className={`flex-1 py-2.5 text-sm font-medium ${activeTab === 'message' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-jolshaa-on-surface-variant'}`}
          >
            Send via Message
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'share' ? (
            <>
              {post && (
                <div className="bg-jolshaa-surface-container-low rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={post.author?.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium text-jolshaa-on-surface">{post.author?.name}</p>
                      <p className="text-xs text-jolshaa-on-surface-variant/60">{new Date(post.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className="text-sm text-jolshaa-on-surface line-clamp-3">{post.text}</p>
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
                  className="flex-1 bg-jolshaa-surface-container-low text-jolshaa-on-surface py-2 rounded-lg text-sm font-medium hover:bg-jolshaa-surface-container transition"
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
            </>
          ) : (
            <>
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="max-h-60 overflow-y-auto space-y-1">
                {conversations.length === 0 ? (
                  <p className="text-center text-jolshaa-on-surface-variant/60 text-sm py-4">No conversations found</p>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv._id}
                      onClick={() => setSelectedConv(conv)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition ${
                        selectedConv?._id === conv._id ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-jolshaa-surface-container-low'
                      }`}
                    >
                      <img
                        src={conv.otherUser?.profilePhoto || conv.participants?.find(p => p._id !== user?.id)?.profilePhoto || 'https://ui-avatars.com/api/?name=U'}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-jolshaa-on-surface truncate">
                          {conv.otherUser?.name || conv.participants?.find(p => p._id !== user?.id)?.name || 'Chat'}
                        </p>
                        <p className="text-xs text-jolshaa-on-surface-variant/60 truncate">{conv.lastMessage || ''}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Add a message (optional)..."
                className="w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mt-3"
                rows={2}
              />

              <button
                onClick={handleShareToMessage}
                disabled={!selectedConv || loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition mt-3"
              >
                {loading ? 'Sending...' : 'Send'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
