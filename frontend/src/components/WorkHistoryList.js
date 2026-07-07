import { useState } from 'react';
import AddEditWorkModal from './AddEditWorkModal';
import API from '../api/axios';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const formatDuration = (start, end, isCurrent) => {
  const s = formatDate(start);
  if (isCurrent) return s ? `${s} - Present` : 'Present';
  const e = formatDate(end);
  if (s && e) return `${s} - ${e}`;
  if (s) return s;
  if (e) return e;
  return '';
};

const WorkHistoryList = ({ workHistory = [], isOwner, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const sorted = [...(workHistory || [])].sort((a, b) => {
    if (a.isCurrent && !b.isCurrent) return -1;
    if (!a.isCurrent && b.isCurrent) return 1;
    const da = a.startDate ? new Date(a.startDate) : 0;
    const db = b.startDate ? new Date(b.startDate) : 0;
    return db - da;
  });

  const handleSave = async (data) => {
    if (editingEntry) {
      await API.put(`/users/work/${editingEntry._id}`, data);
    } else {
      await API.post('/users/work', data);
    }
    onUpdate();
  };

  const handleDelete = async (entry) => {
    if (!window.confirm('Remove this work experience?')) return;
    setDeleting(entry._id);
    try {
      await API.delete(`/users/work/${entry._id}`);
      onUpdate();
    } catch (_) {
      // ignore
    } finally {
      setDeleting(null);
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingEntry(null);
    setShowModal(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-jolshaa-on-surface">Work</h4>
        {isOwner && (
          <button
            onClick={handleAdd}
            className="p-1.5 rounded-lg text-jolshaa-teal hover:bg-jolshaa-teal/10 transition-colors"
            aria-label="Add work experience"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-4">
          {isOwner ? (
            <button onClick={handleAdd} className="text-sm text-jolshaa-teal hover:underline">
              Add your work experience
            </button>
          ) : (
            <p className="text-sm text-jolshaa-on-surface-variant">No work experience added</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((entry) => (
            <div
              key={entry._id}
              className="group flex items-start gap-3 p-3 rounded-lg hover:bg-jolshaa-surface-container-low transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-jolshaa-surface-container flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-jolshaa-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-jolshaa-on-surface">{entry.company}</p>
                {entry.position && (
                  <p className="text-sm text-jolshaa-on-surface-variant">{entry.position}</p>
                )}
                {formatDuration(entry.startDate, entry.endDate, entry.isCurrent) && (
                  <p className="text-xs text-jolshaa-on-surface-variant mt-0.5">
                    {formatDuration(entry.startDate, entry.endDate, entry.isCurrent)}
                    {entry.location && ` · ${entry.location}`}
                  </p>
                )}
                {entry.description && (
                  <p className="text-xs text-jolshaa-on-surface-variant mt-1">{entry.description}</p>
                )}
              </div>
              {isOwner && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={() => handleEdit(entry)}
                    className="p-1.5 rounded-lg text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container transition-colors"
                    aria-label="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(entry)}
                    disabled={deleting === entry._id}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    aria-label="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AddEditWorkModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingEntry(null); }}
        entry={editingEntry}
        onSave={handleSave}
      />
    </div>
  );
};

export default WorkHistoryList;
