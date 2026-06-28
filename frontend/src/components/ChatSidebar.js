import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import API from '../api/axios';

const ChatSidebar = ({ activeConversation, onSelectConversation, className = '' }) => {
  const { user } = useAuth();
  const { onlineUsers } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showNewChat, setShowNewChat] = useState(false);
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');

  useEffect(() => { fetchConversations(); }, []);

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

  const fetchFriends = async () => {
    setFriendsLoading(true);
    try {
      const res = await API.get(`/friends/${user.id}`);
      setFriends(res.data.friends);
    } catch (err) {
      console.error('Failed to fetch friends');
    } finally {
      setFriendsLoading(false);
    }
  };

  const openNewChat = () => {
    setShowNewChat(true);
    if (friends.length === 0) fetchFriends();
  };

  const startConversation = async (friendId) => {
    try {
      const res = await API.post('/conversations', { participantId: friendId });
      const conv = res.data;
      setConversations(prev => {
        const exists = prev.find(c => c._id === conv._id);
        if (exists) return prev;
        return [conv, ...prev];
      });
      onSelectConversation(conv);
      setShowNewChat(false);
    } catch (err) {
      console.error('Failed to start conversation');
    }
  };

  const getOtherParticipant = (conv) => conv.participants.find(p => p._id !== user.id);
  const getConversationName = (conv) => {
    if (conv.isGroup) return conv.groupName || 'Group Chat';
    return getOtherParticipant(conv)?.name || 'Unknown';
  };
  const getConversationPhoto = (conv) => {
    if (conv.isGroup) return conv.groupPhoto;
    return getOtherParticipant(conv)?.profilePhoto;
  };
  const isOnline = (conv) => {
    if (conv.isGroup) return false;
    const other = getOtherParticipant(conv);
    return other && onlineUsers.has(other._id);
  };

  const handlePin = async (convId, e) => {
    e.stopPropagation();
    try {
      const res = await API.put(`/conversations/${convId}/pin`);
      setConversations(prev => prev.map(c => c._id === convId ? { ...c, isPinned: res.data.isPinned } : c));
    } catch (err) { console.error('Failed'); }
    setMenuOpen(null);
  };

  const handleMute = async (convId, e) => {
    e.stopPropagation();
    try {
      const res = await API.put(`/conversations/${convId}/mute`);
      setConversations(prev => prev.map(c => c._id === convId ? { ...c, isMuted: res.data.isMuted } : c));
    } catch (err) { console.error('Failed'); }
    setMenuOpen(null);
  };

  const handleArchive = async (convId, e) => {
    e.stopPropagation();
    try {
      await API.put(`/conversations/${convId}/archive`);
      setConversations(prev => prev.filter(c => c._id !== convId));
    } catch (err) { console.error('Failed'); }
    setMenuOpen(null);
  };

  const filteredConversations = conversations
    .filter(c => {
      if (filter === 'unread') return !c.isRead;
      if (filter === 'groups') return c.isGroup;
      return true;
    })
    .filter(c => searchQuery ? getConversationName(c).toLowerCase().includes(searchQuery.toLowerCase()) : true)
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });

  const filteredFriends = friends.filter(f =>
    f.name.toLowerCase().includes(friendSearch.toLowerCase())
  );

  return (
    <div className={`bg-white border-r h-full flex flex-col ${className}`}>
      {/* New Chat Modal / Panel */}
      {showNewChat && (
        <div className="absolute inset-0 z-20 bg-white flex flex-col">
          <div className="p-3 border-b flex items-center gap-2">
            <button onClick={() => setShowNewChat(false)} className="text-gray-500 hover:text-gray-700">
              ←
            </button>
            <h3 className="font-semibold">New Chat</h3>
          </div>
          <div className="p-2">
            <input
              type="text"
              value={friendSearch}
              onChange={(e) => setFriendSearch(e.target.value)}
              placeholder="Search friends..."
              className="w-full px-3 py-2 text-sm border rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {friendsLoading ? (
              <div className="p-4 space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {friendSearch ? 'No friends match search' : 'No friends yet'}
              </div>
            ) : (
              filteredFriends.map(friend => (
                <button
                  key={friend._id}
                  onClick={() => startConversation(friend._id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition text-left"
                >
                  <img
                    src={friend.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'}
                    alt="" className="w-10 h-10 rounded-full object-cover"
                  />
                  <span className="font-medium text-sm">{friend.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <div className="p-3 md:p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg md:text-xl font-bold">Chats</h2>
          <button
            onClick={openNewChat}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 transition"
          >
            + New Chat
          </button>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search conversations..."
          className="w-full px-3 py-2 text-sm border rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <div className="flex gap-1 mt-2">
          {['all', 'unread', 'groups'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-2.5 py-1 text-xs rounded-full capitalize transition ${
                filter === f ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-100'
              }`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchQuery ? 'No matching conversations' : (
              <div>
                <p className="mb-2">No conversations yet</p>
                <button onClick={openNewChat} className="text-blue-600 hover:underline text-sm">
                  Start a new chat
                </button>
              </div>
            )}
          </div>
        ) : (
          filteredConversations.map(conv => (
            <div key={conv._id} className="relative group">
              <button
                onClick={() => onSelectConversation(conv)}
                className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition ${
                  activeConversation?._id === conv._id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={getConversationPhoto(conv) || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'}
                    alt="" className="w-12 h-12 rounded-full object-cover"
                  />
                  {isOnline(conv) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-sm truncate">{getConversationName(conv)}</span>
                    {conv.isPinned && <span className="text-xs text-gray-400">📌</span>}
                    {conv.isMuted && <span className="text-xs text-gray-400">🔇</span>}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{conv.lastMessage?.text || 'No messages yet'}</div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {conv.lastMessage && (
                    <span className="text-xs text-gray-400">
                      {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === conv._id ? null : conv._id); }}
                    className="p-2 text-gray-400 hover:text-gray-600 md:opacity-0 md:group-hover:opacity-100 rounded-full md:rounded transition-opacity"
                  >⋯</button>
                </div>
              </button>

              {menuOpen === conv._id && (
                <div className="absolute right-2 top-12 z-10 bg-white border rounded-lg shadow-lg py-1 min-w-[140px]">
                  <button onClick={(e) => handlePin(conv._id, e)}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50">
                    {conv.isPinned ? 'Unpin' : 'Pin to top'}
                  </button>
                  <button onClick={(e) => handleMute(conv._id, e)}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50">
                    {conv.isMuted ? 'Unmute' : 'Mute'}
                  </button>
                  <button onClick={(e) => handleArchive(conv._id, e)}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 text-red-600">
                    Archive
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
