import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Avatar from './ui/Avatar';

const CreatePostBox = ({ onPostCreated, postedInType, postedInRefId }) => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [feeling, setFeeling] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [contentWarning, setContentWarning] = useState('none');
  const [communityLabel, setCommunityLabel] = useState('');
  const [footnotes, setFootnotes] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [altTexts, setAltTexts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => { previews.forEach(url => URL.revokeObjectURL(url)); };
  }, [previews]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length > 5) {
      setError('Maximum 5 files allowed');
      return;
    }
    previews.forEach(url => URL.revokeObjectURL(url));
    setFiles(selected);
    const previewUrls = selected.map(file => URL.createObjectURL(file));
    setPreviews(previewUrls);
    setAltTexts(selected.map(() => ''));
    setError('');
  };

  const removeFile = (index) => {
    URL.revokeObjectURL(previews[index]);
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    const newAltTexts = altTexts.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
    setAltTexts(newAltTexts);
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
      if (contentWarning && contentWarning !== 'none') formData.append('contentWarning', contentWarning);
      if (communityLabel) formData.append('communityLabel', communityLabel);
      if (footnotes) formData.append('footnotes', footnotes);
      if (postedInType) formData.append('postedInType', postedInType);
      if (postedInRefId) formData.append('postedInRefId', postedInRefId);
      files.forEach(file => formData.append('media', file));
      if (altTexts.some(a => a.trim())) {
        formData.append('altTexts', JSON.stringify(altTexts));
      }

      const res = await API.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setText('');
      setFeeling('');
      setVisibility('public');
      setContentWarning('none');
      setCommunityLabel('');
      setFootnotes('');
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
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-card p-4 mb-4">
      <div className="flex items-start gap-3">
        <Avatar src={user.profilePhoto} alt={user.name} size="md" />
        <button
          onClick={() => setExpanded(true)}
          className="flex-1 bg-neutral-100 dark:bg-neutral-700 rounded-full px-4 py-2.5 text-sm text-neutral-500 dark:text-neutral-400 text-left hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
        >
          What's on your mind, {user.name?.split(' ')[0]}?
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none resize-none min-h-[80px]"
            autoFocus
          />

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-xs">{error}</div>
          )}

          {previews.length > 0 && (
            <div className="space-y-2">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {previews.map((preview, i) => (
                  <div key={i} className="relative flex-shrink-0">
                    {files[i]?.type?.startsWith('video/') ? (
                      <video src={preview} className="h-20 w-20 object-cover rounded-lg" />
                    ) : (
                      <img src={preview} alt="" className="h-20 w-20 object-cover rounded-lg" />
                    )}
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
              {previews.length > 0 && (
                <div className="space-y-1">
                  {previews.map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      value={altTexts[i] || ''}
                      onChange={(e) => {
                        const newAltTexts = [...altTexts];
                        newAltTexts[i] = e.target.value;
                        setAltTexts(newAltTexts);
                      }}
                      placeholder={`Alt text for image ${i + 1} (accessibility)`}
                      className="w-full text-xs border border-neutral-200 dark:border-neutral-600 rounded-lg px-2 py-1.5 bg-neutral-50 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              <svg className="w-4 h-4 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Photo/Video
            </button>
            <input
              type="text"
              placeholder="Feeling..."
              value={feeling}
              onChange={(e) => setFeeling(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs bg-neutral-100 dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-neutral-700 dark:text-neutral-200 w-32"
            />
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            >
              <option value="public">🌍 Public</option>
              <option value="friends">👥 Friends</option>
              <option value="onlyme">🔒 Only Me</option>
            </select>
            <select
              value={contentWarning}
              onChange={(e) => setContentWarning(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            >
              <option value="none">No Warning</option>
              <option value="violence">⚠️ Violence</option>
              <option value="nudity">⚠️ Nudity</option>
              <option value="drugs">⚠️ Drugs</option>
              <option value="language">⚠️ Language</option>
              <option value="spoiler">⚠️ Spoiler</option>
              <option value="sensitive">⚠️ Sensitive</option>
            </select>
            <input
              type="text"
              placeholder="Community label..."
              value={communityLabel}
              onChange={(e) => setCommunityLabel(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs bg-neutral-100 dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-neutral-700 dark:text-neutral-200 w-32"
            />
          </div>
          <div className="mt-2">
            <input
              type="text"
              placeholder="Footnotes (optional)..."
              value={footnotes}
              onChange={(e) => setFootnotes(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg text-xs bg-neutral-100 dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-neutral-700 dark:text-neutral-200"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setExpanded(false); setText(''); setFiles([]); setPreviews([]); setError(''); }}
              className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || (!text.trim() && files.length === 0)}
              className="flex-1 bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Posting...
                </>
              ) : 'Post'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePostBox;
