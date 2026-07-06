import { useState, useRef } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ShareModal from './ShareModal';

const AlbumViewer = ({ album, onClose, isOwner, onPhotosUpdated }) => {
  const { user } = useAuth();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(-1);
  const [showUpload, setShowUpload] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [settingsTitle, setSettingsTitle] = useState(album.title);
  const [settingsDescription, setSettingsDescription] = useState(album.description || '');
  const [settingsVisibility, setSettingsVisibility] = useState(album.visibility || 'friends');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('photos', file));

      const res = await API.put(`/albums/${album._id}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onPhotosUpdated(res.data.album);
      setShowUpload(false);
    } catch (err) {
      console.error('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async (photoUrl) => {
    if (!window.confirm('Remove this photo from the album?')) return;

    try {
      const res = await API.put(`/albums/${album._id}/remove-photo`, {
        photoUrl,
      });
      onPhotosUpdated(res.data.album);
      if (currentPhotoIndex >= res.data.album.photos.length) {
        setCurrentPhotoIndex(res.data.album.photos.length - 1);
      }
    } catch (err) {
      console.error('Failed to remove photo');
    }
  };

  const handleSaveSettings = async () => {
    try {
      const res = await API.put(`/albums/${album._id}`, {
        title: settingsTitle,
        description: settingsDescription,
        visibility: settingsVisibility,
      });
      onPhotosUpdated(res.data.album);
      setShowSettings(false);
    } catch (err) {
      console.error('Failed to update album');
    }
  };

  const handleToggleHighlight = async () => {
    try {
      const res = await API.put(`/albums/${album._id}`, {
        isHighlight: !album.isHighlight,
      });
      onPhotosUpdated(res.data.album);
    } catch (err) {
      console.error('Failed to toggle highlight');
    }
  };

  const openLightbox = (index) => {
    setCurrentPhotoIndex(index);
  };

  const closeLightbox = () => {
    setCurrentPhotoIndex(-1);
  };

  const goToPrev = () => {
    setCurrentPhotoIndex((prev) => (prev > 0 ? prev - 1 : album.photos.length - 1));
  };

  const goToNext = () => {
    setCurrentPhotoIndex((prev) => (prev < album.photos.length - 1 ? prev + 1 : 0));
  };

  return (
    <>
      {/* Album Detail Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
            <div>
              <h3 className="font-display font-semibold text-jolshaa-on-surface">{album.title}</h3>
              <p className="text-jolshaa-on-surface-variant text-sm">
                {album.photos.length} photo{album.photos.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isOwner && (
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-sm text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface font-medium"
                >
                  Settings
                </button>
              )}
              {isOwner && (
                <button
                  onClick={() => setShowUpload(!showUpload)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showUpload ? 'Cancel' : '+ Add Photos'}
                </button>
              )}
              <button
                onClick={() => setShowShareModal(true)}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Share
              </button>
              <button
                onClick={onClose}
                className="text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface text-xl ml-2"
              >
                &times;
              </button>
            </div>
          </div>

          {/* Upload area */}
          {showUpload && (
            <div className="p-4 border-b bg-jolshaa-surface-container-low">
              <div
                onClick={() => fileInputRef.current.click()}
                className="border-2 border-dashed border-jolshaa-outline-variant rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors"
              >
                <p className="text-jolshaa-on-surface-variant text-sm">
                  {uploading ? 'Uploading...' : 'Click to select photos (max 20)'}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleUpload}
                className="hidden"
              />
            </div>
          )}

          {showSettings && isOwner && (
            <div className="p-4 border-b bg-jolshaa-surface-container-low space-y-3">
              <input
                type="text"
                value={settingsTitle}
                onChange={(e) => setSettingsTitle(e.target.value)}
                className="w-full border border-jolshaa-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Album title"
              />
              <textarea
                value={settingsDescription}
                onChange={(e) => setSettingsDescription(e.target.value)}
                className="w-full border border-jolshaa-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Description (optional)"
                rows={2}
              />
              <select
                value={settingsVisibility}
                onChange={(e) => setSettingsVisibility(e.target.value)}
                className="w-full border border-jolshaa-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="public">Public</option>
                <option value="friends">Friends</option>
                <option value="onlyme">Only Me</option>
              </select>
              <button
                onClick={handleToggleHighlight}
                className={`text-sm px-3 py-1.5 rounded-lg font-medium ${
                  album.isHighlight
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                {album.isHighlight ? '★ Story Highlight' : '☆ Add to Highlights'}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveSettings}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 bg-jolshaa-surface-container text-jolshaa-on-surface py-2 rounded-lg text-sm font-medium hover:bg-jolshaa-surface-container-high"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Photos grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {album.photos.length === 0 ? (
              <div className="text-center py-12 text-jolshaa-on-surface-variant">
                <p>No photos in this album yet</p>
                {isOwner && (
                  <p className="text-sm mt-1">Click "Add Photos" to get started</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {album.photos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative aspect-square group cursor-pointer"
                    onClick={() => openLightbox(index)}
                  >
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    {isOwner && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePhoto(photo);
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {currentPhotoIndex >= 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-[60] flex items-center justify-center">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white text-3xl z-50 hover:text-jolshaa-outline-variant"
          >
            &times;
          </button>

          <button
            onClick={goToPrev}
            className="absolute left-4 text-white text-4xl z-50 hover:text-jolshaa-outline-variant"
          >
            &#8249;
          </button>

          <img
            src={album.photos[currentPhotoIndex]}
            alt={`Photo ${currentPhotoIndex + 1}`}
            className="max-h-[85vh] max-w-[85vw] object-contain rounded-lg"
          />

          <button
            onClick={goToNext}
            className="absolute right-4 text-white text-4xl z-50 hover:text-jolshaa-outline-variant"
          >
            &#8250;
          </button>

          <div className="absolute bottom-4 text-white text-sm">
            {currentPhotoIndex + 1} / {album.photos.length}
          </div>
        </div>
      )}
      {showShareModal && (
        <ShareModal
          onClose={() => setShowShareModal(false)}
          shareType="album"
          shareId={album._id}
        />
      )}
    </>
  );
};

export default AlbumViewer;
