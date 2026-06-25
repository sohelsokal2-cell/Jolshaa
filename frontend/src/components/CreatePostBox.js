import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const CreatePostBox = ({ onPostCreated, postedInType, postedInRefId }) => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [feeling, setFeeling] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length > 5) {
      setError('Maximum 5 files allowed');
      return;
    }
    setFiles(selected);
    const previewUrls = selected.map(file => URL.createObjectURL(file));
    setPreviews(previewUrls);
    setError('');
  };

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && files.length === 0) {
      return setError('Write something or add media');
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('visibility', visibility);
      if (feeling) formData.append('feeling', feeling);
      if (postedInType) formData.append('postedInType', postedInType);
      if (postedInRefId) formData.append('postedInRefId', postedInRefId);
      files.forEach(file => formData.append('media', file));

      const res = await API.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setText('');
      setFeeling('');
      setVisibility('public');
      setFiles([]);
      setPreviews([]);
      setExpanded(false);
      if (onPostCreated) onPostCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-start gap-3">
        <img
          src={user.profilePhoto || 'https://res.cloudinary.com/demo/image/upload/v1556418119/default-avatar.png'}
          alt={user.name}
          className="w-10 h-10 rounded-full object-cover"
        />
        <input
          type="text"
          placeholder={`What's on your mind, ${user.name?.split(' ')[0]}?`}
          onClick={() => setExpanded(true)}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          readOnly={!expanded}
        />
      </div>

      {expanded && (
        <div className="mt-3">
          {error && (
            <div className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm mb-2">{error}</div>
          )}

          {previews.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto">
              {previews.map((preview, i) => (
                <div key={i} className="relative flex-shrink-0">
                  <img src={preview} alt="" className="h-20 w-20 object-cover rounded" />
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
            <span
              onClick={() => fileInputRef.current.click()}
              className="flex items-center gap-1 cursor-pointer hover:text-blue-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Photo/Video
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              type="text"
              placeholder="Feeling/activity..."
              value={feeling}
              onChange={(e) => setFeeling(e.target.value)}
              className="border-b focus:outline-none focus:border-blue-500 text-sm"
            />
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="border rounded px-2 py-1 text-sm focus:outline-none"
            >
              <option value="public">Public</option>
              <option value="friends">Friends</option>
              <option value="onlyme">Only Me</option>
            </select>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || (!text.trim() && files.length === 0)}
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CreatePostBox;
