import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import API from '../api/axios';

const HELP_TYPE_ICONS = {
  medical: '🏥', flood: '🌊', fire: '🔥', accident: '🚗',
  earthquake: '🏚️', cyclone: '🌪️', other: '🆘',
};

const HelpCoordinationChat = ({ helpRequest, conversation: initialConversation, onClose }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [conversation, setConversation] = useState(initialConversation);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(!initialConversation);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (conversation) {
      fetchMessages();
      socket?.emit('joinConversation', conversation._id);
      return () => { socket?.emit('leaveConversation', conversation._id); };
    }
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
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const handleTypingEmit = () => {
    if (!socket || !conversation) return;
    socket.emit('typing', { conversationId: conversation._id });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', { conversationId: conversation._id });
    }, 2000);
  };

  const handleSend = () => {
    if (!text.trim() || !socket || !conversation) return;
    socket.emit('sendMessage', {
      conversationId: conversation._id,
      text: text.trim(),
    });
    setText('');
    socket.emit('stopTyping', { conversationId: conversation._id });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const urgencyColors = {
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    within_hours: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    within_days: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  };

  const urgencyLabels = {
    urgent: 'জরুরি',
    within_hours: '২৪ ঘণ্টার মধ্যে',
    within_days: '৭ দিনের মধ্যে',
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 rounded-xl overflow-hidden border border-red-200 dark:border-red-900/30">
      {/* Header - Pinned Help Request */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-b border-red-200 dark:border-red-900/30 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{HELP_TYPE_ICONS[helpRequest.helpType] || '🆘'}</span>
            <div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{helpRequest.title}</h4>
              <p className="text-xs text-neutral-500">{helpRequest.location?.district}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${urgencyColors[helpRequest.urgency] || ''}`}>
              {urgencyLabels[helpRequest.urgency] || helpRequest.urgency}
            </span>
            {onClose && (
              <button onClick={onClose} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors">
                <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        {helpRequest.description && (
          <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">{helpRequest.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
          <span>📞 {helpRequest.contactPhone}</span>
          {helpRequest.helpers?.length > 0 && (
            <span>🤝 {helpRequest.helpers.length} জন সাহায্য করছেন</span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center text-neutral-500 py-8">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            চ্যাট লোড হচ্ছে...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">🤝</p>
            <p className="text-sm text-neutral-500">চ্যাট শুরু করুন</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender?._id === user.id || msg.sender === user.id;
            return (
              <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : ''}`}>
                  {!isOwn && (
                    <div className="flex items-center gap-2 mb-1">
                      <img
                        src={msg.sender?.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=e74c3c&color=fff&size=128'}
                        alt="" className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-xs text-neutral-500">{msg.sender?.name}</span>
                    </div>
                  )}
                  <div className={`px-4 py-2 rounded-2xl ${
                    isOwn
                      ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-br-none'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-bl-none'
                  }`}>
                    {msg.text && <p className="text-sm">{msg.text}</p>}
                  </div>
                  <div className={`text-xs text-neutral-400 mt-1 flex items-center gap-2 ${isOwn ? 'justify-end' : ''}`}>
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <div className="flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs">{typingUsers.map(u => u.userName).join(', ')} টাইপ করছেন...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
        <div className="flex items-center gap-2">
          <input
            type="text" value={text}
            onChange={(e) => { setText(e.target.value); handleTypingEmit(); }}
            onKeyDown={handleKeyPress}
            placeholder="বার্তা লিখুন..."
            className="flex-1 px-4 py-2 rounded-full border border-red-200 dark:border-red-900/50 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <button onClick={handleSend} disabled={!text.trim()}
            className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-2 rounded-full hover:from-red-600 hover:to-orange-600 disabled:opacity-50 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpCoordinationChat;
