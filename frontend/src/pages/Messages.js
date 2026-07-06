import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import TopNavbar from '../components/layout/TopNavbar';
import BottomNav from '../components/layout/BottomNav';
import ChatSidebar from '../components/ChatSidebar';
import ChatWindow from '../components/ChatWindow';
import InfoPanel from '../components/InfoPanel';
import useWebRTC from '../hooks/useWebRTC';
import IncomingCallScreen from '../components/IncomingCallScreen';
import OutgoingCallScreen from '../components/OutgoingCallScreen';
import AudioCallScreen from '../components/AudioCallScreen';
import VideoCallScreen from '../components/VideoCallScreen';
import CallEndedScreen from '../components/CallEndedScreen';

const Messages = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [activeConversation, setActiveConversation] = useState(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  const {
    localStream,
    remoteStream,
    callStatus,
    callType,
    caller,
    callerInfo,
    recipientInfo,
    callEndedInfo,
    isMuted,
    isCameraOff,
    callDuration,
    error,
    localVideoRef,
    remoteVideoRef,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
    cleanup: cleanupCall,
    clearCallEndedInfo,
  } = useWebRTC({ socket, currentUser: user });

  useEffect(() => {
    if (id) setActiveConversation(id);
  }, [id]);

  // Cleanup call state on unmount
  useEffect(() => {
    return () => {
      clearCallEndedInfo();
    };
  }, [clearCallEndedInfo]);

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

  const handleStartCall = (userId, type, conversationId, recipientInfo) => {
    startCall(userId, type, conversationId, recipientInfo);
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-jolshaa-surface">
      <TopNavbar />

      <div className="flex-1 flex overflow-hidden pt-14 md:p-4">
        <div className="flex-1 flex overflow-hidden bg-jolshaa-surface-container-lowest md:rounded-2xl md:border md:border-jolshaa-outline-variant md:shadow-ambient">
          <ChatSidebar
            activeConversation={activeConversation}
            onSelectConversation={handleSelectConversation}
            className={`w-full md:w-[350px] flex-shrink-0 ${
              activeConversation ? 'hidden md:flex' : 'flex'
            }`}
          />

          <div className={`flex-1 min-w-0 ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
            <ChatWindow
              conversation={activeConversation}
              onBack={() => setActiveConversation(null)}
              showInfoPanel={showInfoPanel}
              onToggleInfo={() => setShowInfoPanel(!showInfoPanel)}
              onStartCall={handleStartCall}
              callStatus={callStatus}
            />
          </div>

          {/* Info Panel - Desktop */}
          {showInfoPanel && activeConversation && (
            <>
              {/* Mobile overlay */}
              <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={handleCloseInfoPanel} />
              <div className={`fixed right-0 top-14 bottom-0 z-40 md:relative md:z-auto md:top-auto md:bottom-auto md:right-auto ${
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
      </div>

      <BottomNav />
      <div className="h-14 lg:hidden" />

      {/* Call Screens */}
      {callStatus === 'ringing' && (
        <IncomingCallScreen
          callerInfo={callerInfo}
          callType={callType}
          onAccept={answerCall}
          onReject={rejectCall}
        />
      )}
      {callStatus === 'calling' && (
        <OutgoingCallScreen
          recipientInfo={recipientInfo}
          callType={callType}
          onEndCall={() => endCall('cancelled')}
        />
      )}
      {(callStatus === 'connected' || callStatus === 'connecting') && callType === 'audio' && (
        <AudioCallScreen
          remoteUserId={caller || recipientInfo?._id}
          remoteUserInfo={callerInfo || recipientInfo}
          callType={callType}
          callDuration={callDuration}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onEndCall={() => endCall('completed')}
        />
      )}
      {(callStatus === 'connected' || callStatus === 'connecting') && callType === 'video' && (
        <VideoCallScreen
          remoteUserId={caller || recipientInfo?._id}
          remoteUserInfo={callerInfo || recipientInfo}
          callDuration={callDuration}
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          onToggleMute={toggleMute}
          onToggleCamera={toggleCamera}
          onEndCall={() => endCall('completed')}
          localVideoRef={localVideoRef}
          remoteVideoRef={remoteVideoRef}
        />
      )}
      {callEndedInfo && (
        <CallEndedScreen
          callDuration={callEndedInfo.duration}
          callStatus={callEndedInfo.status}
          callType={callEndedInfo.callType}
          remoteUserInfo={callEndedInfo.remoteUserInfo}
          onDone={clearCallEndedInfo}
        />
      )}
    </div>
  );
};

export default Messages;
