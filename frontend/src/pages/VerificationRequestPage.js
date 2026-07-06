import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

const VerificationRequestPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [requested, setRequested] = useState(!!user?.verificationRequested);

  useEffect(() => {
    setRequested(!!user?.verificationRequested);
  }, [user]);

  const submit = async () => {
    if (!reason.trim()) {
      setError('Please tell us why you should be verified.');
      return;
    }
    setError('');
    setSending(true);
    try {
      await API.post('/users/request-verification', { reason: reason.trim() });
      setRequested(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto py-6 px-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-jolshaa-surface-container-low transition-colors">
            <svg className="w-5 h-5 text-jolshaa-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-display text-xl font-bold text-jolshaa-on-surface">Get Verified</h1>
        </div>

        {user?.isVerified ? (
          <div className="rounded-xl border border-jolshaa-outline-variant bg-jolshaa-surface-container-lowest p-6 text-center">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-sm font-medium text-jolshaa-on-surface">Your account is already verified.</p>
          </div>
        ) : requested ? (
          <div className="rounded-xl border border-jolshaa-outline-variant bg-jolshaa-surface-container-lowest p-6 text-center">
            <div className="text-3xl mb-2">⏳</div>
            <p className="text-sm font-medium text-jolshaa-on-surface mb-1">Verification request pending</p>
            <p className="text-xs text-jolshaa-on-surface-variant">Our team is reviewing your request. We'll notify you once it's processed.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-jolshaa-outline-variant bg-jolshaa-surface-container-lowest p-4 space-y-4">
            <p className="text-xs text-jolshaa-on-surface-variant">
              Tell us why your account should receive the verified badge (public figure, brand, creator, organization, etc.).
            </p>
            {error && <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
            <textarea
              rows={5}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Explain your case for verification..."
              className="w-full px-3 py-2 rounded-lg text-sm bg-jolshaa-surface-container-low border border-jolshaa-outline-variant text-jolshaa-on-surface outline-none focus:border-jolshaa-teal focus:ring-2 focus:ring-jolshaa-teal/20 resize-none"
            />
            <Button onClick={submit} loading={sending} fullWidth size="lg">
              Submit Request
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default VerificationRequestPage;
