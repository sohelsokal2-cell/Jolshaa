import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import API from '../api/axios';

const ChatSidebar = ({ activeConversation, onSelectConversation, className = '' }) => {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showNewChat, setShowNewChat] = useState(false);
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [groupName, setGroupName] = useState('');

  const fetchConversations = useCallback(async () => {
    try {
      const res = await API.get('/conversations');
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (!socket) return;

    const handleNewConversation = (conv) => {
      setConversations(prev => {
        const exists = prev.find(c => c._id === conv._id);
        if (exists) return prev;
        return [conv, ...prev];
      });
    };

    const handleNewMessage = (message) => {
      const convId = message.conversationId || message.conversation;
      setConversations(prev => {
        const idx = prev.findIndex(c => c._id === convId);
        if (idx === -1) return prev;
        const updated = [...prev];
        updated[idx] = { ...updated[idx], lastMessage: message, updatedAt: new Date() };
        if (message.sender?._id !== user.id) {
          updated[idx].unreadCount = (updated[idx].unreadCount || 0) + 1;
        }
        const [moved] = updated.splice(idx, 1);
        updated.unshift(moved);
        return updated;
      });
    };

    const handleMessagesSeen = ({ conversationId, userId }) => {
      if (userId === user.id) return;
      setConversations(prev => prev.map(c =>
        c._id === conversationId ? { ...c, unreadCount: 0 } : c
      ));
    };

    socket.on('newConversation', handleNewConversation);
    socket.on('newMessage', handleNewMessage);
    socket.on('messagesSeen', handleMessagesSeen);

    return () => {
      socket.off('newConversation', handleNewConversation);
      socket.off('newMessage', handleNewMessage);
      socket.off('messagesSeen', handleMessagesSeen);
    };
  }, [socket, user?.id]);

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

  const startGroupChat = async () => {
    if (selectedFriends.length < 2 || !groupName.trim()) return;
    try {
      const res = await API.post('/conversations', {
        participantIds: selectedFriends.map(f => f._id),
        groupName: groupName.trim(),
      });
      const conv = res.data;
      setConversations(prev => [conv, ...prev]);
      onSelectConversation(conv);
      setShowGroupModal(false);
      setSelectedFriends([]);
      setGroupName('');
    } catch (err) {
      console.error('Failed to create group');
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
    return other && (onlineUsers.has(other._id) || other.activeStatus === 'online');
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
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

  const handleDelete = async (convId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await API.delete(`/conversations/${convId}`);
      setConversations(prev => prev.filter(c => c._id !== convId));
      if (activeConversation?._id === convId) onSelectConversation(null);
    } catch (err) { console.error('Failed'); }
    setMenuOpen(null);
  };

  const filteredConversations = conversations
    .filter(c => {
      if (c.archivedBy?.some(id => id === user.id || id?._id === user.id)) return false;
      if (filter === 'unread') return (c.unreadCount || 0) > 0;
      if (filter === 'groups') return c.isGroup;
      return true;
    })
    .filter(c => searchQuery ? getConversationName(c).toLowerCase().includes(searchQuery.toLowerCase()) : true)
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });

  const filteredFriends = friends.filter(f =>
    f.name.toLowerCase().includes(friendSearch.toLowerCase())
  );

  return (
    <div className={`bg-white border-r h-full flex flex-col relative ${className}`}>
      {/* New Chat Panel */}
      {showNewChat && (
        <div className="absolute inset-0 z-20 bg-white flex flex-col">
          <div className="p-3 border-b flex items-center gap-2">
            <button onClick={() => setShowNewChat(false)} className="text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h3 className="font-semibold text-sm">New Message</h3>
            <button
              onClick={() => { setShowGroupModal(true); setShowNewChat(false); }}
              className="ml-auto text-xs text-blue-600 hover:underline"
            >
              Create Group
            </button>
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
              <div className="p-4 text-center text-gray-500 text-sm">
                {friendSearch ? 'No friends match' : 'No friends yet'}
              </div>
            ) : (
              filteredFriends.map(friend => (
                <button
                  key={friend._id}
                  onClick={() => startConversation(friend._id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition text-left"
                >
                  <div className="relative">
                    <img
                      src={friend.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'}
                      alt="" className="w-10 h-10 rounded-full object-cover"
                    />
                    {onlineUsers.has(friend._id) && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-sm block">{friend.name}</span>
                    <span className="text-xs text-gray-400">
                      {onlineUsers.has(friend._id) ? 'Active now' : ''}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Group Creation Modal */}
      {showGroupModal && (
        <div className="absolute inset-0 z-20 bg-white flex flex-col">
          <div className="p-3 border-b flex items-center gap-2">
            <button onClick={() => { setShowGroupModal(false); setShowNewChat(true); }} className="text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h3 className="font-semibold text-sm">New Group</h3>
          </div>
          <div className="p-3 border-b">
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
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
            {filteredFriends.map(friend => {
              const selected = selectedFriends.some(f => f._id === friend._id);
              return (
                <button
                  key={friend._id}
                  onClick={() => {
                    setSelectedFriends(prev =>
                      selected ? prev.filter(f => f._id !== friend._id) : [...prev, friend]
                    );
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition text-left"
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                  }`}>
                    {selected && <span className="text-white text-xs">&#10003;</span>}
                  </div>
                  <img
                    src={friend.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'}
                    alt="" className="w-10 h-10 rounded-full object-cover"
                  />
                  <span className="font-medium text-sm">{friend.name}</span>
                </button>
              );
            })}
          </div>
          {selectedFriends.length >= 2 && (
            <div className="p-3 border-t">
              <button
                onClick={startGroupChat}
                disabled={!groupName.trim()}
                className="w-full py-2 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 disabled:opacity-50 transition"
              >
                Create Group ({selectedFriends.length} members)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="p-3 md:p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg md:text-xl font-bold">Chats</h2>
          <button
            onClick={openNewChat}
            className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
            title="New message"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search"
          className="w-full px-3 py-2 text-sm bg-gray-100 rounded-full focus:outline-none focus:bg-gray-200 transition"
        />
        <div className="flex gap-1 mt-2">
          {['all', 'unread', 'groups'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs rounded-full capitalize transition ${
                filter === f ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-100'
              }`}>{f}</button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1,2,3,4,5].map(i => (
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
          <div className="p-4 text-center text-gray-500 text-sm">
            {searchQuery ? 'No matching conversations' : (
              <div>
                <p className="mb-2">No conversations yet</p>
                <button onClick={openNewChat} className="text-blue-600 hover:underline">
                  Start a conversation
                </button>
              </div>
            )}
          </div>
        ) : (
          filteredConversations.map(conv => {
            const isActive = activeConversation?._id === conv._id;
            const unread = conv.unreadCount || 0;
            const lastMsg = conv.lastMessage;

            return (
              <div key={conv._id} className="relative group">
                <button
                  onClick={() => onSelectConversation(conv)}
                  className={`w-full flex items-center gap-3 p-2.5 md:p-3 hover:bg-gray-50 transition ${
                    isActive ? 'bg-blue-50' : ''
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
                    <div className="flex items-center justify-between">
                      <span className={`text-sm truncate ${unread > 0 ? 'font-bold' : 'font-medium'}`}>
                        {getConversationName(conv)}
                      </span>
                      {lastMsg && (
                        <span className={`text-xs flex-shrink-0 ml-2 ${unread > 0 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                          {formatTime(lastMsg.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        {conv.isMuted && <span className="text-gray-400 text-xs">🔇</span>}
                        {conv.isPinned && <span className="text-gray-400 text-xs">📌</span>}
                        <span className={`text-xs truncate ${unread > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                          {lastMsg?.sender?._id === user.id && 'You: '}
                          {lastMsg?.deletedForEveryone ? 'Message deleted' :
                           lastMsg?.text ? lastMsg.text :
                           lastMsg?.mediaType === 'image' ? '📷 Photo' :
                           lastMsg?.mediaType === 'video' ? '🎬 Video' :
                           lastMsg?.mediaType === 'voice' ? '🎤 Voice message' :
                           lastMsg?.mediaType === 'audio' ? '🎵 Audio' :
                           lastMsg?.mediaType === 'file' ? '📎 File' :
                           'No messages yet'}
                        </span>
                      </div>
                      {unread > 0 && (
                        <span className="ml-2 bg-blue-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Context Menu Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === conv._id ? null : conv._id); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" /></svg>
                </button>

                {/* Context Menu */}
                {menuOpen === conv._id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                    <div className="absolute right-2 top-12 z-20 bg-white border rounded-xl shadow-xl py-1 min-w-[160px]">
                      <button onClick={(e) => handlePin(conv._id, e)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2">
                        <span>{conv.isPinned ? '📌' : '📍'}</span>
                        {conv.isPinned ? 'Unpin' : 'Pin to top'}
                      </button>
                      <button onClick={(e) => handleMute(conv._id, e)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2">
                        <span>{conv.isMuted ? '🔔' : '🔕'}</span>
                        {conv.isMuted ? 'Unmute' : 'Mute'}
                      </button>
                      <button onClick={(e) => handleArchive(conv._id, e)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2">
                        <span>📦</span>
                        Archive
                      </button>
                      <hr className="my-1" />
                      <button onClick={(e) => handleDelete(conv._id, e)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2">
                        <span>🗑</span>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
