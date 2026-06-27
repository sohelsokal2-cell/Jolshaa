import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import TopNavbar from '../components/layout/TopNavbar';
import BottomNav from '../components/layout/BottomNav';
import ChatSidebar from '../components/ChatSidebar';
import ChatWindow from '../components/ChatWindow';

const Messages = () => {
  const { id } = useParams();
  const [activeConversation, setActiveConversation] = useState(null);

  useEffect(() => {
    if (id) {
      setActiveConversation(id);
    }
  }, [id]);

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
  };

  return (
    <div className="h-[100dvh] flex flex-col" style={{ backgroundColor: '#0b1326' }}>
      <TopNavbar />

      <div className="flex-1 flex overflow-hidden pt-14">
        {/* Sidebar: full width on mobile when no conversation selected, hidden on mobile when conversation active */}
        <ChatSidebar
          activeConversation={activeConversation}
          onSelectConversation={handleSelectConversation}
          className={`w-full md:w-80 flex-shrink-0 ${activeConversation ? 'hidden md:flex' : 'flex'}`}
        />
        {/* ChatWindow: hidden on mobile when no conversation selected */}
        <div className={`flex-1 min-w-0 ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
          <ChatWindow
            conversation={activeConversation}
            onBack={() => setActiveConversation(null)}
          />
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Messages;
