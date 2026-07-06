import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Layout from '../components/layout/Layout';

const CATEGORIES = [
  'Business', 'Entertainment', 'Health', 'Education', 'Technology',
  'Sports', 'Music', 'Art', 'Food', 'Travel', 'Other'
];

const CreatePage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: ''
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => { if (profilePreview) URL.revokeObjectURL(profilePreview); };
  }, [profilePreview]);
  useEffect(() => {
    return () => { if (coverPreview) URL.revokeObjectURL(coverPreview); };
  }, [coverPreview]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleProfileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhoto(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverPhoto(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return setError('Page name is required');
    if (!formData.category) return setError('Category is required');

    setLoading(true);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('category', formData.category);
      if (profilePhoto) data.append('profilePhoto', profilePhoto);
      if (coverPhoto) data.append('coverPhoto', coverPhoto);

      const res = await API.post('/pages', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      navigate(`/pages/${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create page');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout logout={logout}>
      <div className="max-w-2xl mx-auto mt-8 px-4">
        <div className="bg-jolshaa-surface-container-lowest rounded-2xl shadow-ambient p-6">
          <h2 className="font-display text-xl font-semibold mb-6 text-jolshaa-on-surface">Create Page</h2>

          {error && <div className="bg-red-500/15 text-red-400 border border-red-500/25 px-4 py-2 rounded mb-4 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">Page Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
                placeholder="My Awesome Page"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 rounded-lg bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
                placeholder="What's this page about?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">Profile Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileChange}
                className="w-full"
              />
              {profilePreview && (
                <img src={profilePreview} alt="" className="mt-2 w-20 h-20 object-cover rounded-full" />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">Cover Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="w-full"
              />
              {coverPreview && (
                <img src={coverPreview} alt="" className="mt-2 h-32 w-full object-cover rounded" />
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-jolshaa-teal text-jolshaa-on-teal hover:bg-jolshaa-teal-container w-full py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating...' : 'Create Page'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CreatePage;
