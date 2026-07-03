import { useState, useRef, useCallback, useEffect } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

const AUDIO_CONSTRAINTS = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 44100,
  },
  video: false,
};

const VIDEO_CONSTRAINTS = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
  },
  video: {
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    facingMode: 'user',
  },
};

const useWebRTC = ({ socket, currentUser }) => {
  // State
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState('idle'); // idle | calling | ringing | connected | ended
  const [callType, setCallType] = useState(null); // audio | video
  const [caller, setCaller] = useState(null); // user who is calling us
  const [callerInfo, setCallerInfo] = useState(null); // { name, profilePhoto }
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState(null);
  const [remoteUserId, setRemoteUserId] = useState(null);
  const [recipientInfo, setRecipientInfo] = useState(null); // { name, profilePhoto } for outgoing calls
  const [callEndedInfo, setCallEndedInfo] = useState(null); // info after call ends

  // Refs for stale closures in socket handlers
  const callStatusRef = useRef(callStatus);
  const callTypeRef = useRef(callType);
  const remoteUserIdRef = useRef(remoteUserId);
  const callerInfoRef = useRef(callerInfo);
  const recipientInfoRef = useRef(recipientInfo);

  // Keep refs in sync
  useEffect(() => { callStatusRef.current = callStatus; }, [callStatus]);
  useEffect(() => { callTypeRef.current = callType; }, [callType]);
  useEffect(() => { remoteUserIdRef.current = remoteUserId; }, [remoteUserId]);
  useEffect(() => { callerInfoRef.current = callerInfo; }, [callerInfo]);
  useEffect(() => { recipientInfoRef.current = recipientInfo; }, [recipientInfo]);

  // Refs
  const peerConnection = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callTimerRef = useRef(null);
  const callStartTimeRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const currentConversationId = useRef(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus('idle');
    setCallType(null);
    setCaller(null);
    setCallerInfo(null);
    setRecipientInfo(null);
    setIncomingOffer(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setCallDuration(0);
    setRemoteUserId(null);
    callStartTimeRef.current = null;
    currentConversationId.current = null;
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback((targetUserId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('iceCandidate', {
          to: targetUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        const remote = event.streams[0];
        remoteStreamRef.current = remote;
        setRemoteStream(remote);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remote;
        }
        // Start timer and mark connected when remote stream arrives (receiver side)
        if (callStatusRef.current === 'connecting') {
          setCallStatus('connected');
          callStartTimeRef.current = Date.now();
          callTimerRef.current = setInterval(() => {
            setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
          }, 1000);
        }
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        setError('Connection failed. Please try again.');
        cleanup();
      }
    };

    peerConnection.current = pc;
    return pc;
  }, [socket, cleanup]);

  // Get local media stream
  const getLocalStream = useCallback(async (type) => {
    try {
      const constraints = type === 'video' ? VIDEO_CONSTRAINTS : AUDIO_CONSTRAINTS;
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Camera/microphone permission denied. Please allow access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera/microphone found on this device.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera/microphone is being used by another application.');
      } else {
        setError('Failed to access camera/microphone. Please try again.');
      }
      return null;
    }
  }, []);

  // Start a call
  const startCall = useCallback(async (userId, type, conversationId, recipient = null) => {
    if (callStatus !== 'idle') return;

    setError(null);
    setCallType(type);
    setCallStatus('calling');
    setRemoteUserId(userId);
    setRecipientInfo(recipient);
    currentConversationId.current = conversationId;

    const stream = await getLocalStream(type);
    if (!stream) {
      cleanup();
      return;
    }

    const pc = createPeerConnection(userId);

    // Add local tracks to peer connection
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    // Create offer
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('callUser', {
        to: userId,
        offer: pc.localDescription,
        callType: type,
        conversationId,
      });
    } catch (err) {
      setError('Failed to create call offer.');
      cleanup();
    }
  }, [callStatus, getLocalStream, createPeerConnection, socket, cleanup]);

  // Answer incoming call
  const answerCall = useCallback(async () => {
    if (!incomingOffer || !caller) return;

    setError(null);
    setCallType(incomingOffer.callType || 'audio');
    setCallStatus('connecting');
    setRemoteUserId(caller);
    currentConversationId.current = incomingOffer.conversationId;

    const stream = await getLocalStream(incomingOffer.callType || 'audio');
    if (!stream) {
      cleanup();
      return;
    }

    const pc = createPeerConnection(caller);

    // Add local tracks
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    // Set remote description (offer)
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer.offer));

      // Create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('callAnswer', {
        to: caller,
        answer: pc.localDescription,
      });

      // Timer will start when remote stream arrives (ontrack)
    } catch (err) {
      setError('Failed to answer call.');
      cleanup();
    }
  }, [incomingOffer, caller, getLocalStream, createPeerConnection, socket, cleanup]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    if (!caller) return;

    socket.emit('callRejected', {
      to: caller,
      conversationId: currentConversationId.current,
      callType: callTypeRef.current,
    });
    cleanup();
  }, [caller, socket, cleanup]);

  // End active call
  const endCall = useCallback((status = 'completed') => {
    if (!remoteUserId) return;

    const duration = callStartTimeRef.current
      ? Math.floor((Date.now() - callStartTimeRef.current) / 1000)
      : 0;

    // Store call ended info for the ended screen
    setCallEndedInfo({
      duration,
      status,
      callType,
      remoteUserId,
      remoteUserInfo: recipientInfo || callerInfo,
    });

    socket.emit('endCall', {
      to: remoteUserId,
      conversationId: currentConversationId.current,
      callType,
      duration,
      status,
    });

    cleanup();
  }, [remoteUserId, callType, callerInfo, recipientInfo, socket, cleanup]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    if (!localStreamRef.current || callType !== 'video') return;

    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOff(!videoTrack.enabled);
    }
  }, [callType]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data) => {
      const { from, offer, callType: type, conversationId, callerInfo: info } = data;

      // If already in a call, auto-reject
      if (callStatusRef.current !== 'idle') {
        socket.emit('callBusy', { to: from });
        return;
      }

      setCaller(from);
      setCallerInfo(info || null);
      setIncomingOffer({ offer, callType: type, conversationId });
      setCallType(type);
      setCallStatus('ringing');

      // Browser notification for incoming call
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const notification = new Notification(
          `${info?.name || 'Someone'} is calling you`,
          {
            body: type === 'video' ? 'Video Call' : 'Audio Call',
            icon: info?.profilePhoto || '/logo192.png',
            tag: 'incoming-call',
            renotify: true,
          }
        );
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
    };

    const handleCallAnswered = async (data) => {
      const { answer } = data;

      if (peerConnection.current) {
        try {
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(answer)
          );

          setCallStatus('connected');

          // Start call timer
          callStartTimeRef.current = Date.now();
          callTimerRef.current = setInterval(() => {
            setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
          }, 1000);
        } catch (err) {
          setError('Failed to establish connection.');
          cleanup();
        }
      }
    };

    const handleIceCandidate = async (data) => {
      const { candidate } = data;

      if (peerConnection.current && candidate) {
        try {
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch (err) {
          // ICE candidate errors are usually non-fatal
          console.warn('Failed to add ICE candidate:', err.message);
        }
      }
    };

    const handleCallEnded = (data) => {
      const { duration, status } = data || {};
      // Store call ended info before cleanup (use refs for current values)
      setCallEndedInfo({
        duration: duration || 0,
        status: status || 'completed',
        callType: callTypeRef.current,
        remoteUserId: remoteUserIdRef.current,
        remoteUserInfo: recipientInfoRef.current || callerInfoRef.current,
      });
      cleanup();
    };

    const handleCallRejected = () => {
      setRecipientInfo(null);
      cleanup();
      setError('Call was rejected.');
    };

    const handleCallBusy = () => {
      setRecipientInfo(null);
      cleanup();
      setError('User is currently on another call.');
    };

    socket.on('incomingCall', handleIncomingCall);
    socket.on('callAnswered', handleCallAnswered);
    socket.on('iceCandidate', handleIceCandidate);
    socket.on('callEnded', handleCallEnded);
    socket.on('callRejected', handleCallRejected);
    socket.on('callBusy', handleCallBusy);

    return () => {
      socket.off('incomingCall', handleIncomingCall);
      socket.off('callAnswered', handleCallAnswered);
      socket.off('iceCandidate', handleIceCandidate);
      socket.off('callEnded', handleCallEnded);
      socket.off('callRejected', handleCallRejected);
      socket.off('callBusy', handleCallBusy);
    };
  }, [socket, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Auto-cancel outgoing call after 30 seconds
  useEffect(() => {
    if (callStatus === 'calling') {
      const timeout = setTimeout(() => {
        if (callStatusRef.current === 'calling') {
          endCall('cancelled');
          setError('No answer. Call cancelled.');
        }
      }, 30000);

      return () => clearTimeout(timeout);
    }
  }, [callStatus, endCall]);

  return {
    // State
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
    remoteUserId,

    // Refs (attach to video/audio elements)
    localVideoRef,
    remoteVideoRef,

    // Actions
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
    cleanup,
    clearCallEndedInfo: useCallback(() => setCallEndedInfo(null), []),
  };
};

export default useWebRTC;
