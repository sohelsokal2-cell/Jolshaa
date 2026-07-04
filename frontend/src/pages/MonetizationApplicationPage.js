import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import Layout from '../components/layout/Layout';

const MonetizationApplicationPage = () => {
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [nidNumber, setNidNumber] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    API.get('/creator/monetization/eligibility')
      .then(res => setEligibility(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleApply = async () => {
    setApplying(true);
    setMessage('');
    try {
      await API.post('/creator/monetization/apply', { nidNumber, tinNumber });
      setMessage('Application submitted successfully! You will be notified once reviewed.');
      setEligibility(prev => ({ ...prev, verificationStatus: 'pending' }));
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3" />
            <div className="h-40 bg-neutral-200 dark:bg-neutral-700 rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  const statusConfig = {
    not_applied: { color: 'text-neutral-600', bg: 'bg-neutral-100 dark:bg-neutral-800', label: 'Not Applied' },
    pending: { color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', label: 'Under Review' },
    approved: { color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', label: 'Approved' },
    rejected: { color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', label: 'Not Approved' },
  };

  const status = statusConfig[eligibility?.verificationStatus] || statusConfig.not_applied;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">
          Creator Monetization
        </h1>

        {eligibility?.isCreator ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-green-800 dark:text-green-200">You are an approved creator!</h2>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Access your <Link to="/creator" className="underline">Creator Dashboard</Link> to manage monetization.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Eligibility Requirements */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 mb-6">
              <h2 className="font-semibold text-lg mb-4 text-neutral-900 dark:text-neutral-100">
                Eligibility Requirements
              </h2>

              <div className="space-y-4">
                {eligibility?.requirements && Object.entries(eligibility.requirements).map(([key, req]) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-neutral-700 dark:text-neutral-300 capitalize">
                        {key === 'accountAge' ? 'Account Age' : key}
                      </span>
                      <span className={`text-sm font-medium ${req.met ? 'text-green-600' : 'text-neutral-500'}`}>
                        {req.met ? '✓ Met' : `${req.current}/${req.required}`}
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${req.met ? 'bg-green-500' : 'bg-primary-500'}`}
                        style={{ width: `${Math.min(100, (req.current / req.required) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Application Status */}
            {eligibility?.verificationStatus !== 'not_applied' && (
              <div className={`${status.bg} border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 mb-6`}>
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-semibold ${status.color}`}>{status.label}</span>
                </div>
                {eligibility?.verificationStatus === 'rejected' && eligibility?.rejectionReason && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                    Reason: {eligibility.rejectionReason}
                  </p>
                )}
              </div>
            )}

            {/* Application Form */}
            {eligibility?.verificationStatus === 'not_applied' && eligibility?.meetsRequirements && (
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 mb-6">
                <h2 className="font-semibold text-lg mb-4 text-neutral-900 dark:text-neutral-100">
                  Apply for Monetization
                </h2>

                <div className="space-y-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      NID Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={nidNumber}
                      onChange={(e) => setNidNumber(e.target.value)}
                      placeholder="National ID number"
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      TIN Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={tinNumber}
                      onChange={(e) => setTinNumber(e.target.value)}
                      placeholder="Tax Identification Number"
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <p className="text-xs text-neutral-500 mb-4">
                  By applying, you agree to our Creator Monetization Terms. Tax information helps with
                  compliance with Bangladesh National Board of Revenue (NBR) requirements.
                </p>

                {message && (
                  <p className={`text-sm mb-4 ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                    {message}
                  </p>
                )}

                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="w-full py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {applying ? 'Submitting...' : 'Apply Now'}
                </button>
              </div>
            )}

            {!eligibility?.meetsRequirements && eligibility?.verificationStatus === 'not_applied' && (
              <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 text-center">
                <p className="text-neutral-600 dark:text-neutral-400">
                  Meet all requirements above to apply for creator monetization.
                </p>
              </div>
            )}
          </>
        )}

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mt-6">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Tax Disclaimer:</strong> Creators are responsible for their own tax reporting to the
            Bangladesh National Board of Revenue (NBR). Jolshaa does not withhold taxes automatically.
            Consult a tax professional for guidance on reporting your earnings.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default MonetizationApplicationPage;
