import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';

const TYPES = [
  { key: 'ban', label: 'Account Ban' },
  { key: 'suspend', label: 'Suspension' },
  { key: 'warning', label: 'Warning' },
  { key: 'restriction', label: 'Restriction' },
];

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700',
  reviewed: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const AppealPage = () => {
  const navigate = useNavigate();
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('ban');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    loadAppeals();
  }, []);

  const loadAppeals = async () => {
    try {
      const res = await API.get('/users/my-appeals');
      setAppeals(res.data.appeals || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!reason.trim()) {
      setError('Please explain your reason for appeal.');
      return;
    }
    setError('');
    setSending(true);
    try {
      await API.post('/users/appeals', { type, reason: reason.trim() });
      setReason('');
      setSent(true);
      loadAppeals();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit appeal.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin w-8 h-8 border-2 border-jolshaa-teal border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto py-6 px-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-jolshaa-surface-container-low transition-colors">
            <svg className="w-5 h-5 text-jolshaa-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-display text-xl font-bold text-jolshaa-on-surface">Submit an Appeal</h1>
        </div>

        <div className="rounded-xl border border-jolshaa-outline-variant bg-jolshaa-surface-container-lowest p-4 space-y-4 mb-6">
          {error && <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
          {sent && <div className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">Appeal submitted. We'll review it soon.</div>}

          <div>
            <label className="text-xs text-jolshaa-on-surface-variant mb-1 block">Appeal Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm bg-jolshaa-surface-container-low border border-jolshaa-outline-variant text-jolshaa-on-surface outline-none focus:border-jolshaa-teal focus:ring-2 focus:ring-jolshaa-teal/20"
            >
              {TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-jolshaa-on-surface-variant mb-1 block">Reason for Appeal</label>
            <textarea
              rows={5}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Explain why you believe this action should be reversed..."
              className="w-full px-3 py-2 rounded-lg text-sm bg-jolshaa-surface-container-low border border-jolshaa-outline-variant text-jolshaa-on-surface outline-none focus:border-jolshaa-teal focus:ring-2 focus:ring-jolshaa-teal/20 resize-none"
            />
          </div>

          <Button onClick={submit} loading={sending} fullWidth size="lg">
            Submit Appeal
          </Button>
        </div>

        {appeals.length > 0 && (
          <div>
            <h2 className="font-display text-xs font-semibold text-jolshaa-on-surface-variant mb-3 uppercase tracking-wide">Your Appeals</h2>
            <div className="space-y-3">
              {appeals.map(appeal => (
                <div key={appeal._id} className="rounded-xl border border-jolshaa-outline-variant bg-jolshaa-surface-container-lowest p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-jolshaa-on-surface capitalize">{appeal.type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[appeal.status] || ''}`}>
                      {appeal.status}
                    </span>
                  </div>
                  <p className="text-xs text-jolshaa-on-surface-variant line-clamp-2">{appeal.reason}</p>
                  {appeal.adminNote && (
                    <p className="text-xs text-jolshaa-on-surface mt-2 border-t border-jolshaa-outline-variant/50 pt-2">
                      <span className="font-medium">Admin note:</span> {appeal.adminNote}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AppealPage;
