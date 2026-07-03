import { useState, useRef, useEffect } from 'react';
import API from '../api/axios';

const MAX_DURATION = 300; // 5 minutes in seconds

const VoiceRecorder = ({ onSend, conversationId }) => {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [sending, setSending] = useState(false);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Auto-stop at max duration
  useEffect(() => {
    if (recording && duration >= MAX_DURATION) {
      stopRecording();
    }
  }, [duration, recording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mediaRecorder.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        audioChunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      };

      mediaRecorder.current.start();
      setRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied');
      alert('Please allow microphone access to record voice messages');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && recording) {
      mediaRecorder.current.stop();
      setRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder.current && recording) {
      mediaRecorder.current.stop();
      setRecording(false);
      clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    }
    setAudioBlob(null);
    setDuration(0);
  };

  const sendVoice = async () => {
    if (!audioBlob || sending) return;
    setSending(true);

    const formData = new FormData();
    formData.append('media', audioBlob, 'voice.webm');
    formData.append('conversationId', conversationId);
    formData.append('isVoice', 'true');
    formData.append('duration', duration.toString());

    try {
      await API.post('/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAudioBlob(null);
      setDuration(0);
      if (onSend) onSend();
    } catch (err) {
      console.error('Failed to send voice note');
      alert('Failed to send voice message');
    } finally {
      setSending(false);
    }
  };

  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = duration / MAX_DURATION;

  return (
    <div className="flex items-center gap-1">
      {!recording && !audioBlob && (
        <button
          onClick={startRecording}
          className="p-2 text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-100 transition"
          title="Record voice message"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
      )}

      {recording && (
        <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-full">
          <div className="relative w-3 h-3">
            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
            <div className="relative w-3 h-3 bg-red-500 rounded-full" />
          </div>
          <span className="text-sm text-red-600 font-mono tabular-nums">{formatDuration(duration)}</span>
          {/* Progress bar */}
          <div className="w-16 h-1 bg-red-200 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
          </div>
          <button onClick={stopRecording}
            className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
          </button>
          <button onClick={cancelRecording}
            className="p-1.5 text-gray-400 hover:text-red-500 rounded-full transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {audioBlob && !recording && (
        <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full">
          <audio src={URL.createObjectURL(audioBlob)} className="h-8" controls />
          <button onClick={sendVoice} disabled={sending}
            className="p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition">
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            )}
          </button>
          <button onClick={cancelRecording}
            className="p-1.5 text-gray-400 hover:text-red-500 rounded-full transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
