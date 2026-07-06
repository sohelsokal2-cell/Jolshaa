import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const CreateReel = () => {
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [caption, setCaption] = useState('');
  const [music, setMusic] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideo(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!video) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('video', video);
      formData.append('caption', caption);
      formData.append('music', music);

      await API.post('/reels', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      navigate('/reels');
    } catch (err) {
      console.error('Failed to upload reel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="font-display text-xl font-semibold mb-4">Create Reel</h2>

      <div className="bg-white rounded-lg shadow-sm p-4">
        {!videoPreview ? (
          <div
            onClick={() => fileInputRef.current.click()}
            className="border-2 border-dashed border-jolshaa-outline-variant rounded-lg p-12 text-center cursor-pointer hover:border-blue-500"
          >
            <p className="text-jolshaa-on-surface-variant">Click to select a video</p>
            <p className="text-xs text-jolshaa-on-surface-variant/60 mt-1">MP4, MOV up to 60s</p>
          </div>
        ) : (
          <div className="relative mb-4">
            <video
              src={videoPreview}
              className="w-full rounded-lg"
              controls
              style={{ maxHeight: '500px' }}
            />
            <button
              onClick={() => {
                setVideo(null);
                setVideoPreview('');
              }}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center"
            >
              &times;
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="space-y-3 mt-4">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption..."
            className="w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
          />
          <input
            type="text"
            value={music}
            onChange={(e) => setMusic(e.target.value)}
            placeholder="Add music (optional)"
            className="w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleUpload}
            disabled={!video || loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Share Reel'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateReel;
