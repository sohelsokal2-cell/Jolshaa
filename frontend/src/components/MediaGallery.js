import { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';

const MediaGallery = ({ conversationId }) => {
  const [activeTab, setActiveTab] = useState('photos');
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [files, setFiles] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'photos') {
        const res = await API.get(`/conversations/${conversationId}/media`);
        setPhotos(res.data.messages || []);
      } else if (activeTab === 'videos') {
        const res = await API.get(`/conversations/${conversationId}/media`);
        setVideos((res.data.messages || []).filter(m => m.mediaType === 'video'));
      } else if (activeTab === 'files') {
        const res = await API.get(`/conversations/${conversationId}/files`);
        setFiles(res.data.messages || []);
      } else if (activeTab === 'links') {
        const res = await API.get(`/conversations/${conversationId}/links`);
        setLinks(res.data.messages || []);
      }
    } catch (err) { console.error('Failed'); }
    setLoading(false);
  }, [conversationId, activeTab]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const tabs = [
    { id: 'photos', label: 'Photos', count: photos.length },
    { id: 'videos', label: 'Videos', count: videos.length },
    { id: 'files', label: 'Files', count: files.length },
    { id: 'links', label: 'Links', count: links.length },
  ];

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex border-b">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-[10px] font-medium transition ${
              activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-3">
        {loading ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : activeTab === 'photos' ? (
          photos.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No photos shared yet</p>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {photos.map(msg => (
                <div key={msg._id} className="aspect-square cursor-pointer rounded-lg overflow-hidden"
                  onClick={() => setPreviewMedia({ type: 'image', url: msg.media })}>
                  <img src={msg.media} alt="" className="w-full h-full object-cover hover:opacity-90 transition" />
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'videos' ? (
          videos.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No videos shared yet</p>
          ) : (
            <div className="grid grid-cols-2 gap-1">
              {videos.map(msg => (
                <div key={msg._id} className="aspect-video bg-gray-900 rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => setPreviewMedia({ type: 'video', url: msg.media })}>
                  <video src={msg.media} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'files' ? (
          files.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No files shared yet</p>
          ) : (
            <div className="space-y-2">
              {files.map(msg => (
                <a key={msg._id} href={msg.media} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{msg.fileName || 'File'}</p>
                    <p className="text-xs text-gray-400">
                      {msg.fileSize ? `${(msg.fileSize / 1024).toFixed(1)} KB` : ''}
                      {msg.sender?.name && ` · ${msg.sender.name}`}
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
              ))}
            </div>
          )
        ) : (
          links.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No links shared yet</p>
          ) : (
            <div className="space-y-2">
              {links.map(msg => (
                <a key={msg._id} href={msg.linkPreview?.url || msg.text} target="_blank" rel="noopener noreferrer"
                  className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  {msg.linkPreview?.image && (
                    <img src={msg.linkPreview.image} alt="" className="w-full h-32 object-cover rounded-lg mb-2" />
                  )}
                  <p className="text-sm font-medium text-blue-600 truncate">{msg.linkPreview?.url || msg.text}</p>
                  {msg.linkPreview?.title && <p className="text-xs text-gray-600 mt-0.5">{msg.linkPreview.title}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">Shared by {msg.sender?.name}</p>
                </a>
              ))}
            </div>
          )
        )}
      </div>

      {/* Fullscreen preview */}
      {previewMedia && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setPreviewMedia(null)}>
          <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          {previewMedia.type === 'image' ? (
            <img src={previewMedia.url} alt="" className="max-w-[90vw] max-h-[90vh] object-contain" />
          ) : (
            <video src={previewMedia.url} controls className="max-w-[90vw] max-h-[90vh]" />
          )}
        </div>
      )}
    </div>
  );
};

export default MediaGallery;
