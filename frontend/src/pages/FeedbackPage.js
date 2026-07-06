import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';

const TYPES = [
  { key: 'bug', label: 'Bug', icon: '🐞' },
  { key: 'feature_request', label: 'Feature Request', icon: '💡' },
  { key: 'improvement', label: 'Improvement', icon: '⚙️' },
  { key: 'complaint', label: 'Complaint', icon: '😕' },
  { key: 'praise', label: 'Praise', icon: '🎉' },
  { key: 'other', label: 'Other', icon: '📝' },
];

const FeedbackPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ type: 'improvement', title: '', description: '', rating: 0 });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!form.title || !form.description) {
      setError('Title and description are required.');
      return;
    }
    setError('');
    setSending(true);
    try {
      await API.post('/support/feedback', { ...form, page: window.location.pathname });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback.');
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
          <h1 className="font-display text-xl font-bold text-jolshaa-on-surface">Send Feedback</h1>
        </div>

        {sent ? (
          <div className="rounded-xl border border-jolshaa-outline-variant bg-jolshaa-surface-container-lowest p-6 text-center">
            <div className="text-3xl mb-2">🙏</div>
            <p className="text-sm font-medium text-jolshaa-on-surface mb-1">Thanks for the feedback!</p>
            <Button onClick={() => navigate('/')} fullWidth className="mt-3">Back to Home</Button>
          </div>
        ) : (
          <div className="rounded-xl border border-jolshaa-outline-variant bg-jolshaa-surface-container-lowest p-4 space-y-4">
            {error && <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}

            <div>
              <label className="text-xs text-jolshaa-on-surface-variant mb-2 block">Type</label>
              <div className="grid grid-cols-3 gap-2">
                {TYPES.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setForm(prev => ({ ...prev, type: t.key }))}
                    className={`rounded-lg px-2 py-2 text-xs font-medium border transition-colors ${
                      form.type === t.key
                        ? 'bg-jolshaa-teal text-jolshaa-on-teal border-jolshaa-teal'
                        : 'bg-jolshaa-surface-container-low text-jolshaa-on-surface border-jolshaa-outline-variant'
                    }`}
                  >
                    <div>{t.icon}</div>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-jolshaa-on-surface-variant mb-1 block">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm bg-jolshaa-surface-container-low border border-jolshaa-outline-variant text-jolshaa-on-surface outline-none focus:border-jolshaa-teal focus:ring-2 focus:ring-jolshaa-teal/20"
              />
            </div>

            <div>
              <label className="text-xs text-jolshaa-on-surface-variant mb-1 block">Description</label>
              <textarea
                rows={5}
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm bg-jolshaa-surface-container-low border border-jolshaa-outline-variant text-jolshaa-on-surface outline-none focus:border-jolshaa-teal focus:ring-2 focus:ring-jolshaa-teal/20 resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-jolshaa-on-surface-variant mb-2 block">Rating (optional)</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setForm(prev => ({ ...prev, rating: prev.rating === star ? 0 : star }))}
                    className="text-2xl"
                  >
                    {form.rating >= star ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={submit} loading={sending} fullWidth size="lg">
              Submit Feedback
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FeedbackPage;
