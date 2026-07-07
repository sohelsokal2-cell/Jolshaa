import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Layout from '../components/layout/Layout';
import { useLanguage } from '../context/LanguageContext';

const EditProfile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(null);
  const profileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bio: '',
    profilePhoto: '',
    coverPhoto: '',
    gender: 'prefer not to say',
    dateOfBirth: '',
    education: '',
    work: '',
    location: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        bio: user.bio || '',
        profilePhoto: user.profilePhoto || '',
        coverPhoto: user.coverPhoto || '',
        gender: user.gender || 'prefer not to say',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        education: user.education || '',
        work: user.work || '',
        location: user.location || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handlePhotoUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB');
      return;
    }

    setUploading(type);
    setError('');
    try {
      const fd = new FormData();
      fd.append('media', file);
      const res = await API.post('/posts', fd, {
        params: { text: ' ', postedInType: 'profile' },
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const mediaItem = res.data.media[0];
      const url = typeof mediaItem === 'string' ? mediaItem : mediaItem?.url || '';
      setFormData(prev => ({ ...prev, [type === 'profile' ? 'profilePhoto' : 'coverPhoto']: url }));
    } catch (err) {
      setError('Upload failed. Try again.');
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await API.put(`/users/${user.id}`, formData);
      updateUser(res.data);
      setSuccess('Profile updated successfully');
      setTimeout(() => navigate('/feed'), 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showSidebar={false}>
      <div className="max-w-lg mx-auto mt-8 px-4">
        <div className="bg-jolshaa-surface-container-lowest rounded-2xl shadow-ambient p-6">
          <h2 className="font-display text-xl font-semibold mb-6 text-jolshaa-on-surface">{t('editProfile.title')}</h2>

          {error && <div className="bg-red-500/15 text-red-400 border border-red-500/25 px-4 py-2 rounded mb-4 text-sm">{error}</div>}
          {success && <div className="bg-green-500/15 text-green-400 border border-green-500/25 px-4 py-2 rounded mb-4 text-sm">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">Profile Photo</label>
              <div className="flex items-center gap-4">
                <img
                  src={formData.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <input
                    type="file"
                    ref={profileInputRef}
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, 'profile')}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => profileInputRef.current.click()}
                    disabled={uploading === 'profile'}
                    className="text-sm text-jolshaa-teal hover:underline disabled:opacity-50"
                  >
                    {uploading === 'profile' ? 'Uploading...' : 'Change Photo'}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">Cover Photo</label>
              <div className="relative">
                <div className="h-32 bg-gradient-to-r from-jolshaa-teal to-jolshaa-indigo rounded-lg overflow-hidden">
                  {formData.coverPhoto && (
                    <img src={formData.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
                  )}
                </div>
                <input
                  type="file"
                  ref={coverInputRef}
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e, 'cover')}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => coverInputRef.current.click()}
                  disabled={uploading === 'cover'}
                  className="absolute bottom-2 right-2 bg-jolshaa-surface-container-lowest text-sm px-3 py-1 rounded shadow hover:bg-jolshaa-surface-container-low disabled:opacity-50"
                >
                  {uploading === 'cover' ? 'Uploading...' : 'Change Cover'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">{t('editProfile.name')}</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">{t('editProfile.bio')}</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                maxLength={200}
                rows={3}
                className="w-full rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
              />
              <p className="text-xs text-jolshaa-on-surface-variant/60 mt-1">{formData.bio.length}/200</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">Work</label>
              <input
                type="text"
                name="work"
                value={formData.work}
                onChange={handleChange}
                placeholder="e.g. Software Engineer at Google"
                className="w-full rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">Education</label>
              <input
                type="text"
                name="education"
                value={formData.education}
                onChange={handleChange}
                placeholder="e.g. MIT, Computer Science"
                className="w-full rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">{t('editProfile.location')}</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Dhaka, Bangladesh"
                className="w-full rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
              />
            </div>

            <button
              type="submit"
              disabled={loading || uploading}
              className="bg-jolshaa-teal text-jolshaa-on-teal hover:bg-jolshaa-teal-container w-full disabled:opacity-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              {loading ? 'Saving...' : t('editProfile.saveChanges')}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default EditProfile;
