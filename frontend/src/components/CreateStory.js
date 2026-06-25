import { useState, useRef } from 'react';
import API from '../api/axios';

const CreateStory = ({ onClose, onStoryCreated }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mediaType, setMediaType] = useState('image');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (selected.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    const isVideo = selected.type.startsWith('video/');
    const isImage = selected.type.startsWith('image/');

    if (!isVideo && !isImage) {
      setError('Please select an image or video file');
      return;
    }

    setFile(selected);
    setMediaType(isVideo ? 'video' : 'image');
    setPreview(URL.createObjectURL(selected));
    setError('');
  };

  const handleShare = async () => {
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('media', file);

      const res = await API.post('/stories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onStoryCreated(res.data.story);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create story');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-800">Create Story</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {!preview ? (
            <div
              onClick={() => fileInputRef.current.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
            >
              <svg
                className="w-12 h-12 mx-auto text-gray-400 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-600 font-medium">
                Click to upload photo or video
              </p>
              <p className="text-gray-400 text-sm mt-1">Max 10MB</p>
            </div>
          ) : (
            <div className="relative">
              {mediaType === 'video' ? (
                <video
                  src={preview}
                  className="w-full rounded-lg max-h-80 object-contain bg-black"
                  autoPlay
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full rounded-lg max-h-80 object-contain"
                />
              )}
              <button
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
                className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75"
              >
                &times;
              </button>
            </div>
          )}

          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={!file || uploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Sharing...' : 'Share to Story'}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default CreateStory;
