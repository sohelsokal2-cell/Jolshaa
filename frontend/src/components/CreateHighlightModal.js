import { useState, useEffect } from 'react';
import Modal, { ModalBody, ModalFooter } from './ui/Modal';
import API from '../api/axios';

const CreateHighlightModal = ({ isOpen, onClose, onCreated }) => {
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    fetchArchives();
  }, [isOpen]);

  const fetchArchives = async () => {
    setLoading(true);
    try {
      const res = await API.get('/story-archives/archive');
      setArchives(res.data.archives.filter((a) => !a.highlight));
    } catch (err) {
      console.error('Failed to fetch archived stories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await API.post('/story-archives/highlights', {
        title: title.trim(),
        storyArchiveId: selectedId || undefined,
      });
      onCreated?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create highlight');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Highlight" size="sm">
      <ModalBody>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Highlight title"
          maxLength={50}
          className="w-full px-3 py-2 rounded-lg border border-jolshaa-outline-variant bg-jolshaa-surface-container-lowest text-sm mb-3"
        />
        <p className="text-xs text-jolshaa-on-surface-variant mb-2">
          Pick an archived story to add (optional, you can add more later):
        </p>
        {loading ? (
          <p className="text-sm text-jolshaa-on-surface-variant">Loading...</p>
        ) : archives.length === 0 ? (
          <p className="text-sm text-jolshaa-on-surface-variant">No archived stories available yet.</p>
        ) : (
          <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
            {archives.map((archive) => (
              <button
                key={archive._id}
                onClick={() => setSelectedId(archive._id === selectedId ? null : archive._id)}
                className={`aspect-square rounded-lg overflow-hidden border-2 ${selectedId === archive._id ? 'border-jolshaa-teal' : 'border-transparent'}`}
              >
                {archive.mediaType === 'video' ? (
                  <video src={archive.media} className="w-full h-full object-cover" />
                ) : (
                  <img src={archive.media} alt="" className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        )}
        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
      </ModalBody>
      <ModalFooter>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-jolshaa-surface-container text-jolshaa-on-surface hover:bg-jolshaa-surface-container-low transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-jolshaa-teal text-jolshaa-on-teal hover:bg-jolshaa-teal-container transition-colors disabled:opacity-50"
        >
          {saving ? 'Creating...' : 'Create'}
        </button>
      </ModalFooter>
    </Modal>
  );
};

export default CreateHighlightModal;
