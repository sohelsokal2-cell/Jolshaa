import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import API from '../api/axios';
import ChatFileUpload from './ChatFileUpload';

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

const ChatWindow = ({ conversation, onBack }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [editingMsg, setEditingMsg] = useState(null);
  const [editText, setEditText] = useState('');
  const [openEmojiPicker, setOpenEmojiPicker] = useState(null);
  const [tappedMsg, setTappedMsg] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!conversation) return;
    fetchMessages();
    socket?.emit('joinConversation', conversation._id);
    return () => { socket?.emit('leaveConversation', conversation._id); };
  }, [conversation?._id]);

  useEffect(() => {
    if (!socket || !conversation) return;
    const handleNewMessage = (message) => {
      if (message.conversation === conversation._id || message.conversationId === conversation._id) {
        setMessages(prev => [...prev, message]);
      }
    };
    const handleTyping = ({ conversationId, userId, userName }) => {
      if (conversationId === conversation._id && userId !== user.id) {
        setTypingUsers(prev => {
          if (prev.find(u => u.userId === userId)) return prev;
          return [...prev, { userId, userName }];
        });
      }
    };
    const handleStopTyping = ({ conversationId, userId }) => {
      if (conversationId === conversation._id) {
        setTypingUsers(prev => prev.filter(u => u.userId !== userId));
      }
    };
    const handleMessageUpdated = (updated) => {
      setMessages(prev => prev.map(m => m._id === updated._id ? updated : m));
    };
    const handleMessageDeleted = ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('typing', handleTyping);
    socket.on('stopTyping', handleStopTyping);
    socket.on('messageUpdated', handleMessageUpdated);
    socket.on('messageDeleted', handleMessageDeleted);
    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('typing', handleTyping);
      socket.off('stopTyping', handleStopTyping);
      socket.off('messageUpdated', handleMessageUpdated);
      socket.off('messageDeleted', handleMessageDeleted);
    };
  }, [socket, conversation?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const fetchMessages = async () => {
    try {
      const res = await API.get(`/conversations/${conversation._id}/messages`);
      setMessages(res.data.messages);
    } catch (err) {
      console.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (!text.trim()) return;
    socket?.emit('sendMessage', { conversationId: conversation._id, text: text.trim() });
    setText('');
    socket?.emit('stopTyping', { conversationId: conversation._id });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTypingEmit = () => {
    socket?.emit('typing', { conversationId: conversation._id, userName: user.name });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit('stopTyping', { conversationId: conversation._id });
    }, 2000);
  };

  const handleEditMessage = async (msg) => {
    if (!editText.trim() || editText === msg.text) { setEditingMsg(null); return; }
    try {
      const res = await API.put(`/messages/${msg._id}`, { text: editText.trim() });
      setMessages(prev => prev.map(m => m._id === msg._id ? res.data.message : m));
    } catch (err) {
      console.error('Failed to edit');
    }
    setEditingMsg(null);
    setEditText('');
  };

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await API.delete(`/messages/${msgId}`);
      setMessages(prev => prev.filter(m => m._id !== msgId));
    } catch (err) {
      console.error('Failed to delete');
    }
  };

  const handleReaction = async (msgId, emoji) => {
    try {
      const res = await API.post(`/messages/${msgId}/react`, { emoji });
      setMessages(prev => prev.map(m => m._id === msgId ? { ...m, reactions: res.data.reactions } : m));
    } catch (err) {
      console.error('Failed to react');
    }
    setOpenEmojiPicker(null);
  };

  const getOtherParticipant = () => conversation.participants.find(p => p._id !== user.id);
  const getHeaderName = () => {
    if (conversation.isGroup) return conversation.groupName || 'Group Chat';
    return getOtherParticipant()?.name || 'Unknown';
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select a conversation to start chatting
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="p-3 md:p-4 border-b bg-white flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="p-1 -ml-1 text-gray-600 hover:text-gray-900 md:hidden">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
        )}
        <img
          src={(conversation.isGroup ? conversation.groupPhoto : getOtherParticipant()?.profilePhoto) || 'https://res.cloudinary.com/demo/image/upload/v1556418119/default-avatar.png'}
          alt="" className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <h3 className="font-semibold">{getHeaderName()}</h3>
          {typingUsers.length > 0 && (
            <p className="text-xs text-green-500">
              {typingUsers.map(u => u.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center text-gray-500">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500">No messages yet. Say hello!</div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender._id === user.id;
            const isEditing = editingMsg?._id === msg._id;
            const reactions = msg.reactions || [];
            return (
              <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs lg:max-w-md group relative ${isOwn ? 'order-2' : ''}`}
                  onClick={() => setTappedMsg(tappedMsg === msg._id ? null : msg._id)}
                >
                  {!isOwn && (
                    <div className="flex items-center gap-2 mb-1">
                      <img
                        src={msg.sender.profilePhoto || 'https://res.cloudinary.com/demo/image/upload/v1556418119/default-avatar.png'}
                        alt="" className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-xs text-gray-500">{msg.sender.name}</span>
                    </div>
                  )}

                  {isEditing ? (
                    <div className="flex gap-1">
                      <input
                        type="text" value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleEditMessage(msg); if (e.key === 'Escape') setEditingMsg(null); }}
                        className="flex-1 px-3 py-1 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                      <button onClick={() => handleEditMessage(msg)} className="text-xs text-blue-600 hover:underline">Save</button>
                      <button onClick={() => setEditingMsg(null)} className="text-xs text-gray-500 hover:underline">Cancel</button>
                    </div>
                  ) : (
                    <div className={`px-4 py-2 rounded-2xl ${
                      isOwn ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'
                    }`}>
                      {msg.text && <p className="text-sm">{msg.text}</p>}
                      {msg.media && <img src={msg.media} alt="" className="mt-2 rounded max-w-full" />}
                    </div>
                  )}

                  {reactions.length > 0 && (
                    <div className={`flex gap-0.5 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      {[...new Set(reactions.map(r => r.emoji))].map(emoji => {
                        const count = reactions.filter(r => r.emoji === emoji).length;
                        return (
                          <span key={emoji} className="text-xs bg-white dark:bg-neutral-800 border rounded-full px-1.5 py-0.5 cursor-pointer hover:bg-gray-100"
                            onClick={() => handleReaction(msg._id, emoji)}>
                            {emoji} {count > 1 && count}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className={`text-xs text-gray-400 mt-1 flex items-center gap-2 ${isOwn ? 'justify-end' : ''}`}>
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {msg.isEdited && <span className="italic">(edited)</span>}
                    {isOwn && msg.readBy?.length > 1 && <span className="text-blue-500">✓✓</span>}
                  </div>

                  <div
                    className={`absolute top-0 items-center gap-0.5 -translate-y-1/2 bg-white border rounded-lg shadow-sm px-1 py-0.5 z-10 ${
                      tappedMsg === msg._id ? 'flex' : 'hidden group-hover:flex'
                    }`}
                    style={{ [isOwn ? 'right' : 'left']: '0' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button onClick={() => setOpenEmojiPicker(openEmojiPicker === msg._id ? null : msg._id)}
                      className="p-1 hover:bg-gray-100 rounded text-xs">😊</button>
                    {isOwn && (
                      <>
                        <button onClick={() => { setEditingMsg(msg); setEditText(msg.text || ''); }}
                          className="p-1 hover:bg-gray-100 rounded text-xs">✏️</button>
                        <button onClick={() => handleDeleteMessage(msg._id)}
                          className="p-1 hover:bg-gray-100 rounded text-xs text-red-500">🗑</button>
                      </>
                    )}
                  </div>

                  {openEmojiPicker === msg._id && (
                    <div className={`absolute z-20 bg-white border rounded-lg shadow-lg p-1 flex gap-1 ${isOwn ? 'right-0' : 'left-0'}`} style={{ top: '-30px' }}>
                      {EMOJI_OPTIONS.map(emoji => (
                        <button key={emoji} onClick={() => handleReaction(msg._id, emoji)}
                          className="p-1 hover:bg-gray-100 rounded text-lg">{emoji}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t bg-white">
        <div className="flex items-center gap-2">
          <ChatFileUpload conversationId={conversation._id} onSend={() => fetchMessages()} />
          <input
            type="text" value={text}
            onChange={(e) => { setText(e.target.value); handleTypingEmit(); }}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={handleSend} disabled={!text.trim()}
            className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
