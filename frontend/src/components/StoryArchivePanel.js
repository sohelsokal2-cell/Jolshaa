import { useState, useEffect } from 'react';
import API from '../api/axios';

const StoryArchivePanel = ({ onClose }) => {
  const [archives, setArchives] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('archive');
  const [showCreateHighlight, setShowCreateHighlight] = useState(false);
  const [highlightTitle, setHighlightTitle] = useState('');
  const [selectedArchive, setSelectedArchive] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [archiveRes, highlightRes] = await Promise.all([
        API.get('/story-archives/archive'),
        API.get(`/story-archives/highlights/${JSON.parse(atob(localStorage.getItem('token')?.split('.')[1] || '')).id || ''}`),
      ]);
      setArchives(archiveRes.data.archives);
      setHighlights(highlightRes.data.highlights);
    } catch (err) {
      console.error('Failed to fetch archive data');
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveStory = async (storyId) => {
    try {
      await API.post(`/story-archives/archive/${storyId}`);
      fetchData();
    } catch (err) {
      console.error('Failed to archive story');
    }
  };

  const handleCreateHighlight = async () => {
    if (!highlightTitle.trim()) return;
    try {
      const formData = new FormData();
      formData.append('title', highlightTitle);
      if (selectedArchive) formData.append('storyArchiveId', selectedArchive);
      await API.post('/story-archives/highlights', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setHighlightTitle('');
      setSelectedArchive(null);
      setShowCreateHighlight(false);
      fetchData();
    } catch (err) {
      console.error('Failed to create highlight');
    }
  };

  const handleDeleteArchive = async (id) => {
    try {
      await API.delete(`/story-archives/archive/${id}`);
      setArchives(prev => prev.filter(a => a._id !== id));
    } catch (err) {
      console.error('Failed to delete archive');
    }
  };

  const handleDeleteHighlight = async (id) => {
    try {
      await API.delete(`/story-archives/highlights/${id}`);
      setHighlights(prev => prev.filter(h => h._id !== id));
    } catch (err) {
      console.error('Failed to delete highlight');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
      <div className="bg-jolshaa-surface-container-lowest rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-jolshaa-outline-variant/50">
          <h2 className="font-display text-lg font-bold text-jolshaa-on-surface">Stories Archive</h2>
          <button onClick={onClose} className="text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex border-b border-jolshaa-outline-variant/50">
          <button
            onClick={() => setActiveTab('archive')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'archive' ? 'text-jolshaa-teal border-b-2 border-jolshaa-teal' : 'text-jolshaa-on-surface-variant'}`}
          >
            Archive ({archives.length})
          </button>
          <button
            onClick={() => setActiveTab('highlights')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'highlights' ? 'text-jolshaa-teal border-b-2 border-jolshaa-teal' : 'text-jolshaa-on-surface-variant'}`}
          >
            Highlights ({highlights.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>
          ) : activeTab === 'archive' ? (
            <div>
              {archives.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-4xl mb-3">📦</p>
                  <p className="text-jolshaa-on-surface-variant text-sm">No archived stories yet</p>
                  <p className="text-jolshaa-on-surface-variant/60 text-xs mt-1">Stories are archived before they expire</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {archives.map((archive) => (
                    <div key={archive._id} className="relative group aspect-[9/16] rounded-lg overflow-hidden bg-black">
                      {archive.mediaType === 'video' ? (
                        <video src={archive.media} className="w-full h-full object-cover" />
                      ) : (
                        <img src={archive.media} alt="" className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => handleDeleteArchive(archive._id)}
                          className="bg-red-500 text-white text-xs px-2 py-1 rounded"
                        >
                          Delete
                        </button>
                      </div>
                      {archive.highlight && (
                        <div className="absolute top-1 right-1 bg-jolshaa-teal text-white text-xs px-1.5 py-0.5 rounded">
                          ★
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <button
                onClick={() => setShowCreateHighlight(true)}
                className="w-full mb-4 p-3 border-2 border-dashed border-jolshaa-outline-variant rounded-xl text-jolshaa-on-surface-variant hover:border-jolshaa-teal hover:text-jolshaa-teal transition-colors text-sm"
              >
                + Create Highlight
              </button>
              {highlights.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-4xl mb-3">⭐</p>
                  <p className="text-jolshaa-on-surface-variant text-sm">No highlights yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {highlights.map((highlight) => (
                    <div key={highlight._id} className="flex items-center gap-3 p-3 bg-jolshaa-surface-container rounded-xl">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-black flex-shrink-0">
                        {highlight.coverImage ? (
                          <img src={highlight.coverImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">⭐</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-jolshaa-on-surface truncate">{highlight.title}</p>
                        <p className="text-xs text-jolshaa-on-surface-variant">{highlight.stories?.length || 0} stories</p>
                      </div>
                      <button
                        onClick={() => handleDeleteHighlight(highlight._id)}
                        className="text-red-500 hover:text-red-600 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {showCreateHighlight && (
          <div className="p-4 border-t border-jolshaa-outline-variant/50">
            <input
              type="text"
              value={highlightTitle}
              onChange={(e) => setHighlightTitle(e.target.value)}
              placeholder="Highlight title..."
              className="w-full border border-jolshaa-outline-variant rounded-lg px-3 py-2 text-sm mb-2 bg-jolshaa-surface-container-lowest text-jolshaa-on-surface"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowCreateHighlight(false); setHighlightTitle(''); }}
                className="flex-1 py-2 text-sm text-jolshaa-on-surface hover:bg-jolshaa-surface-container rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateHighlight}
                disabled={!highlightTitle.trim()}
                className="flex-1 py-2 text-sm bg-jolshaa-teal text-white rounded-lg hover:bg-jolshaa-teal-dark disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryArchivePanel;
