import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import TopNavbar from '../components/layout/TopNavbar';
import BottomNav from '../components/layout/BottomNav';
import ChatSidebar from '../components/ChatSidebar';
import ChatWindow from '../components/ChatWindow';
import InfoPanel from '../components/InfoPanel';

const Messages = () => {
  const { id } = useParams();
  const [activeConversation, setActiveConversation] = useState(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  useEffect(() => {
    if (id) setActiveConversation(id);
  }, [id]);

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    setShowInfoPanel(false);
  };

  const handleUpdateConversation = (updated) => {
    setActiveConversation(prev => {
      if (prev && prev._id === updated._id) return updated;
      return prev;
    });
  };

  const handleCloseInfoPanel = () => {
    setShowInfoPanel(false);
  };

  return (
    <div className="h-[100dvh] flex flex-col" style={{ backgroundColor: '#0b1326' }}>
      <TopNavbar />

      <div className="flex-1 flex overflow-hidden pt-14">
        <ChatSidebar
          activeConversation={activeConversation}
          onSelectConversation={handleSelectConversation}
          className={`w-full md:w-80 lg:w-96 flex-shrink-0 ${
            activeConversation ? 'hidden md:flex' : 'flex'
          }`}
        />

        <div className={`flex-1 min-w-0 ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
          <ChatWindow
            conversation={activeConversation}
            onBack={() => setActiveConversation(null)}
            showInfoPanel={showInfoPanel}
            onToggleInfo={() => setShowInfoPanel(!showInfoPanel)}
          />
        </div>

        {/* Info Panel - Desktop */}
        {showInfoPanel && activeConversation && (
          <>
            {/* Mobile overlay */}
            <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={handleCloseInfoPanel} />
            <div className={`fixed right-0 top-14 bottom-0 z-40 md:relative md:z-auto ${
              showInfoPanel ? 'flex' : 'hidden'
            }`}>
              <InfoPanel
                conversation={activeConversation}
                onClose={handleCloseInfoPanel}
                onUpdateConversation={handleUpdateConversation}
              />
            </div>
          </>
        )}
      </div>

      <BottomNav />
      <div className="h-14 lg:hidden" />
    </div>
  );
};

export default Messages;
