import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import AlbumViewer from './AlbumViewer';

const AlbumGrid = ({ userId }) => {
  const { user } = useAuth();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [newAlbumDescription, setNewAlbumDescription] = useState('');
  const [newAlbumVisibility, setNewAlbumVisibility] = useState('friends');
  const [newAlbumHighlight, setNewAlbumHighlight] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(null);

  const isOwnProfile = user.id === userId;

  useEffect(() => {
    fetchAlbums();
  }, [userId]);

  const fetchAlbums = async () => {
    try {
      const res = await API.get(`/albums/user/${userId}`);
      setAlbums(res.data.albums);
    } catch (err) {
      console.error('Failed to fetch albums');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlbum = async () => {
    if (!newAlbumTitle.trim()) return;

    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('title', newAlbumTitle.trim());
      formData.append('description', newAlbumDescription.trim());
      formData.append('visibility', newAlbumVisibility);
      formData.append('isHighlight', newAlbumHighlight);

      const res = await API.post('/albums', formData);
      setAlbums((prev) => [res.data.album, ...prev]);
      setNewAlbumTitle('');
      setNewAlbumDescription('');
      setNewAlbumVisibility('friends');
      setNewAlbumHighlight(false);
      setShowCreate(false);
    } catch (err) {
      console.error('Failed to create album');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAlbum = async (albumId) => {
    if (!window.confirm('Delete this album?')) return;

    try {
      await API.delete(`/albums/${albumId}`);
      setAlbums((prev) => prev.filter((a) => a._id !== albumId));
    } catch (err) {
      console.error('Failed to delete album');
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
            <div className="aspect-square bg-jolshaa-surface-container" />
            <div className="p-3">
              <div className="h-4 bg-jolshaa-surface-container rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display font-semibold text-jolshaa-on-surface">Albums ({albums.length})</h3>
        {isOwnProfile && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showCreate ? 'Cancel' : '+ New Album'}
          </button>
        )}
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 space-y-3">
          <input
            type="text"
            placeholder="Album title..."
            value={newAlbumTitle}
            onChange={(e) => setNewAlbumTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateAlbum()}
            className="w-full border border-jolshaa-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            placeholder="Description (optional)"
            value={newAlbumDescription}
            onChange={(e) => setNewAlbumDescription(e.target.value)}
            className="w-full border border-jolshaa-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
          />
          <select
            value={newAlbumVisibility}
            onChange={(e) => setNewAlbumVisibility(e.target.value)}
            className="w-full border border-jolshaa-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="public">Public</option>
            <option value="friends">Friends</option>
            <option value="onlyme">Only Me</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-jolshaa-on-surface">
            <input
              type="checkbox"
              checked={newAlbumHighlight}
              onChange={(e) => setNewAlbumHighlight(e.target.checked)}
              className="rounded"
            />
            Add to Story Highlights
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleCreateAlbum}
              disabled={!newAlbumTitle.trim() || creating}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Album'}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 bg-jolshaa-surface-container text-jolshaa-on-surface py-2 rounded-lg text-sm font-medium hover:bg-jolshaa-surface-container-high"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {albums.length === 0 ? (
        <div className="text-center py-8 text-jolshaa-on-surface-variant">
          <p>No albums yet</p>
          {isOwnProfile && (
            <p className="text-sm mt-1">Create your first album to organize photos</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {albums.map((album) => (
            <div
              key={album._id}
              className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
              onClick={() => setSelectedAlbum(album)}
            >
              <div className="aspect-square bg-jolshaa-surface-container-low relative">
                {album.photos.length > 0 ? (
                  <>
                    <img
                      src={album.photos[0]}
                      alt={album.title}
                      className="w-full h-full object-cover"
                    />
                    {album.photos.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                        {album.photos.length} photos
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-jolshaa-outline-variant"
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
                  </div>
                )}
                {isOwnProfile && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAlbum(album._id);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    &times;
                  </button>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-medium text-jolshaa-on-surface text-sm truncate">
                    {album.title}
                  </h4>
                  {album.isHighlight && (
                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] rounded-full font-medium">Highlight</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-jolshaa-on-surface-variant text-xs">
                    {album.photos.length} photo{album.photos.length !== 1 ? 's' : ''}
                  </p>
                  <span className="text-[10px] text-jolshaa-on-surface-variant/60 capitalize">{album.visibility}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedAlbum && (
        <AlbumViewer
          album={selectedAlbum}
          onClose={() => setSelectedAlbum(null)}
          isOwner={isOwnProfile}
          onPhotosUpdated={(updatedAlbum) => {
            setAlbums((prev) =>
              prev.map((a) => (a._id === updatedAlbum._id ? updatedAlbum : a))
            );
            setSelectedAlbum(updatedAlbum);
          }}
        />
      )}
    </>
  );
};

export default AlbumGrid;
