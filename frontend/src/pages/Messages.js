import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatSidebar from '../components/ChatSidebar';
import ChatWindow from '../components/ChatWindow';
import NotificationBell from '../components/NotificationBell';
import Toast from '../components/Toast';

const Messages = () => {
  const { user, logout } = useAuth();
  const [activeConversation, setActiveConversation] = useState(null);

  return (
    <div className="h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow-md px-6 py-3 flex justify-between items-center z-10">
        <Link to="/feed" className="text-xl font-bold text-blue-600">Jolshaa</Link>
        <div className="flex items-center gap-4">
          <Link to="/feed" className="text-sm text-gray-600 hover:text-blue-600">Feed</Link>
          <NotificationBell />
          <Link to="/profile" className="text-sm text-gray-600 hover:text-blue-600">
            {user.name?.split(' ')[0]}
          </Link>
          <button onClick={logout} className="text-sm text-red-600 hover:underline">
            Logout
          </button>
        </div>
      </nav>

      {/* Chat layout */}
      <div className="flex-1 flex overflow-hidden">
        <ChatSidebar
          activeConversation={activeConversation}
          onSelectConversation={setActiveConversation}
        />
        <ChatWindow conversation={activeConversation} />
      </div>

      <Toast />
    </div>
  );
};

export default Messages;
