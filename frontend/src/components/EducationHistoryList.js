import { useState } from 'react';
import AddEditEducationModal from './AddEditEducationModal';
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

const EducationHistoryList = ({ educationHistory = [], isOwner, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const sorted = [...(educationHistory || [])].sort((a, b) => {
    if (a.isCurrent && !b.isCurrent) return -1;
    if (!a.isCurrent && b.isCurrent) return 1;
    const da = a.startDate ? new Date(a.startDate) : 0;
    const db = b.startDate ? new Date(b.startDate) : 0;
    return db - da;
  });

  const handleSave = async (data) => {
    if (editingEntry) {
      await API.put(`/users/education/${editingEntry._id}`, data);
    } else {
      await API.post('/users/education', data);
    }
    onUpdate();
  };

  const handleDelete = async (entry) => {
    if (!window.confirm('Remove this education entry?')) return;
    setDeleting(entry._id);
    try {
      await API.delete(`/users/education/${entry._id}`);
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
        <h4 className="text-sm font-semibold text-jolshaa-on-surface">Education</h4>
        {isOwner && (
          <button
            onClick={handleAdd}
            className="p-1.5 rounded-lg text-jolshaa-teal hover:bg-jolshaa-teal/10 transition-colors"
            aria-label="Add education"
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
              Add your education
            </button>
          ) : (
            <p className="text-sm text-jolshaa-on-surface-variant">No education added</p>
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
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-jolshaa-on-surface">{entry.institution}</p>
                {(entry.degree || entry.fieldOfStudy) && (
                  <p className="text-sm text-jolshaa-on-surface-variant">
                    {[entry.degree, entry.fieldOfStudy].filter(Boolean).join(' in ')}
                  </p>
                )}
                {formatDuration(entry.startDate, entry.endDate, entry.isCurrent) && (
                  <p className="text-xs text-jolshaa-on-surface-variant mt-0.5">
                    {formatDuration(entry.startDate, entry.endDate, entry.isCurrent)}
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

      <AddEditEducationModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingEntry(null); }}
        entry={editingEntry}
        onSave={handleSave}
      />
    </div>
  );
};

export default EducationHistoryList;
