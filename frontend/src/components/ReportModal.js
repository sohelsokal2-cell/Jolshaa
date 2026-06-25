import { useState } from 'react';
import API from '../api/axios';

const ReportModal = ({ targetType, targetId, onClose }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const reasons = [
    { value: 'spam', label: 'Spam' },
    { value: 'harassment', label: 'Harassment or Bullying' },
    { value: 'hate_speech', label: 'Hate Speech' },
    { value: 'violence', label: 'Violence or Threats' },
    { value: 'nudity', label: 'Nudity or Sexual Content' },
    { value: 'misinformation', label: 'Misinformation' },
    { value: 'copyright', label: 'Copyright Infringement' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = async () => {
    if (!reason) {
      setError('Please select a reason');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await API.post('/reports', {
        targetType,
        targetId,
        reason,
        description,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-800">Report</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            &times;
          </button>
        </div>

        <div className="p-4">
          {submitted ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-800 font-medium">Report Submitted</p>
              <p className="text-gray-500 text-sm mt-1">
                Thank you for helping keep our community safe.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <p className="text-gray-600 text-sm mb-4">
                Why are you reporting this {targetType}?
              </p>

              <div className="space-y-2 mb-4">
                {reasons.map((r) => (
                  <label
                    key={r.value}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      reason === r.value
                        ? 'bg-blue-50 border border-blue-300'
                        : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={(e) => setReason(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{r.label}</span>
                  </label>
                ))}
              </div>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional details (optional)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                maxLength={500}
              />

              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!reason || submitting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
