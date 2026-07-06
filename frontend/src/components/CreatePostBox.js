import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Avatar from './ui/Avatar';
import HelpButton from './HelpButton';
import useVideoUpload from '../hooks/useVideoUpload';
import VideoUploadProgress from './VideoUploadProgress';

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

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
  const videoInputRef = useRef(null);

  const {
    videoFile,
    videoPreview,
    thumbnail,
    videoDuration,
    videoDimensions,
    isShortForm,
    setIsShortForm,
    uploadProgress,
    uploadStatus,
    uploadError,
    postId,
    selectVideo,
    startUpload,
    cancelUpload,
    resetUpload,
    retryUpload,
  } = useVideoUpload();

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

  const handleVideoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    const valid = await selectVideo(file);
    if (!valid) return;
    // Clear image files when video is selected
    setFiles([]);
    setPreviews([]);
    setAltTexts([]);
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

  const removeVideo = () => {
    resetUpload();
  };

  const handleCancelUpload = () => {
    cancelUpload();
  };

  const handleRetryUpload = () => {
    retryUpload(text, visibility);
  };

  const hasMedia = files.length > 0 || videoFile;
  const isUploading = uploadStatus === 'uploading' || uploadStatus === 'processing';
  const isReady = uploadStatus === 'ready';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && !hasMedia) {
      return setError('Write something or add media');
    }

    setLoading(true);
    setError('');

    try {
      // Upload video if present
      if (videoFile) {
        if (!isReady && !isUploading) {
          const createdPostId = await startUpload(text, visibility);
          if (!createdPostId) {
            setLoading(false);
            return;
          }
          // Video upload handles its own post creation — use returned ID
          if (onPostCreated) onPostCreated({ _id: createdPostId });
        } else if (isReady && postId) {
          // Video already uploaded — call onPostCreated with existing postId
          if (onPostCreated) onPostCreated({ _id: postId });
        }
      } else {
        // Regular image post
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

        if (onPostCreated) onPostCreated(res.data);
      }

      // Reset form
      setText('');
      setFeeling('');
      setVisibility('public');
      setContentWarning('none');
      setCommunityLabel('');
      setFootnotes('');
      setFiles([]);
      setPreviews([]);
      setAltTexts([]);
      setExpanded(false);
      resetUpload();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setExpanded(false);
    setText('');
    setFiles([]);
    setPreviews([]);
    setAltTexts([]);
    setError('');
    resetUpload();
  };

  const isVertical = videoDimensions.height > videoDimensions.width;

  return (
    <div className="bg-jolshaa-surface-container-lowest rounded-2xl shadow-ambient p-4 mb-4">
      <div className="flex items-start gap-3">
        <Avatar src={user.profilePhoto} alt={user.name} size="md" />
        <button
          onClick={() => setExpanded(true)}
          className="flex-1 bg-jolshaa-surface-container-low rounded-full px-4 py-2.5 text-sm text-jolshaa-on-surface-variant text-left hover:bg-jolshaa-surface-container transition-colors"
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
            className="w-full bg-transparent text-sm text-jolshaa-on-surface placeholder-jolshaa-on-surface-variant focus:outline-none resize-none min-h-[80px]"
            autoFocus
          />

          {error && (
            <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs">{error}</div>
          )}

          {/* Video Preview */}
          {videoFile && (
            <div className="space-y-2">
              <div className="relative rounded-lg overflow-hidden border border-jolshaa-outline-variant">
                <video
                  src={videoPreview}
                  className="w-full max-h-48 object-cover"
                  controls={uploadStatus === 'idle' || uploadStatus === 'error'}
                  muted
                />
                {/* Thumbnail overlay when processing */}
                {(uploadStatus === 'processing' || uploadStatus === 'uploading') && thumbnail && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <img src={thumbnail} alt="" className="w-full h-full object-cover opacity-50" />
                  </div>
                )}
                {/* Duration badge */}
                <div className="absolute top-2 right-2 bg-black/60 px-2 py-0.5 rounded text-white text-xs font-mono">
                  {formatDuration(videoDuration)}
                </div>
                {/* Remove button */}
                {(uploadStatus === 'idle' || uploadStatus === 'error') && (
                  <button
                    onClick={removeVideo}
                    className="absolute top-2 left-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>

              {/* Video info row */}
              <div className="flex items-center justify-between text-xs text-jolshaa-on-surface-variant">
                <span>
                  {videoDimensions.width}x{videoDimensions.height} &middot; {formatDuration(videoDuration)}
                  {isVertical ? ' (Vertical)' : ' (Horizontal)'}
                </span>
                {/* Short form toggle — only show if duration <= 90s */}
                {videoDuration <= 90 && videoDuration >= 15 && (
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isShortForm}
                      onChange={(e) => setIsShortForm(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-jolshaa-outline-variant text-jolshaa-teal focus:ring-jolshaa-teal"
                    />
                    <span className="text-purple-600 font-medium">Post as Short</span>
                  </label>
                )}
              </div>

              {/* Upload progress */}
              <VideoUploadProgress
                uploadStatus={uploadStatus}
                uploadProgress={uploadProgress}
                uploadError={uploadError}
                isShortForm={isShortForm}
                onRetry={handleRetryUpload}
                onCancel={handleCancelUpload}
              />
            </div>
          )}

          {/* Image Previews */}
          {previews.length > 0 && !videoFile && (
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
                      className="w-full text-xs border border-jolshaa-outline-variant rounded-lg px-2 py-1.5 bg-jolshaa-surface-container-low text-jolshaa-on-surface focus:outline-none focus:ring-1 focus:ring-jolshaa-teal"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
              onChange={handleVideoSelect}
              className="hidden"
            />

            {/* Photo button */}
            <button
              onClick={() => fileInputRef.current.click()}
              disabled={!!videoFile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Photo
            </button>

            {/* Video button */}
            <button
              onClick={() => videoInputRef.current.click()}
              disabled={files.length > 0 || isUploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Video
            </button>

            <input
              type="text"
              placeholder="Feeling..."
              value={feeling}
              onChange={(e) => setFeeling(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs bg-jolshaa-surface-container-low focus:outline-none focus:ring-2 focus:ring-jolshaa-teal/30 text-jolshaa-on-surface w-32"
            />
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs bg-jolshaa-surface-container-low text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal/30"
            >
              <option value="public">Public</option>
              <option value="friends">Friends</option>
              <option value="onlyme">Only Me</option>
            </select>
            <select
              value={contentWarning}
              onChange={(e) => setContentWarning(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs bg-jolshaa-surface-container-low text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal/30"
            >
              <option value="none">No Warning</option>
              <option value="violence">Violence</option>
              <option value="nudity">Nudity</option>
              <option value="drugs">Drugs</option>
              <option value="language">Language</option>
              <option value="spoiler">Spoiler</option>
              <option value="sensitive">Sensitive</option>
            </select>
            <input
              type="text"
              placeholder="Community label..."
              value={communityLabel}
              onChange={(e) => setCommunityLabel(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs bg-jolshaa-surface-container-low focus:outline-none focus:ring-2 focus:ring-jolshaa-teal/30 text-jolshaa-on-surface w-32"
            />
          </div>
          <div className="mt-2">
            <input
              type="text"
              placeholder="Footnotes (optional)..."
              value={footnotes}
              onChange={(e) => setFootnotes(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg text-xs bg-jolshaa-surface-container-low focus:outline-none focus:ring-2 focus:ring-jolshaa-teal/30 text-jolshaa-on-surface"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg text-sm font-medium text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container-low transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || (!text.trim() && !hasMedia) || isUploading}
              className="flex-1 bg-jolshaa-teal text-jolshaa-on-teal py-2 rounded-lg text-sm font-medium hover:bg-jolshaa-teal-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading || isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isUploading ? 'Uploading...' : 'Posting...'}
                </>
              ) : 'Post'}
            </button>
            <HelpButton variant="inline" />
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePostBox;
