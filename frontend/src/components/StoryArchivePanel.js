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
      <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Stories Archive</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex border-b border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => setActiveTab('archive')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'archive' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-neutral-500'}`}
          >
            Archive ({archives.length})
          </button>
          <button
            onClick={() => setActiveTab('highlights')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'highlights' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-neutral-500'}`}
          >
            Highlights ({highlights.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-neutral-500">Loading...</div>
          ) : activeTab === 'archive' ? (
            <div>
              {archives.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-4xl mb-3">📦</p>
                  <p className="text-neutral-500 text-sm">No archived stories yet</p>
                  <p className="text-neutral-400 text-xs mt-1">Stories are archived before they expire</p>
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
                        <div className="absolute top-1 right-1 bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded">
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
                className="w-full mb-4 p-3 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-xl text-neutral-500 hover:border-primary-500 hover:text-primary-500 transition-colors text-sm"
              >
                + Create Highlight
              </button>
              {highlights.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-4xl mb-3">⭐</p>
                  <p className="text-neutral-500 text-sm">No highlights yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {highlights.map((highlight) => (
                    <div key={highlight._id} className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-black flex-shrink-0">
                        {highlight.coverImage ? (
                          <img src={highlight.coverImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">⭐</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-neutral-900 dark:text-white truncate">{highlight.title}</p>
                        <p className="text-xs text-neutral-500">{highlight.stories?.length || 0} stories</p>
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
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
            <input
              type="text"
              value={highlightTitle}
              onChange={(e) => setHighlightTitle(e.target.value)}
              placeholder="Highlight title..."
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm mb-2 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowCreateHighlight(false); setHighlightTitle(''); }}
                className="flex-1 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateHighlight}
                disabled={!highlightTitle.trim()}
                className="flex-1 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
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
