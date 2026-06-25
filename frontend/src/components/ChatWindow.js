import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import API from '../api/axios';

const ChatWindow = ({ conversation }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!conversation) return;
    fetchMessages();
    socket?.emit('joinConversation', conversation._id);

    return () => {
      socket?.emit('leaveConversation', conversation._id);
    };
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

    socket.on('newMessage', handleNewMessage);
    socket.on('typing', handleTyping);
    socket.on('stopTyping', handleStopTyping);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('typing', handleTyping);
      socket.off('stopTyping', handleStopTyping);
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

    socket?.emit('sendMessage', {
      conversationId: conversation._id,
      text: text.trim()
    });

    setText('');
    socket?.emit('stopTyping', { conversationId: conversation._id });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTyping = () => {
    socket?.emit('typing', {
      conversationId: conversation._id,
      userName: user.name
    });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit('stopTyping', { conversationId: conversation._id });
    }, 2000);
  };

  const getOtherParticipant = () => {
    return conversation.participants.find(p => p._id !== user.id);
  };

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
      {/* Header */}
      <div className="p-4 border-b bg-white flex items-center gap-3">
        <img
          src={(conversation.isGroup ? conversation.groupPhoto : getOtherParticipant()?.profilePhoto) || 'https://res.cloudinary.com/demo/image/upload/v1556418119/default-avatar.png'}
          alt=""
          className="w-10 h-10 rounded-full object-cover"
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center text-gray-500">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500">No messages yet. Say hello!</div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender._id === user.id;
            return (
              <div
                key={msg._id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : ''}`}>
                  {!isOwn && (
                    <div className="flex items-center gap-2 mb-1">
                      <img
                        src={msg.sender.profilePhoto || 'https://res.cloudinary.com/demo/image/upload/v1556418119/default-avatar.png'}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-xs text-gray-500">{msg.sender.name}</span>
                    </div>
                  )}
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      isOwn
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-gray-200 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    {msg.text && <p className="text-sm">{msg.text}</p>}
                    {msg.media && (
                      <img src={msg.media} alt="" className="mt-2 rounded max-w-full" />
                    )}
                  </div>
                  <div className={`text-xs text-gray-400 mt-1 ${isOwn ? 'text-right' : ''}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isOwn && msg.readBy?.length > 1 && (
                      <span className="ml-1 text-blue-500">✓✓</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => { setText(e.target.value); handleTyping(); }}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 transition"
          >
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
