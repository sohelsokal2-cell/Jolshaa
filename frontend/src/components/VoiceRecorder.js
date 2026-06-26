import { useState, useRef } from 'react';
import API from '../api/axios';

const VoiceRecorder = ({ onSend, conversationId }) => {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        audioChunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.current.start();
      setRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && recording) {
      mediaRecorder.current.stop();
      setRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const sendVoice = async () => {
    if (!audioBlob) return;

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
    }
  };

  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      {!recording && !audioBlob && (
        <button
          onClick={startRecording}
          className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
          title="Record voice note"
        >
          🎙️
        </button>
      )}

      {recording && (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm text-red-600 font-mono">{formatDuration(duration)}</span>
          <button
            onClick={stopRecording}
            className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600"
          >
            ⏹️
          </button>
        </div>
      )}

      {audioBlob && !recording && (
        <div className="flex items-center gap-2">
          <audio controls src={URL.createObjectURL(audioBlob)} className="h-8" />
          <button
            onClick={sendVoice}
            className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600"
          >
            ➤
          </button>
          <button
            onClick={() => { setAudioBlob(null); setDuration(0); }}
            className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
