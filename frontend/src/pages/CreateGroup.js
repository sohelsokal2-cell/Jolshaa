import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Layout from '../components/layout/Layout';

const CreateGroup = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    privacy: 'public'
  });
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return setError('Group name is required');

    setLoading(true);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('privacy', formData.privacy);
      if (coverPhoto) data.append('coverPhoto', coverPhoto);

      const res = await API.post('/groups', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      navigate(`/groups/${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto mt-8 px-4">
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-6 text-on-surface">Create Group</h2>

          {error && <div className="bg-red-500/15 text-red-400 px-4 py-2 rounded-lg mb-4 text-sm border border-red-500/25">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Group Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                placeholder="My Awesome Group"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="input"
                placeholder="What's this group about?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Privacy</label>
              <select
                name="privacy"
                value={formData.privacy}
                onChange={handleChange}
                className="input"
              >
                <option value="public">Public - Anyone can join</option>
                <option value="private">Private - Requires approval</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Cover Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-on-surface-variant"
              />
              {preview && (
                <img src={preview} alt="Cover preview" className="mt-2 h-32 w-full object-cover rounded-lg" />
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CreateGroup;
