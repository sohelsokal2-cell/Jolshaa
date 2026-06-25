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
  const [creating, setCreating] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(null);

  const isOwnProfile = user._id === userId;

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
      const res = await API.post('/albums', { title: newAlbumTitle.trim() });
      setAlbums((prev) => [res.data.album, ...prev]);
      setNewAlbumTitle('');
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
            <div className="aspect-square bg-gray-200" />
            <div className="p-3">
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Albums ({albums.length})</h3>
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
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <input
            type="text"
            placeholder="Album title..."
            value={newAlbumTitle}
            onChange={(e) => setNewAlbumTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateAlbum()}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
          />
          <button
            onClick={handleCreateAlbum}
            disabled={!newAlbumTitle.trim() || creating}
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Album'}
          </button>
        </div>
      )}

      {albums.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
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
              <div className="aspect-square bg-gray-100 relative">
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
                      className="w-12 h-12 text-gray-300"
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
                <h4 className="font-medium text-gray-800 text-sm truncate">
                  {album.title}
                </h4>
                <p className="text-gray-500 text-xs">
                  {album.photos.length} photo{album.photos.length !== 1 ? 's' : ''}
                </p>
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
