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
            <div className="h-8 bg-jolshaa-surface-container-high rounded w-1/3" />
            <div className="h-40 bg-jolshaa-surface-container-high rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  const statusConfig = {
    not_applied: { color: 'text-jolshaa-on-surface-variant', bg: 'bg-jolshaa-surface-container-high', label: 'Not Applied' },
    pending: { color: 'text-amber-600', bg: 'bg-amber-50', label: 'Under Review' },
    approved: { color: 'text-green-600', bg: 'bg-green-50', label: 'Approved' },
    rejected: { color: 'text-red-600', bg: 'bg-red-50', label: 'Not Approved' },
  };

  const status = statusConfig[eligibility?.verificationStatus] || statusConfig.not_applied;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="font-display text-2xl font-bold mb-6 text-jolshaa-on-surface">
          Creator Monetization
        </h1>

        {eligibility?.isCreator ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="font-display font-semibold text-green-800">You are an approved creator!</h2>
                <p className="text-sm text-green-600">
                  Access your <Link to="/creator" className="underline">Creator Dashboard</Link> to manage monetization.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Eligibility Requirements */}
            <div className="bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-xl p-6 mb-6">
              <h2 className="font-display font-semibold text-lg mb-4 text-jolshaa-on-surface">
                Eligibility Requirements
              </h2>

              <div className="space-y-4">
                {eligibility?.requirements && Object.entries(eligibility.requirements).map(([key, req]) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-jolshaa-on-surface capitalize">
                        {key === 'accountAge' ? 'Account Age' : key}
                      </span>
                      <span className={`text-sm font-medium ${req.met ? 'text-green-600' : 'text-jolshaa-on-surface-variant'}`}>
                        {req.met ? '✓ Met' : `${req.current}/${req.required}`}
                      </span>
                    </div>
                    <div className="w-full bg-jolshaa-surface-container-high rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${req.met ? 'bg-green-500' : 'bg-jolshaa-teal'}`}
                        style={{ width: `${Math.min(100, (req.current / req.required) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Application Status */}
            {eligibility?.verificationStatus !== 'not_applied' && (
              <div className={`${status.bg} border border-jolshaa-outline-variant rounded-xl p-6 mb-6`}>
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-semibold ${status.color}`}>{status.label}</span>
                </div>
                {eligibility?.verificationStatus === 'rejected' && eligibility?.rejectionReason && (
                  <p className="text-sm text-red-600 mt-2">
                    Reason: {eligibility.rejectionReason}
                  </p>
                )}
              </div>
            )}

            {/* Application Form */}
            {eligibility?.verificationStatus === 'not_applied' && eligibility?.meetsRequirements && (
              <div className="bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-xl p-6 mb-6">
                <h2 className="font-display font-semibold text-lg mb-4 text-jolshaa-on-surface">
                  Apply for Monetization
                </h2>

                <div className="space-y-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-jolshaa-on-surface mb-1">
                      NID Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={nidNumber}
                      onChange={(e) => setNidNumber(e.target.value)}
                      placeholder="National ID number"
                      className="w-full px-3 py-2 border border-jolshaa-outline rounded-lg bg-jolshaa-surface-container-highest text-jolshaa-on-surface text-sm focus:ring-2 focus:ring-jolshaa-teal focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-jolshaa-on-surface mb-1">
                      TIN Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={tinNumber}
                      onChange={(e) => setTinNumber(e.target.value)}
                      placeholder="Tax Identification Number"
                      className="w-full px-3 py-2 border border-jolshaa-outline rounded-lg bg-jolshaa-surface-container-highest text-jolshaa-on-surface text-sm focus:ring-2 focus:ring-jolshaa-teal focus:border-transparent"
                    />
                  </div>
                </div>

                <p className="text-xs text-jolshaa-on-surface-variant mb-4">
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
                  className="w-full py-2.5 bg-jolshaa-teal text-white rounded-lg font-medium hover:bg-jolshaa-teal-container disabled:opacity-50 transition-colors"
                >
                  {applying ? 'Submitting...' : 'Apply Now'}
                </button>
              </div>
            )}

            {!eligibility?.meetsRequirements && eligibility?.verificationStatus === 'not_applied' && (
              <div className="bg-jolshaa-surface-container-high border border-jolshaa-outline-variant rounded-xl p-6 text-center">
                <p className="text-jolshaa-on-surface-variant">
                  Meet all requirements above to apply for creator monetization.
                </p>
              </div>
            )}
          </>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
          <p className="text-xs text-blue-700">
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
