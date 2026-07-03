import { useState } from 'react';
import API from '../api/axios';

const HELP_TYPES = [
  { value: 'medical', label: '🏥 Medical' },
  { value: 'flood', label: '🌊 Flood' },
  { value: 'fire', label: '🔥 Fire' },
  { value: 'lost_person', label: '🔍 Lost Person' },
  { value: 'food', label: '🍲 Food' },
  { value: 'shelter', label: '🏠 Shelter' },
  { value: 'financial', label: '💰 Financial' },
  { value: 'other', label: '🆘 Other' },
];

const URGENCY_OPTIONS = [
  { value: 'immediate', label: 'Immediate', emoji: '🔴', hours: 6 },
  { value: 'within_hours', label: 'Within hours', emoji: '🟡', hours: 24 },
  { value: 'within_days', label: 'Within days', emoji: '🟢', hours: 72 },
];

const DIVISIONS = [
  'Barisal', 'Chittagong', 'Dhaka', 'Khulna', 'Mymensingh', 'Rajshahi', 'Rangpur', 'Sylhet'
];

const DISTRICTS = {
  Barisal: ['Barguna', 'Barisal', 'Bhola', 'Jhalokati', 'Patuakhali', 'Pirojpur'],
  Chittagong: ['Bandarban', 'Brahmanbaria', 'Chandpur', 'Chittagong', 'Comilla', 'Cox\'s Bazar', 'Feni', 'Khagrachhari', 'Lakshmipur', 'Noakhali', 'Rangamati'],
  Dhaka: ['Dhaka', 'Faridpur', 'Gazipur', 'Gopalganj', 'Kishoreganj', 'Madaripur', 'Manikganj', 'Munshiganj', 'Narayanganj', 'Narsingdi', 'Rajbari', 'Shariatpur', 'Tangail'],
  Khulna: ['Bagerhat', 'Chuadanga', 'Jessore', 'Jhenaidah', 'Khulna', 'Kushtia', 'Magura', 'Narail', 'Satkhira'],
  Mymensingh: ['Jamalpur', 'Mymensingh', 'Netrakona', 'Sherpur'],
  Rajshahi: ['Bogra', 'Chapainawabganj', 'Joypurhat', 'Naogaon', 'Natore', 'Pabna', 'Rajshahi', 'Sirajganj'],
  Rangpur: ['Dinajpur', 'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Rangpur', 'Thakurgaon'],
  Sylhet: ['Habiganj', 'Moulvibazar', 'Sunamganj', 'Sylhet'],
};

const CreateHelpRequestModal = ({ onClose, post }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [helpType, setHelpType] = useState('other');
  const [urgency, setUrgency] = useState('immediate');
  const [division, setDivision] = useState('');
  const [district, setDistrict] = useState('');
  const [upazila, setUpazila] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedUrgency = URGENCY_OPTIONS.find(u => u.value === urgency);
  const expiryHours = selectedUrgency?.hours || 6;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !division || !district) {
      return setError('Please fill in all required fields');
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        helpType,
        urgency,
        location: { division, district, upazila },
      };

      if (post?._id) {
        await API.post(`/help/posts/${post._id}/help`, payload);
      } else {
        await API.post('/help/request', payload);
      }

      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create help request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-700 sticky top-0 bg-white dark:bg-neutral-800 z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              🆘 Request Help
            </h3>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-xs">{error}</div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              What kind of help is needed? *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description (max 100 chars)"
              maxLength={100}
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 bg-white dark:bg-neutral-700"
            />
            <p className="text-xs text-neutral-400 mt-1">{title.length}/100</p>
          </div>

          {/* Help Type */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Help Type *
            </label>
            <select
              value={helpType}
              onChange={(e) => setHelpType(e.target.value)}
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 bg-white dark:bg-neutral-700"
            >
              {HELP_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Detailed Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What happened? Why is help needed? How can you help?"
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 bg-white dark:bg-neutral-700 resize-none"
              rows={4}
            />
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Urgency Level *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {URGENCY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setUrgency(opt.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                    urgency === opt.value
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <span className="text-xl">{opt.emoji}</span>
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{opt.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-neutral-400 mt-1.5">
              Note: This request will expire in {expiryHours} hours
            </p>
          </div>

          {/* Location */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Location *
            </label>
            <select
              value={division}
              onChange={(e) => { setDivision(e.target.value); setDistrict(''); }}
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 bg-white dark:bg-neutral-700"
            >
              <option value="">Select Division</option>
              {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            {division && (
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full border border-neutral-300 dark:border-neutral-600 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 bg-white dark:bg-neutral-700"
              >
                <option value="">Select District</option>
                {(DISTRICTS[division] || []).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            )}

            {district && (
              <input
                type="text"
                value={upazila}
                onChange={(e) => setUpazila(e.target.value)}
                placeholder="Upazila (optional)"
                className="w-full border border-neutral-300 dark:border-neutral-600 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 bg-white dark:bg-neutral-700"
              />
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !title.trim() || !description.trim() || !division || !district}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              'Submit Help Request 🆘'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateHelpRequestModal;
