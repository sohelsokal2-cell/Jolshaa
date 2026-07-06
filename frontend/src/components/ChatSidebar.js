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

  const fetchFriends = useCallback(async () => {
    if (!user?.id) return;
    setFriendsLoading(true);
    try {
      const res = await API.get(`/friends/${user.id}`);
      setFriends(res.data.friends);
    } catch (err) {
      console.error('Failed to fetch friends');
    } finally {
      setFriendsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchFriends(); }, [fetchFriends]);

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

  const conversationFriendIds = new Set(
    conversations.filter(c => !c.isGroup).map(c => getOtherParticipant(c)?._id).filter(Boolean)
  );

  const friendsWithoutConversation = filter === 'all'
    ? friends
        .filter(f => !conversationFriendIds.has(f._id))
        .filter(f => searchQuery ? f.name.toLowerCase().includes(searchQuery.toLowerCase()) : true)
    : [];

  return (
    <div className={`bg-jolshaa-surface-container-lowest border-r border-jolshaa-outline-variant h-full flex flex-col relative ${className}`}>
      {/* Group Creation Modal */}
      {showGroupModal && (
        <div className="absolute inset-0 z-20 bg-jolshaa-surface-container-lowest flex flex-col">
          <div className="p-3 border-b border-jolshaa-outline-variant flex items-center gap-2">
            <button onClick={() => setShowGroupModal(false)} className="text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h3 className="font-display font-semibold text-sm">New Group</h3>
          </div>
          <div className="p-3 border-b border-jolshaa-outline-variant">
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
              className="w-full px-3 py-2 text-sm border border-jolshaa-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-jolshaa-teal"
            />
          </div>
          <div className="p-2">
            <input
              type="text"
              value={friendSearch}
              onChange={(e) => setFriendSearch(e.target.value)}
              placeholder="Search friends..."
              className="w-full px-3 py-2 text-sm border border-jolshaa-outline-variant rounded-full focus:outline-none focus:ring-1 focus:ring-jolshaa-teal"
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
                  className="w-full flex items-center gap-3 p-3 hover:bg-jolshaa-surface-container-low transition text-left"
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selected ? 'bg-jolshaa-teal border-jolshaa-teal' : 'border-jolshaa-outline-variant'
                  }`}>
                    {selected && <span className="text-jolshaa-on-teal text-xs">&#10003;</span>}
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
            <div className="p-3 border-t border-jolshaa-outline-variant">
              <button
                onClick={startGroupChat}
                disabled={!groupName.trim()}
                className="w-full py-2 bg-jolshaa-teal text-jolshaa-on-teal text-sm rounded-full hover:bg-jolshaa-teal-container disabled:opacity-50 transition"
              >
                Create Group ({selectedFriends.length} members)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="p-3 md:p-4 border-b border-jolshaa-outline-variant">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg md:text-xl font-bold">Chats</h2>
          <button
            onClick={() => setShowGroupModal(true)}
            className="w-8 h-8 flex items-center justify-center text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container rounded-full transition"
            title="New group"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-2.5-7.13" /></svg>
          </button>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search"
          className="w-full px-3 py-2 text-sm bg-jolshaa-surface-container rounded-full focus:outline-none focus:bg-jolshaa-surface-container-high transition"
        />
        <div className="flex gap-2 mt-3">
          {['all', 'unread', 'groups'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 text-xs rounded-full capitalize font-medium transition ${
                filter === f ? 'bg-jolshaa-teal-container text-jolshaa-teal' : 'bg-jolshaa-surface-container text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container-high'
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
                <div className="w-12 h-12 bg-jolshaa-surface-container-high rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-jolshaa-surface-container-high rounded w-1/2" />
                  <div className="h-3 bg-jolshaa-surface-container-high rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 && friendsWithoutConversation.length === 0 ? (
          <div className="p-4 text-center text-jolshaa-on-surface-variant text-sm">
            {searchQuery ? 'No matching conversations' : 'No conversations yet'}
          </div>
        ) : (
          <>
          {filteredConversations.map(conv => {
            const isActive = activeConversation?._id === conv._id;
            const unread = conv.unreadCount || 0;
            const lastMsg = conv.lastMessage;

            return (
              <div key={conv._id} className="relative group">
                <button
                  onClick={() => onSelectConversation(conv)}
                  className={`w-full flex items-center gap-3 p-2.5 md:p-3 pl-2.5 md:pl-3 border-l-4 hover:bg-jolshaa-surface-container-low transition ${
                    isActive ? 'border-jolshaa-teal bg-jolshaa-surface-container' : 'border-transparent'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={getConversationPhoto(conv) || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'}
                      alt="" className="w-12 h-12 rounded-full object-cover"
                    />
                    {isOnline(conv) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-jolshaa-surface-container-lowest" />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm truncate ${unread > 0 ? 'font-bold' : 'font-medium'}`}>
                        {getConversationName(conv)}
                      </span>
                      {lastMsg && (
                        <span className={`text-xs flex-shrink-0 ml-2 ${unread > 0 ? 'text-jolshaa-teal font-medium' : 'text-jolshaa-on-surface-variant'}`}>
                          {formatTime(lastMsg.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        {conv.isMuted && <span className="text-jolshaa-on-surface-variant text-xs">🔇</span>}
                        {conv.isPinned && <span className="text-jolshaa-on-surface-variant text-xs">📌</span>}
                        <span className={`text-xs truncate ${unread > 0 ? 'text-jolshaa-on-surface font-medium' : 'text-jolshaa-on-surface-variant'}`}>
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
                        <span className="ml-2 bg-jolshaa-coral text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Context Menu Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === conv._id ? null : conv._id); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface-variant rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" /></svg>
                </button>

                {/* Context Menu */}
                {menuOpen === conv._id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                    <div className="absolute right-2 top-12 z-20 bg-jolshaa-surface-container-lowest border rounded-xl shadow-xl py-1 min-w-[160px]">
                      <button onClick={(e) => handlePin(conv._id, e)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-jolshaa-surface-container-low flex items-center gap-2">
                        <span>{conv.isPinned ? '📌' : '📍'}</span>
                        {conv.isPinned ? 'Unpin' : 'Pin to top'}
                      </button>
                      <button onClick={(e) => handleMute(conv._id, e)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-jolshaa-surface-container-low flex items-center gap-2">
                        <span>{conv.isMuted ? '🔔' : '🔕'}</span>
                        {conv.isMuted ? 'Unmute' : 'Mute'}
                      </button>
                      <button onClick={(e) => handleArchive(conv._id, e)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-jolshaa-surface-container-low flex items-center gap-2">
                        <span>📦</span>
                        Archive
                      </button>
                      <hr className="my-1" />
                      <button onClick={(e) => handleDelete(conv._id, e)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-jolshaa-surface-container-low text-red-600 flex items-center gap-2">
                        <span>🗑</span>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {friendsWithoutConversation.map(friend => (
            <button
              key={friend._id}
              onClick={() => startConversation(friend._id)}
              className="w-full flex items-center gap-3 p-2.5 md:p-3 pl-2.5 md:pl-3 border-l-4 border-transparent hover:bg-jolshaa-surface-container-low transition text-left"
            >
              <div className="relative flex-shrink-0">
                <img
                  src={friend.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'}
                  alt="" className="w-12 h-12 rounded-full object-cover"
                />
                {onlineUsers.has(friend._id) && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-jolshaa-surface-container-lowest" />
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <span className="text-sm font-medium truncate block">{friend.name}</span>
                <span className="text-xs text-jolshaa-on-surface-variant">
                  {onlineUsers.has(friend._id) ? 'Active now' : 'Friend · Say hello'}
                </span>
              </div>
            </button>
          ))}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
