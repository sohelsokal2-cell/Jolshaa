import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import API from '../api/axios';
import MediaGallery from './MediaGallery';

const InfoPanel = ({ conversation, onClose, onUpdateConversation }) => {
  const { user } = useAuth();
  const { onlineUsers } = useSocket();
  const [activeTab, setActiveTab] = useState('info');
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [loadingPinned, setLoadingPinned] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [groupName, setGroupName] = useState(conversation?.groupName || '');
  const [groupPhoto, setGroupPhoto] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [friends, setFriends] = useState([]);
  const [friendSearch, setFriendSearch] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [showMemberMenu, setShowMemberMenu] = useState(null);

  const isGroup = conversation?.isGroup;
  const isCreator = conversation?.createdBy?._id === user.id ||
    conversation?.admins?.some(a => (a._id || a) === user.id);
  const otherUser = !isGroup ? conversation?.participants?.find(p => p._id !== user.id) : null;

  useEffect(() => {
    if (activeTab === 'pinned') fetchPinnedMessages();
    if (showAddMembers && friends.length === 0) fetchFriends();
  }, [activeTab, showAddMembers, friends.length]);

  const fetchPinnedMessages = async () => {
    setLoadingPinned(true);
    try {
      const res = await API.get(`/conversations/${conversation._id}/pinned-messages`);
      setPinnedMessages(res.data.messages || []);
    } catch (err) { console.error('Failed'); }
    setLoadingPinned(false);
  };

  const fetchFriends = async () => {
    try {
      const res = await API.get(`/friends/${user.id}`);
      const memberIds = conversation.participants.map(p => p._id);
      setFriends(res.data.friends.filter(f => !memberIds.includes(f._id)));
    } catch (err) { console.error('Failed'); }
  };

  const handleUpdateGroupName = async () => {
    if (!groupName.trim()) return;
    try {
      await API.put(`/conversations/${conversation._id}`, { groupName: groupName.trim() });
      onUpdateConversation?.({ ...conversation, groupName: groupName.trim() });
      setShowEditGroup(false);
    } catch (err) { alert('Failed to update'); }
  };

  const handleUpdateGroupPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('groupPhoto', file);
    try {
      const res = await API.put(`/conversations/${conversation._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUpdateConversation?.(res.data);
    } catch (err) { alert('Failed to upload'); }
    setUploadingPhoto(false);
  };

  const handleAddMembers = async () => {
    if (selectedFriends.length === 0) return;
    try {
      const res = await API.post(`/conversations/${conversation._id}/members`, {
        userIds: selectedFriends.map(f => f._id),
      });
      onUpdateConversation?.(res.data);
      setShowAddMembers(false);
      setSelectedFriends([]);
    } catch (err) { alert('Failed to add members'); }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      const res = await API.delete(`/conversations/${conversation._id}/members/${memberId}`);
      onUpdateConversation?.(res.data);
      setShowMemberMenu(null);
    } catch (err) { alert('Failed to remove'); }
  };

  const handleToggleAdmin = async (memberId) => {
    const isAdmin = conversation.admins?.some(a => (a._id || a) === memberId);
    try {
      if (isAdmin) {
        await API.delete(`/conversations/${conversation._id}/admins/${memberId}`);
      } else {
        await API.post(`/conversations/${conversation._id}/admins`, { userId: memberId });
      }
      setShowMemberMenu(null);
    } catch (err) { alert('Failed'); }
  };

  const handleMute = async () => {
    try {
      const res = await API.put(`/conversations/${conversation._id}/mute`);
      onUpdateConversation?.({ ...conversation, isMuted: res.data.isMuted });
    } catch (err) { console.error('Failed'); }
  };

  const handlePin = async () => {
    try {
      const res = await API.put(`/conversations/${conversation._id}/pin`);
      onUpdateConversation?.({ ...conversation, isPinned: res.data.isPinned });
    } catch (err) { console.error('Failed'); }
  };

  const handleArchive = async () => {
    try {
      await API.put(`/conversations/${conversation._id}/archive`);
      onClose?.();
    } catch (err) { console.error('Failed'); }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Leave this group?')) return;
    try {
      await API.delete(`/conversations/${conversation._id}/members/${user.id}`);
      onClose?.();
    } catch (err) { alert('Failed to leave'); }
  };

  const handleDeleteConversation = async () => {
    if (!window.confirm('Delete this conversation? You will not see it anymore.')) return;
    try {
      await API.delete(`/conversations/${conversation._id}`);
      onClose?.();
    } catch (err) { alert('Failed'); }
  };

  const getMemberStatus = (member) => {
    if (onlineUsers.has(member._id)) return 'Active now';
    if (member.activeStatus === 'online') return 'Active now';
    if (member.activeStatus === 'away') return 'Away';
    if (member.activeStatus === 'busy') return 'Busy';
    if (member.lastSeen) {
      const diff = Date.now() - new Date(member.lastSeen).getTime();
      if (diff < 60000) return 'Just now';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
      return new Date(member.lastSeen).toLocaleDateString();
    }
    return 'Offline';
  };

  const filteredFriends = friends.filter(f =>
    f.name.toLowerCase().includes(friendSearch.toLowerCase())
  );

  if (!conversation) return null;

  return (
    <div className="w-80 border-l border-jolshaa-outline-variant bg-jolshaa-surface-container-lowest h-full flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="p-3 border-b border-jolshaa-outline-variant flex items-center justify-between">
        <button onClick={onClose} className="p-1 text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <h3 className="font-display font-semibold text-sm">
          {isGroup ? 'Group Info' : 'Conversation Info'}
        </h3>
        <div className="w-7" />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-jolshaa-outline-variant">
        {['info', 'media', 'pinned'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-xs font-medium capitalize transition ${
              activeTab === tab ? 'text-jolshaa-teal border-b-2 border-jolshaa-teal' : 'text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container-low'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* INFO TAB */}
        {activeTab === 'info' && (
          <div className="p-4 space-y-4">
            {/* Profile photo + name */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-2">
                <img
                  src={isGroup
                    ? conversation.groupPhoto || 'https://ui-avatars.com/api/?name=G&background=494454&color=dae2fd&size=128'
                    : otherUser?.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'}
                  alt="" className="w-20 h-20 rounded-full object-cover"
                />
                {!isGroup && onlineUsers.has(otherUser?._id) && (
                  <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-jolshaa-surface-container-lowest" />
                )}
              </div>
              {isGroup ? (
                <>
                  {showEditGroup ? (
                    <div className="space-y-2 w-full">
                      <input type="text" value={groupName} onChange={e => setGroupName(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-jolshaa-teal" />
                      <div className="flex gap-2">
                        <button onClick={handleUpdateGroupName}
                          className="flex-1 py-1.5 bg-jolshaa-teal text-jolshaa-on-teal text-xs rounded-lg hover:bg-jolshaa-teal-container">Save</button>
                        <button onClick={() => setShowEditGroup(false)}
                          className="flex-1 py-1.5 bg-jolshaa-surface-container text-jolshaa-on-surface-variant text-xs rounded-lg hover:bg-jolshaa-surface-container-high">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="font-display font-semibold">{conversation.groupName || 'Group Chat'}</h4>
                      <p className="text-xs text-jolshaa-on-surface-variant">{conversation.participants?.length} members</p>
                      {isCreator && (
                        <button onClick={() => { setGroupName(conversation.groupName || ''); setShowEditGroup(true); }}
                          className="text-xs text-jolshaa-teal hover:underline mt-1">Edit group name</button>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  <h4 className="font-display font-semibold">{otherUser?.name}</h4>
                  <p className="text-xs text-jolshaa-on-surface-variant">{getMemberStatus(otherUser)}</p>
                </>
              )}
            </div>

            {/* Group management (admin only) */}
            {isGroup && isCreator && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-jolshaa-on-surface-variant uppercase tracking-wide">Group Management</label>

                {/* Group photo upload */}
                <div className="flex items-center gap-3">
                  <label className="flex-1 flex items-center gap-2 px-3 py-2 text-sm bg-jolshaa-surface-container-low rounded-lg hover:bg-jolshaa-surface-container cursor-pointer transition">
                    <svg className="w-4 h-4 text-jolshaa-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {uploadingPhoto ? 'Uploading...' : 'Change photo'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleUpdateGroupPhoto} />
                  </label>
                </div>

                {/* Add members */}
                <button onClick={() => setShowAddMembers(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-jolshaa-surface-container-low rounded-lg hover:bg-jolshaa-surface-container transition">
                  <svg className="w-4 h-4 text-jolshaa-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                  Add members
                </button>
              </div>
            )}

            {/* Members list */}
            {isGroup && (
              <div>
                <label className="text-xs font-medium text-jolshaa-on-surface-variant uppercase tracking-wide block mb-2">
                  Members ({conversation.participants?.length})
                </label>
                <div className="space-y-1">
                  {conversation.participants?.map(member => {
                    const isAdmin = conversation.admins?.some(a => (a._id || a) === member._id);
                    return (
                      <div key={member._id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-jolshaa-surface-container-low group relative">
                        <div className="relative">
                          <img src={member.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'}
                            alt="" className="w-9 h-9 rounded-full object-cover" />
                          {onlineUsers.has(member._id) && (
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-jolshaa-surface-container-lowest" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium truncate">{member.name}</span>
                            {member._id === user.id && <span className="text-xs text-jolshaa-on-surface-variant">(You)</span>}
                            {isAdmin && <span className="text-xs bg-jolshaa-teal/20 text-jolshaa-teal px-1.5 rounded">Admin</span>}
                          </div>
                          <span className="text-xs text-jolshaa-on-surface-variant">{getMemberStatus(member)}</span>
                        </div>
                        {isCreator && member._id !== user.id && (
                          <button onClick={() => setShowMemberMenu(showMemberMenu === member._id ? null : member._id)}
                            className="p-1 text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface-variant opacity-0 group-hover:opacity-100">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" /></svg>
                          </button>
                        )}
                        {showMemberMenu === member._id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowMemberMenu(null)} />
                            <div className="absolute right-0 top-10 z-20 bg-jolshaa-surface-container-lowest border rounded-xl shadow-xl py-1 min-w-[140px]">
                              <button onClick={() => handleToggleAdmin(member._id)}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-jolshaa-surface-container-low">
                                {isAdmin ? 'Remove admin' : 'Make admin'}
                              </button>
                              <button onClick={() => handleRemoveMember(member._id)}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-jolshaa-surface-container-low text-red-600">
                                Remove from group
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-jolshaa-on-surface-variant uppercase tracking-wide">Actions</label>
              <button onClick={handleMute}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-jolshaa-surface-container-low rounded-lg hover:bg-jolshaa-surface-container transition">
                {conversation.isMuted ? '🔔 Unmute' : '🔕 Mute'}
              </button>
              <button onClick={handlePin}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-jolshaa-surface-container-low rounded-lg hover:bg-jolshaa-surface-container transition">
                {conversation.isPinned ? '📍 Unpin' : '📌 Pin to top'}
              </button>
              <button onClick={handleArchive}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-jolshaa-surface-container-low rounded-lg hover:bg-jolshaa-surface-container transition">
                📦 Archive
              </button>
              {isGroup && !isCreator && (
                <button onClick={handleLeaveGroup}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">
                  Leave group
                </button>
              )}
              {!isGroup && (
                <button onClick={handleDeleteConversation}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">
                  🗑 Delete conversation
                </button>
              )}
            </div>
          </div>
        )}

        {/* MEDIA TAB */}
        {activeTab === 'media' && (
          <MediaGallery conversationId={conversation._id} />
        )}

        {/* PINNED TAB */}
        {activeTab === 'pinned' && (
          <div className="p-4">
            {loadingPinned ? (
              <div className="text-center py-8 text-jolshaa-on-surface-variant">
                <div className="w-6 h-6 border-2 border-jolshaa-teal border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : pinnedMessages.length === 0 ? (
              <div className="text-center py-8 text-jolshaa-on-surface-variant">
                <p className="text-sm">No pinned messages</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pinnedMessages.map(msg => (
                  <div key={msg._id} className="p-3 bg-jolshaa-surface-container-low rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <img src={msg.sender?.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'}
                        alt="" className="w-6 h-6 rounded-full" />
                      <span className="text-xs font-medium">{msg.sender?.name}</span>
                      <span className="text-xs text-jolshaa-on-surface-variant">{new Date(msg.pinnedAt || msg.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-jolshaa-on-surface">{msg.text}</p>
                    {msg.media && <p className="text-xs text-jolshaa-on-surface-variant mt-1">📎 Media</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Members Modal */}
      {showAddMembers && (
        <>
          <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setShowAddMembers(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 bg-jolshaa-surface-container-lowest rounded-2xl shadow-2xl w-80 max-h-[70vh] flex flex-col">
            <div className="p-4 border-b border-jolshaa-outline-variant flex items-center justify-between">
              <h3 className="font-display font-bold text-sm">Add Members</h3>
              <button onClick={() => setShowAddMembers(false)} className="text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface-variant">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-2">
              <input type="text" value={friendSearch} onChange={e => setFriendSearch(e.target.value)}
                placeholder="Search friends..." className="w-full px-3 py-2 text-sm bg-jolshaa-surface-container rounded-full focus:outline-none" />
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredFriends.map(friend => {
                const selected = selectedFriends.some(f => f._id === friend._id);
                return (
                  <button key={friend._id}
                    onClick={() => setSelectedFriends(prev =>
                      selected ? prev.filter(f => f._id !== friend._id) : [...prev, friend]
                    )}
                    className="w-full flex items-center gap-3 p-3 hover:bg-jolshaa-surface-container-low transition text-left">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selected ? 'bg-jolshaa-teal border-jolshaa-teal' : 'border-jolshaa-outline-variant'
                    }`}>
                      {selected && <span className="text-jolshaa-on-teal text-xs">&#10003;</span>}
                    </div>
                    <img src={friend.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'}
                      alt="" className="w-9 h-9 rounded-full object-cover" />
                    <span className="text-sm font-medium">{friend.name}</span>
                  </button>
                );
              })}
            </div>
            {selectedFriends.length > 0 && (
              <div className="p-3 border-t border-jolshaa-outline-variant">
                <button onClick={handleAddMembers}
                  className="w-full py-2 bg-jolshaa-teal text-jolshaa-on-teal text-sm rounded-full hover:bg-jolshaa-teal-container transition">
                  Add {selectedFriends.length} member{selectedFriends.length > 1 ? 's' : ''}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default InfoPanel;
