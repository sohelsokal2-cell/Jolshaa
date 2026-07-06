import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Layout from '../components/layout/Layout';

const CreateEvent = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    visibility: 'public'
  });
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Cover photo must be under 10MB');
      return;
    }
    setCoverPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.startDate) {
      setError('Title and start date are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('description', formData.description);
      fd.append('location', formData.location);
      fd.append('visibility', formData.visibility);

      const startDateTime = formData.startTime
        ? `${formData.startDate}T${formData.startTime}`
        : formData.startDate;
      fd.append('startDate', new Date(startDateTime).toISOString());

      if (formData.endDate) {
        const endDateTime = formData.endTime
          ? `${formData.endDate}T${formData.endTime}`
          : formData.endDate;
        fd.append('endDate', new Date(endDateTime).toISOString());
      }

      if (coverPhoto) {
        fd.append('coverPhoto', coverPhoto);
      }

      const res = await API.post('/events', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      navigate(`/events/${res.data.event._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto mt-8 px-4">
        <div className="bg-jolshaa-surface-container-lowest rounded-2xl shadow-ambient p-6">
          <h2 className="font-display text-xl font-semibold mb-6 text-jolshaa-on-surface">Create Event</h2>

          {error && <div className="bg-red-500/15 text-red-400 border border-red-500/25 px-4 py-2 rounded mb-4 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">Event Name *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Event name"
                className="w-full rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">Cover Photo</label>
              <div className="relative">
                <div className="h-40 bg-jolshaa-surface-container-high rounded-lg overflow-hidden flex items-center justify-center">
                  {preview ? (
                    <img src={preview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-12 h-12 text-jolshaa-on-surface-variant/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="absolute bottom-2 right-2 bg-jolshaa-surface-container-high text-sm px-3 py-1 rounded shadow hover:bg-jolshaa-surface-container-high"
                >
                  {preview ? 'Change' : 'Add Photo'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Tell people about your event"
                className="w-full rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Event location"
                className="w-full rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">Start Time</label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className="w-full rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">End Time</label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className="w-full rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">Visibility</label>
              <select
                name="visibility"
                value={formData.visibility}
                onChange={handleChange}
                className="w-full rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
              >
                <option value="public">Public</option>
                <option value="friends">Friends</option>
                <option value="invite_only">Invite Only</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-jolshaa-teal text-jolshaa-on-teal hover:bg-jolshaa-teal-container py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CreateEvent;
