import { useState, useEffect } from 'react';
import Modal, { ModalBody, ModalFooter } from './ui/Modal';

const AddEditEducationModal = ({ isOpen, onClose, entry, onSave }) => {
  const [formData, setFormData] = useState({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (entry) {
      setFormData({
        institution: entry.institution || '',
        degree: entry.degree || '',
        fieldOfStudy: entry.fieldOfStudy || '',
        startDate: entry.startDate ? entry.startDate.split('T')[0] : '',
        endDate: entry.endDate ? entry.endDate.split('T')[0] : '',
        isCurrent: entry.isCurrent || false,
        description: entry.description || ''
      });
    } else {
      setFormData({ institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', isCurrent: false, description: '' });
    }
    setError('');
  }, [entry, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'isCurrent' && checked ? { endDate: '' } : {})
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.institution.trim()) {
      setError('Institution name is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSave({
        ...formData,
        startDate: formData.startDate || null,
        endDate: formData.isCurrent ? null : (formData.endDate || null)
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={entry ? 'Edit Education' : 'Add Education'} size="md">
      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-4">
          {error && (
            <div className="bg-red-500/15 text-red-400 border border-red-500/25 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">Institution *</label>
            <input
              type="text"
              name="institution"
              value={formData.institution}
              onChange={handleChange}
              placeholder="e.g. University of Dhaka"
              className="w-full rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">Degree</label>
            <input
              type="text"
              name="degree"
              value={formData.degree}
              onChange={handleChange}
              placeholder="e.g. Bachelor's, HSC, SSC"
              className="w-full rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">Field of Study</label>
            <input
              type="text"
              name="fieldOfStudy"
              value={formData.fieldOfStudy}
              onChange={handleChange}
              placeholder="e.g. Computer Science"
              className="w-full rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                disabled={formData.isCurrent}
                className="w-full rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="isCurrent"
              checked={formData.isCurrent}
              onChange={handleChange}
              className="w-4 h-4 rounded border-jolshaa-outline-variant text-jolshaa-teal focus:ring-jolshaa-teal"
            />
            <span className="text-sm text-jolshaa-on-surface">I currently study here</span>
          </label>

          <div>
            <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Activities, achievements, etc."
              className="w-full rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container-low transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-jolshaa-teal text-jolshaa-on-teal hover:bg-jolshaa-teal-container transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : entry ? 'Save Changes' : 'Add'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default AddEditEducationModal;
