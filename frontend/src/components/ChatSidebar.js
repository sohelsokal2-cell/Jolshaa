import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import API from '../api/axios';

const ChatSidebar = ({ activeConversation, onSelectConversation }) => {
  const { user } = useAuth();
  const { onlineUsers } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await API.get('/conversations');
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  };

  const getOtherParticipant = (conv) => {
    return conv.participants.find(p => p._id !== user.id);
  };

  const getConversationName = (conv) => {
    if (conv.isGroup) return conv.groupName || 'Group Chat';
    const other = getOtherParticipant(conv);
    return other?.name || 'Unknown';
  };

  const getConversationPhoto = (conv) => {
    if (conv.isGroup) return conv.groupPhoto;
    const other = getOtherParticipant(conv);
    return other?.profilePhoto;
  };

  const isOnline = (conv) => {
    if (conv.isGroup) return false;
    const other = getOtherParticipant(conv);
    return other && onlineUsers.has(other._id);
  };

  return (
    <div className="w-80 bg-white border-r h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">Chats</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No conversations yet</div>
        ) : (
          conversations.map(conv => (
            <button
              key={conv._id}
              onClick={() => onSelectConversation(conv)}
              className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition ${
                activeConversation?._id === conv._id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="relative">
                <img
                  src={getConversationPhoto(conv) || 'https://res.cloudinary.com/demo/image/upload/v1556418119/default-avatar.png'}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover"
                />
                {isOnline(conv) && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="font-semibold text-sm truncate">
                  {getConversationName(conv)}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {conv.lastMessage?.text || 'No messages yet'}
                </div>
              </div>
              {conv.lastMessage && (
                <div className="text-xs text-gray-400">
                  {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
