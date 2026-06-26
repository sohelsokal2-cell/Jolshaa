import { useState } from 'react';
import { Link } from 'react-router-dom';
import TopNavbar from '../components/layout/TopNavbar';
import ChatSidebar from '../components/ChatSidebar';
import ChatWindow from '../components/ChatWindow';

const Messages = () => {
  const [activeConversation, setActiveConversation] = useState(null);

  return (
    <div className="h-screen flex flex-col bg-neutral-100 dark:bg-neutral-900">
      <TopNavbar />

      <div className="flex-1 flex overflow-hidden pt-14">
        <ChatSidebar
          activeConversation={activeConversation}
          onSelectConversation={setActiveConversation}
        />
        <ChatWindow conversation={activeConversation} />
      </div>
    </div>
  );
};

export default Messages;
