import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import API from '../api/axios';
import VoiceRecorder from './VoiceRecorder';
import CallButtons from './CallButtons';

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (date) => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
};

const shouldShowDateSeparator = (curr, prev) => {
  if (!prev) return true;
  const c = new Date(curr);
  const p = new Date(prev);
  return c.toDateString() !== p.toDateString();
};

const shouldShowSender = (msg, prevMsg, isGroup) => {
  if (!isGroup) return false;
  if (!prevMsg) return true;
  if (prevMsg.sender?._id !== msg.sender?._id) return true;
  const timeDiff = new Date(msg.createdAt) - new Date(prevMsg.createdAt);
  return timeDiff > 60000;
};

const isWithinEditWindow = (date) => {
  return Date.now() - new Date(date).getTime() < 15 * 60 * 1000;
};

const isWithinDeleteWindow = (date) => {
  return Date.now() - new Date(date).getTime() < 10 * 60 * 1000;
};

const ChatWindow = ({ conversation, onBack, showInfoPanel, onToggleInfo, onStartCall, callStatus }) => {
  const { user } = useAuth();
  const { socket, onlineUsers, setActiveChat, clearUnreadMessages } = useSocket();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [editText, setEditText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [forwardMsg, setForwardMsg] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardConversations, setForwardConversations] = useState([]);
  const [selectedForwardConvs, setSelectedForwardConvs] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showMediaPreview, setShowMediaPreview] = useState(null);
  const [previewImages, setPreviewImages] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const convData = typeof conversation === 'object' ? conversation : null;
  const convId = typeof conversation === 'string' ? conversation : conversation?._id;

  // Fetch messages
  const fetchMessages = useCallback(async (before = null) => {
    if (!convId) return;
    try {
      if (before) setLoadingMore(true);
      const params = before ? `?before=${before}&limit=50` : '?limit=50';
      const callParams = before ? `?before=${before}&limit=50` : '?limit=50';
      const [msgRes, callRes] = await Promise.all([
        API.get(`/conversations/${convId}/messages${params}`),
        API.get(`/conversations/${convId}/call-logs${callParams}`).catch(() => ({ data: { logs: [] } })),
      ]);

      const newMessages = (msgRes.data.messages || []).map(m => ({ ...m, _type: 'message' }));
      const callLogs = (callRes.data.logs || []).map(cl => ({
        ...cl,
        _type: 'callLog',
        createdAt: cl.createdAt,
      }));

      // Merge and sort by date
      const merged = [...newMessages, ...callLogs].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );

      if (before) {
        setMessages(prev => [...merged, ...prev]);
        setHasMore(newMessages.length === 50);
      } else {
        setMessages(merged);
        setHasMore(newMessages.length === 50);
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (err) {
      console.error('Failed to fetch messages');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [convId]);

  useEffect(() => {
    if (!convId) return;
    setLoading(true);
    setMessages([]);
    setHasMore(true);
    setSelectedMsg(null);
    setReplyTo(null);
    setEditingMsg(null);
    fetchMessages();
    socket?.emit('joinConversation', convId);
    setActiveChat?.(convId);
    clearUnreadMessages?.();

    // Mark as seen
    API.put(`/messages/seen/${convId}`).catch(() => {});

    return () => {
      socket?.emit('leaveConversation', convId);
      setActiveChat?.(null);
    };
  }, [convId, socket, fetchMessages]);

  // Socket events
  useEffect(() => {
    if (!socket || !convId) return;

    const handleNewMessage = (message) => {
      const msgConvId = message.conversationId || message.conversation;
      if (msgConvId === convId) {
        setMessages(prev => {
          if (prev.find(m => m._id === message._id)) return prev;
          return [...prev, message];
        });
        setTimeout(() => scrollToBottom(), 50);
        API.put(`/messages/seen/${convId}`).catch(() => {});
      }
    };

    const handleTyping = ({ conversationId, userId, userName }) => {
      if (conversationId === convId && userId !== user.id) {
        setTypingUsers(prev => {
          if (prev.find(u => u.userId === userId)) return prev;
          return [...prev, { userId, userName }];
        });
      }
    };

    const handleStopTyping = ({ conversationId, userId }) => {
      if (conversationId === convId) {
        setTypingUsers(prev => prev.filter(u => u.userId !== userId));
      }
    };

    const handleMessageEdited = ({ messageId, text: newText }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, text: newText, isEdited: true } : m));
    };

    const handleMessageDeleted = ({ messageId, deletedForEveryone }) => {
      if (deletedForEveryone) {
        setMessages(prev => prev.map(m => m._id === messageId ? { ...m, text: '', media: null, deletedForEveryone: true, isDeleted: true } : m));
      } else {
        setMessages(prev => prev.filter(m => m._id !== messageId));
      }
    };

    const handleMessageReaction = ({ messageId, reactions }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions } : m));
    };

    const handleMessagesSeen = ({ userId }) => {
      if (userId !== user.id) {
        setMessages(prev => prev.map(m => ({ ...m, readBy: [...(m.readBy || []), userId] })));
      }
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('typing', handleTyping);
    socket.on('stopTyping', handleStopTyping);
    socket.on('messageEdited', handleMessageEdited);
    socket.on('messageDeleted', handleMessageDeleted);
    socket.on('messageReaction', handleMessageReaction);
    socket.on('messagesSeen', handleMessagesSeen);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('typing', handleTyping);
      socket.off('stopTyping', handleStopTyping);
      socket.off('messageEdited', handleMessageEdited);
      socket.off('messageDeleted', handleMessageDeleted);
      socket.off('messageReaction', handleMessageReaction);
      socket.off('messagesSeen', handleMessagesSeen);
    };
  }, [socket, convId, user?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore && messages.length > 0) {
      fetchMessages(messages[0].createdAt);
    }
  };

  // Scroll detection for load more
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      if (container.scrollTop < 100) handleLoadMore();
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, messages]);

  // Send message
  const handleSend = () => {
    if (!text.trim() || !convId) return;
    const payload = {
      conversationId: convId,
      text: text.trim(),
    };
    if (replyTo) {
      payload.replyTo = replyTo._id;
    }
    socket?.emit('sendMessage', payload);
    setText('');
    setReplyTo(null);
    socket?.emit('stopTyping', { conversationId: convId });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTypingEmit = () => {
    socket?.emit('typing', { conversationId: convId, userName: user.name });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit('stopTyping', { conversationId: convId });
    }, 2000);
  };

  // File upload
  const handleFileUpload = async (e, type = 'file') => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = type === 'video' ? MAX_VIDEO_SIZE : MAX_FILE_SIZE;
    if (file.size > maxSize) {
      alert(`File must be under ${type === 'video' ? '100MB' : '25MB'}`);
      return;
    }

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('media', file);
    formData.append('conversationId', convId);
    if (replyTo) formData.append('replyTo', replyTo._id);

    try {
      await API.post('/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setReplyTo(null);
    } catch (err) {
      console.error('Failed to upload file');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  // Edit message
  const handleEditMessage = async (msg) => {
    if (!editText.trim() || editText === msg.text) { setEditingMsg(null); return; }
    try {
      await API.put(`/messages/${msg._id}/edit`, { text: editText.trim() });
      setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, text: editText.trim(), isEdited: true } : m));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to edit');
    }
    setEditingMsg(null);
    setEditText('');
  };

  // Delete message
  const handleDeleteMessage = async (msgId, deleteForEveryone = false) => {
    try {
      await API.delete(`/messages/${msgId}`, { data: { deleteForEveryone } });
      if (deleteForEveryone) {
        setMessages(prev => prev.map(m => m._id === msgId ? { ...m, text: '', media: null, deletedForEveryone: true, isDeleted: true } : m));
      } else {
        setMessages(prev => prev.filter(m => m._id !== msgId));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
    setShowDeleteModal(null);
  };

  // React to message
  const handleReaction = async (msgId, emoji) => {
    try {
      const res = await API.put(`/messages/${msgId}/react`, { emoji });
      setMessages(prev => prev.map(m => m._id === msgId ? { ...m, reactions: res.data.reactions } : m));
    } catch (err) {
      console.error('Failed to react');
    }
    setShowEmojiPicker(null);
  };

  // Pin message
  const handlePinMessage = async (msgId) => {
    try {
      await API.put(`/messages/${msgId}/pin`);
      setMessages(prev => prev.map(m => m._id === msgId ? { ...m, isPinned: !m.isPinned } : m));
    } catch (err) {
      console.error('Failed to pin');
    }
    setSelectedMsg(null);
  };

  // Forward message
  const openForwardModal = async (msg) => {
    setForwardMsg(msg);
    setSelectedForwardConvs([]);
    try {
      const res = await API.get('/conversations');
      setForwardConversations(res.data);
    } catch (err) { console.error('Failed'); }
    setShowForwardModal(true);
    setSelectedMsg(null);
  };

  const handleForward = async () => {
    if (!forwardMsg || selectedForwardConvs.length === 0) return;
    try {
      await API.post('/messages/forward', {
        messageIds: [forwardMsg._id],
        targetConversationIds: selectedForwardConvs,
      });
      setShowForwardModal(false);
      setForwardMsg(null);
      setSelectedForwardConvs([]);
    } catch (err) {
      alert('Failed to forward');
    }
  };

  // Get conversation info
  const getOtherParticipant = () => convData?.participants?.find(p => p._id !== user.id);
  const getHeaderName = () => {
    if (convData?.isGroup) return convData.groupName || 'Group Chat';
    return getOtherParticipant()?.name || 'Unknown';
  };
  const getHeaderPhoto = () => {
    if (convData?.isGroup) return convData.groupPhoto;
    return getOtherParticipant()?.profilePhoto;
  };
  const isOnlineUser = () => {
    if (convData?.isGroup) return false;
    const other = getOtherParticipant();
    return other && (onlineUsers.has(other._id) || other.activeStatus === 'online');
  };

  if (!convId) {
    return (
      <div className="flex-1 flex items-center justify-center text-jolshaa-on-surface-variant">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-lg font-medium">Select a conversation</p>
          <p className="text-sm text-jolshaa-on-surface-variant">Choose from your existing chats or start a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-jolshaa-surface-container-lowest">
      {/* Header */}
      <div className="px-3 py-2 border-b bg-jolshaa-surface-container-lowest flex items-center gap-3 flex-shrink-0">
        {onBack && (
          <button onClick={onBack} className="p-1 -ml-1 text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface md:hidden">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
        )}
        <div className="relative">
          <img
            src={getHeaderPhoto() || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'}
            alt="" className="w-10 h-10 rounded-full object-cover"
          />
          {isOnlineUser() && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-jolshaa-surface-container-lowest" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-sm truncate">{getHeaderName()}</h3>
          {typingUsers.length > 0 ? (
            <p className="text-xs text-green-500 truncate">
              {typingUsers.map(u => u.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </p>
          ) : isOnlineUser() ? (
            <p className="text-xs text-green-500">Active now</p>
          ) : convData?.isGroup ? (
            <p className="text-xs text-jolshaa-on-surface-variant">{convData.participants?.length} members</p>
          ) : null}
        </div>
        <CallButtons
          onStartCall={(type) => {
            const other = getOtherParticipant();
            onStartCall?.(other?._id, type, convId, {
              name: other?.name,
              profilePhoto: other?.profilePhoto,
            });
          }}
          disabled={callStatus !== 'idle'}
          isGroup={convData?.isGroup}
        />
        <button
          onClick={onToggleInfo}
          className={`p-2 rounded-full transition ${showInfoPanel ? 'bg-jolshaa-teal/20 text-jolshaa-teal' : 'text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </button>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-jolshaa-on-surface-variant">
              <div className="w-8 h-8 border-4 border-jolshaa-teal border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading messages...
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-jolshaa-on-surface-variant">
              <div className="text-4xl mb-2">👋</div>
              <p className="font-medium">No messages yet</p>
              <p className="text-sm text-jolshaa-on-surface-variant">Say hello to start the conversation!</p>
            </div>
          </div>
        ) : (
          <>
            {loadingMore && (
              <div className="text-center py-2">
                <div className="w-6 h-6 border-2 border-jolshaa-teal border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            )}
            {messages.map((msg, idx) => {
              const prevMsg = idx > 0 ? messages[idx - 1] : null;
              const nextMsg = idx < messages.length - 1 ? messages[idx + 1] : null;
              const showDate = shouldShowDateSeparator(msg.createdAt, prevMsg?.createdAt);

              // Call log system message
              if (msg._type === 'callLog') {
                const callDuration = msg.duration || 0;
                const mins = Math.floor(callDuration / 60);
                const secs = callDuration % 60;
                const durationStr = callDuration > 0 ? ` (${mins > 0 ? mins + 'm ' : ''}${secs}s)` : '';

                let statusText = '';
                let statusIcon = null;
                const iconClass = 'w-3.5 h-3.5';

                if (msg.status === 'completed') {
                  if (msg.callType === 'video') {
                    statusIcon = <svg className={`${iconClass} text-green-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
                    statusText = 'Video call' + durationStr;
                  } else {
                    statusIcon = <svg className={`${iconClass} text-green-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
                    statusText = 'Audio call' + durationStr;
                  }
                } else if (msg.status === 'missed') {
                  statusIcon = <svg className={`${iconClass} text-red-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
                  statusText = 'Missed call';
                } else if (msg.status === 'rejected') {
                  statusIcon = <svg className={`${iconClass} text-red-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
                  statusText = 'Declined call';
                } else if (msg.status === 'cancelled') {
                  statusIcon = <svg className={`${iconClass} text-jolshaa-on-surface-variant`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
                  statusText = 'Call cancelled';
                } else {
                  statusIcon = <svg className={`${iconClass} text-jolshaa-on-surface-variant`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
                  statusText = 'Call ended';
                }

                return (
                  <div key={msg._id}>
                    {showDate && (
                      <div className="flex items-center justify-center my-4">
                        <div className="bg-jolshaa-surface-container text-jolshaa-on-surface-variant text-xs px-3 py-1 rounded-full font-medium">
                          {formatDate(msg.createdAt)}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-center my-2">
                      <div className="flex items-center gap-1.5 text-xs text-jolshaa-on-surface-variant bg-jolshaa-surface-container-low px-3 py-1 rounded-full">
                        {statusIcon}
                        <span>{statusText}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              // Regular message
              const isOwn = msg.sender?._id === user.id;
              const showSenderName = shouldShowSender(msg, prevMsg, convData?.isGroup);
              const isLastInGroup = !nextMsg || nextMsg.sender?._id !== msg.sender?._id;
              const isEditing = editingMsg?._id === msg._id;
              const reactions = msg.reactions || [];
              const isDeleted = msg.deletedForEveryone;

              return (
                <div key={msg._id}>
                  {/* Date separator */}
                  {showDate && (
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-jolshaa-surface-container text-jolshaa-on-surface-variant text-xs px-3 py-1 rounded-full font-medium">
                        {formatDate(msg.createdAt)}
                      </div>
                    </div>
                  )}

                  {/* Deleted message */}
                  {isDeleted ? (
                    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
                      <div className={`px-4 py-2 rounded-2xl text-sm italic ${
                        isOwn ? 'bg-jolshaa-surface-container text-jolshaa-on-surface-variant' : 'bg-jolshaa-surface-container-low text-jolshaa-on-surface-variant'
                      }`}>
                        This message was deleted
                      </div>
                    </div>
                  ) : (
                    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isLastInGroup ? 'mb-3' : 'mb-0.5'}`}>
                      <div className={`max-w-[75%] lg:max-w-[50%] relative group ${isOwn ? 'order-2' : ''}`}>
                        {/* Sender name (group) */}
                        {showSenderName && !isOwn && (
                          <div className="flex items-center gap-1.5 mb-1 ml-1">
                            <img
                              src={msg.sender?.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'}
                              alt="" className="w-6 h-6 rounded-full object-cover"
                            />
                            <span className="text-xs font-medium text-jolshaa-on-surface-variant">{msg.sender?.name}</span>
                          </div>
                        )}

                        {/* Reply preview */}
                        {msg.replyTo && (
                          <div className={`px-3 py-1.5 mb-0.5 rounded-t-2xl text-xs border-l-2 ${
                            isOwn ? 'bg-jolshaa-teal/10 border-jolshaa-teal/40' : 'bg-jolshaa-surface-container-low border-jolshaa-outline-variant'
                          }`}>
                            <p className="font-medium text-jolshaa-on-surface-variant truncate">{msg.replyTo.sender?.name || 'Message'}</p>
                            <p className="text-jolshaa-on-surface-variant truncate">{msg.replyTo.text || 'Media'}</p>
                          </div>
                        )}

                        {/* Forwarded indicator */}
                        {msg.forwardedFrom && (
                          <div className={`text-xs text-jolshaa-on-surface-variant mb-0.5 ${isOwn ? 'text-right' : 'ml-1'}`}>
                            ↪ Forwarded
                          </div>
                        )}

                        {/* Message bubble */}
                        {isEditing ? (
                          <div className="flex gap-1 p-1 bg-jolshaa-surface-container-lowest border rounded-2xl shadow-sm">
                            <input
                              type="text" value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleEditMessage(msg);
                                if (e.key === 'Escape') setEditingMsg(null);
                              }}
                              className="flex-1 px-3 py-1.5 text-sm border rounded-full focus:outline-none focus:ring-1 focus:ring-jolshaa-teal"
                              autoFocus
                            />
                            <button onClick={() => handleEditMessage(msg)} className="p-2 text-jolshaa-teal hover:bg-jolshaa-teal/10 rounded-full">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </button>
                            <button onClick={() => setEditingMsg(null)} className="p-2 text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container-low rounded-full">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ) : (
                          <div className={`px-3.5 py-2 rounded-2xl ${
                            isOwn
                              ? 'bg-jolshaa-teal text-jolshaa-on-teal' + (isLastInGroup ? ' rounded-br-sm' : '')
                              : 'bg-jolshaa-surface-container-high text-jolshaa-on-surface' + (isLastInGroup ? ' rounded-bl-sm' : '')
                          }`}>
                            {msg.text && <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>}
                            {msg.media && msg.mediaType === 'image' && (
                              <img src={msg.media} alt="" className="mt-1 rounded-lg max-w-full max-h-64 object-cover cursor-pointer"
                                onClick={() => setShowMediaPreview({ type: 'image', url: msg.media })} />
                            )}
                            {msg.media && msg.mediaType === 'video' && (
                              <video src={msg.media} controls className="mt-1 rounded-lg max-w-full max-h-64" />
                            )}
                            {msg.media && msg.mediaType === 'voice' && (
                              <div className="flex items-center gap-2 mt-1">
                                <audio src={msg.media} controls className="h-8 flex-1" />
                                {msg.voiceDuration && (
                                  <span className="text-xs opacity-70">{Math.floor(msg.voiceDuration / 60)}:{(msg.voiceDuration % 60).toString().padStart(2, '0')}</span>
                                )}
                              </div>
                            )}
                            {msg.media && msg.mediaType === 'audio' && (
                              <audio src={msg.media} controls className="mt-1 h-8 w-full" />
                            )}
                            {msg.media && msg.mediaType === 'file' && (
                              <a href={msg.media} target="_blank" rel="noopener noreferrer"
                                className={`flex items-center gap-2 mt-1 p-2 rounded-lg ${isOwn ? 'bg-jolshaa-teal-container hover:bg-jolshaa-teal-container' : 'bg-jolshaa-surface-container-high hover:bg-jolshaa-outline-variant'} transition`}>
                                <span className="text-lg">📎</span>
                                <span className="text-sm truncate">{msg.fileName || 'File'}</span>
                              </a>
                            )}
                          </div>
                        )}

                        {/* Reactions */}
                        {reactions.length > 0 && !isDeleted && (
                          <div className={`flex flex-wrap gap-0.5 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            {[...new Set(reactions.map(r => r.emoji))].map(emoji => {
                              const count = reactions.filter(r => r.emoji === emoji).length;
                              const iReacted = reactions.some(r => r.user === user.id || r.user?._id === user.id);
                              return (
                                <button key={emoji}
                                  onClick={() => handleReaction(msg._id, emoji)}
                                  className={`text-xs border rounded-full px-1.5 py-0.5 flex items-center gap-0.5 transition ${
                                    iReacted ? 'bg-jolshaa-teal/10 border-jolshaa-teal/30' : 'bg-jolshaa-surface-container-lowest border-jolshaa-outline-variant hover:bg-jolshaa-surface-container-low'
                                  }`}>
                                  <span>{emoji}</span>
                                  {count > 1 && <span className="text-jolshaa-on-surface-variant">{count}</span>}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Timestamp & read receipts */}
                        {isLastInGroup && (
                          <div className={`text-[10px] text-jolshaa-on-surface-variant mt-0.5 flex items-center gap-1 ${isOwn ? 'justify-end mr-1' : 'ml-1'}`}>
                            <span>{formatTime(msg.createdAt)}</span>
                            {msg.isEdited && <span className="italic">(edited)</span>}
                            {isOwn && (
                              msg.readBy?.length > 1
                                ? <span className="text-jolshaa-teal">✓✓</span>
                                : <span className="text-jolshaa-on-surface-variant">✓</span>
                            )}
                          </div>
                        )}

                        {/* Action buttons (hover) */}
                        {!isEditing && !isDeleted && (
                          <div
                            className={`absolute top-0 -translate-y-1 flex items-center gap-0.5 bg-jolshaa-surface-container-lowest border rounded-lg shadow-sm px-0.5 py-0.5 z-10 ${
                              selectedMsg === msg._id ? 'flex' : 'hidden group-hover:flex'
                            }`}
                            style={{ [isOwn ? 'right' : 'left']: '0' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button onClick={() => setShowEmojiPicker(showEmojiPicker === msg._id ? null : msg._id)}
                              className="p-1 hover:bg-jolshaa-surface-container rounded text-sm" title="React">😊</button>
                            <button onClick={() => { setReplyTo(msg); setSelectedMsg(null); }}
                              className="p-1 hover:bg-jolshaa-surface-container rounded text-sm" title="Reply">↩️</button>
                            <button onClick={() => openForwardModal(msg)}
                              className="p-1 hover:bg-jolshaa-surface-container rounded text-sm" title="Forward">↪️</button>
                            {isOwn && isWithinEditWindow(msg.createdAt) && (
                              <button onClick={() => { setEditingMsg(msg); setEditText(msg.text || ''); setSelectedMsg(null); }}
                                className="p-1 hover:bg-jolshaa-surface-container rounded text-sm" title="Edit">✏️</button>
                            )}
                            {isOwn && isWithinDeleteWindow(msg.createdAt) && (
                              <button onClick={() => setShowDeleteModal(msg)}
                                className="p-1 hover:bg-jolshaa-surface-container rounded text-sm text-red-500" title="Delete">🗑</button>
                            )}
                            {!isOwn && (
                              <button onClick={() => setShowDeleteModal(msg)}
                                className="p-1 hover:bg-jolshaa-surface-container rounded text-sm text-red-500" title="Delete for me">🗑</button>
                            )}
                          </div>
                        )}

                        {/* Emoji picker */}
                        {showEmojiPicker === msg._id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowEmojiPicker(null)} />
                            <div className={`absolute z-20 bg-jolshaa-surface-container-lowest border rounded-xl shadow-xl p-1.5 flex gap-0.5 ${
                              isOwn ? 'right-0' : 'left-0'
                            }`} style={{ bottom: '100%', marginBottom: '4px' }}>
                              {EMOJI_OPTIONS.map(emoji => (
                                <button key={emoji} onClick={() => handleReaction(msg._id, emoji)}
                                  className="p-1.5 hover:bg-jolshaa-surface-container rounded-lg text-lg transition hover:scale-110">{emoji}</button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Reply preview bar */}
      {replyTo && (
        <div className="px-4 py-2 bg-jolshaa-teal/10 border-t border-jolshaa-teal/20 flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-jolshaa-teal-container">Replying to {replyTo.sender?.name || 'message'}</p>
            <p className="text-xs text-jolshaa-on-surface-variant truncate">{replyTo.text || 'Media'}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="p-1 text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface-variant">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="px-3 py-2 border-t bg-jolshaa-surface-container-lowest flex-shrink-0">
        {uploadingFile && (
          <div className="text-center py-2">
            <div className="w-6 h-6 border-2 border-jolshaa-teal border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}
        <div className="flex items-end gap-1.5">
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} />
          <button onClick={() => imageInputRef.current?.click()}
            className="p-2 text-jolshaa-on-surface-variant hover:text-jolshaa-teal rounded-full hover:bg-jolshaa-surface-container transition"
            title="Send image">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </button>

          <input ref={fileInputRef} type="file" accept="video/*,audio/*,.pdf,.doc,.docx,.txt,.zip" className="hidden" onChange={(e) => handleFileUpload(e, 'file')} />
          <button onClick={() => fileInputRef.current?.click()}
            className="p-2 text-jolshaa-on-surface-variant hover:text-jolshaa-teal rounded-full hover:bg-jolshaa-surface-container transition"
            title="Attach file">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
          </button>

          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); handleTypingEmit(); }}
              onKeyDown={handleKeyPress}
              placeholder="Message"
              rows={1}
              className="w-full px-4 py-2 bg-jolshaa-surface-container rounded-full text-sm resize-none focus:outline-none focus:ring-2 focus:ring-jolshaa-teal max-h-32"
              style={{ minHeight: '40px' }}
            />
          </div>

          {text.trim() ? (
            <button onClick={handleSend}
              className="p-2 bg-jolshaa-teal text-jolshaa-on-teal rounded-full hover:bg-jolshaa-teal-container transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          ) : (
            <VoiceRecorder
              conversationId={convId}
              onSend={() => fetchMessages()}
            />
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setShowDeleteModal(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 bg-jolshaa-surface-container-lowest rounded-2xl shadow-2xl p-6 w-80">
            <h3 className="font-display font-bold text-lg mb-4">Delete Message</h3>
            {showDeleteModal.sender?._id === user.id && isWithinDeleteWindow(showDeleteModal.createdAt) ? (
              <div className="space-y-3">
                <button onClick={() => handleDeleteMessage(showDeleteModal._id, false)}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-jolshaa-surface-container-low rounded-lg border">
                  Delete for me
                </button>
                <button onClick={() => handleDeleteMessage(showDeleteModal._id, true)}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-red-50 rounded-lg border border-red-200 text-red-600">
                  Delete for everyone
                </button>
              </div>
            ) : (
              <button onClick={() => handleDeleteMessage(showDeleteModal._id, false)}
                className="w-full px-4 py-2.5 bg-jolshaa-teal text-jolshaa-on-teal text-sm rounded-lg hover:bg-jolshaa-teal-container">
                Delete for me
              </button>
            )}
            <button onClick={() => setShowDeleteModal(null)}
              className="w-full mt-3 px-4 py-2 text-sm text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container-low rounded-lg">
              Cancel
            </button>
          </div>
        </>
      )}

      {/* Forward modal */}
      {showForwardModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setShowForwardModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 bg-jolshaa-surface-container-lowest rounded-2xl shadow-2xl w-96 max-h-[70vh] flex flex-col">
            <div className="p-4 border-b border-jolshaa-outline-variant flex items-center justify-between">
              <h3 className="font-display font-bold">Forward to</h3>
              <button onClick={() => setShowForwardModal(false)} className="text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface-variant">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {forwardConversations.map(conv => {
                const isSelected = selectedForwardConvs.includes(conv._id);
                const other = conv.participants?.find(p => p._id !== user.id);
                return (
                  <button key={conv._id}
                    onClick={() => {
                      setSelectedForwardConvs(prev =>
                        isSelected ? prev.filter(id => id !== conv._id) : [...prev, conv._id]
                      );
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-jolshaa-surface-container-low transition text-left">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'bg-jolshaa-teal border-jolshaa-teal' : 'border-jolshaa-outline-variant'
                    }`}>
                      {isSelected && <span className="text-jolshaa-on-teal text-xs">&#10003;</span>}
                    </div>
                    <img
                      src={conv.isGroup ? conv.groupPhoto : other?.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'}
                      alt="" className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className="font-medium text-sm">{conv.isGroup ? conv.groupName || 'Group' : other?.name || 'Unknown'}</span>
                  </button>
                );
              })}
            </div>
            {selectedForwardConvs.length > 0 && (
              <div className="p-3 border-t border-jolshaa-outline-variant">
                <button onClick={handleForward}
                  className="w-full py-2 bg-jolshaa-teal text-jolshaa-on-teal text-sm rounded-full hover:bg-jolshaa-teal-container transition">
                  Forward ({selectedForwardConvs.length})
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Media preview */}
      {showMediaPreview && (
        <>
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={() => setShowMediaPreview(null)}>
            <button className="absolute top-4 right-4 text-jolshaa-on-teal p-2 hover:bg-jolshaa-surface-container-lowest/10 rounded-full">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            {showMediaPreview.type === 'image' && (
              <img src={showMediaPreview.url} alt="" className="max-w-[90vw] max-h-[90vh] object-contain" />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ChatWindow;
