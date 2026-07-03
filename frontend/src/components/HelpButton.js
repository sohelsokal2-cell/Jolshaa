import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import API from '../api/axios';
import CreateHelpRequestModal from './CreateHelpRequestModal';

const HelpButton = ({ variant = 'floating' }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [showModal, setShowModal] = useState(false);
  const [hasActive, setHasActive] = useState(false);

  useEffect(() => {
    if (variant === 'floating' && user?.location?.district) {
      checkNearbyHelp();
      if (socket) {
        socket.emit('joinDistrictRoom', { district: user.location.district });
        socket.on('newHelpRequest', () => setHasActive(true));
        return () => socket.off('newHelpRequest');
      }
    }
  }, [socket, user?.location?.district, variant]);

  const checkNearbyHelp = async () => {
    try {
      const res = await API.get(`/help/nearby?district=${user.location.district}&limit=1`);
      setHasActive(res.data.total > 0);
    } catch {}
  };

  if (variant === 'inline') {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm font-medium transition-colors shadow-lg shadow-red-500/25"
        >
          <span className="text-lg">🆘</span>
          Need Help
        </button>
        {showModal && <CreateHelpRequestModal onClose={() => setShowModal(false)} />}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          hasActive ? 'animate-pulse' : ''
        }`}
        title="Need Help"
      >
        <span className="text-2xl">🆘</span>
      </button>
      {showModal && <CreateHelpRequestModal onClose={() => setShowModal(false)} />}
    </>
  );
};

export default HelpButton;
