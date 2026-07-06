import { useRef } from 'react';
import API from '../api/axios';

const ChatFileUpload = ({ conversationId, onSend }) => {
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert('File size must be under 25MB');
      return;
    }

    const formData = new FormData();
    formData.append('media', file);
    formData.append('conversationId', conversationId);
    formData.append('text', `📎 ${file.name}`);

    try {
      await API.post('/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (onSend) onSend();
    } catch (err) {
      console.error('Failed to send file');
    }

    fileInputRef.current.value = '';
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
      />
      <button
        onClick={() => fileInputRef.current.click()}
        className="p-2 text-jolshaa-on-surface-variant hover:text-blue-600"
        title="Attach file"
      >
        📎
      </button>
    </div>
  );
};

export default ChatFileUpload;
