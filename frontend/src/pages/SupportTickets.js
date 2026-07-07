import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Layout from '../components/layout/Layout';
import { useLanguage } from '../context/LanguageContext';
import Button from '../components/ui/Button';

const CATEGORIES = [
  { key: 'account', label: 'Account' },
  { key: 'billing', label: 'Billing' },
  { key: 'technical', label: 'Technical' },
  { key: 'content', label: 'Content' },
  { key: 'safety', label: 'Safety' },
  { key: 'feature_request', label: 'Feature Request' },
  { key: 'other', label: 'Other' },
];

const STATUS_STYLES = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  waiting_user: 'bg-purple-100 text-purple-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-jolshaa-surface-container-high text-jolshaa-on-surface-variant',
};

const SupportTickets = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', category: 'account', priority: 'medium' });
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const res = await API.get('/support/tickets');
      setTickets(res.data.tickets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async () => {
    if (!form.subject || !form.description) {
      setError('Subject and description are required.');
      return;
    }
    setError('');
    setCreating(true);
    try {
      await API.post('/support/tickets', form);
      setForm({ subject: '', description: '', category: 'account', priority: 'medium' });
      setShowForm(false);
      loadTickets();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ticket.');
    } finally {
      setCreating(false);
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-jolshaa-surface-container-low transition-colors">
              <svg className="w-5 h-5 text-jolshaa-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="font-display text-xl font-bold text-jolshaa-on-surface">{t('support.title')}</h1>
          </div>
          <Button size="sm" onClick={() => setShowForm(prev => !prev)}>
            {showForm ? t('editProfile.cancel') : t('support.createTicket')}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          <button
            onClick={() => navigate('/contact')}
            className="rounded-xl border border-jolshaa-outline-variant bg-jolshaa-surface-container-lowest p-3 text-center hover:bg-jolshaa-surface-container-low transition-colors"
          >
            <div className="text-lg mb-1">✉️</div>
            <span className="text-xs font-medium text-jolshaa-on-surface">{t('support.contactUs')}</span>
          </button>
          <button
            onClick={() => navigate('/feedback')}
            className="rounded-xl border border-jolshaa-outline-variant bg-jolshaa-surface-container-lowest p-3 text-center hover:bg-jolshaa-surface-container-low transition-colors"
          >
            <div className="text-lg mb-1">💡</div>
            <span className="text-xs font-medium text-jolshaa-on-surface">{t('support.feedback')}</span>
          </button>
          <button
            onClick={() => navigate('/appeal')}
            className="rounded-xl border border-jolshaa-outline-variant bg-jolshaa-surface-container-lowest p-3 text-center hover:bg-jolshaa-surface-container-low transition-colors"
          >
            <div className="text-lg mb-1">⚖️</div>
            <span className="text-xs font-medium text-jolshaa-on-surface">{t('support.appeal')}</span>
          </button>
        </div>

        {showForm && (
          <div className="rounded-xl border border-jolshaa-outline-variant bg-jolshaa-surface-container-lowest p-4 space-y-3 mb-6">
            {error && <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
            <div>
              <label className="text-xs text-jolshaa-on-surface-variant mb-1 block">Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={e => setForm(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm bg-jolshaa-surface-container-low border border-jolshaa-outline-variant text-jolshaa-on-surface outline-none focus:border-jolshaa-teal focus:ring-2 focus:ring-jolshaa-teal/20"
              />
            </div>
            <div>
              <label className="text-xs text-jolshaa-on-surface-variant mb-1 block">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm bg-jolshaa-surface-container-low border border-jolshaa-outline-variant text-jolshaa-on-surface outline-none focus:border-jolshaa-teal focus:ring-2 focus:ring-jolshaa-teal/20"
              >
                {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-jolshaa-on-surface-variant mb-1 block">Description</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm bg-jolshaa-surface-container-low border border-jolshaa-outline-variant text-jolshaa-on-surface outline-none focus:border-jolshaa-teal focus:ring-2 focus:ring-jolshaa-teal/20 resize-none"
              />
            </div>
            <Button onClick={createTicket} loading={creating} fullWidth>Submit Ticket</Button>
          </div>
        )}

        {tickets.length === 0 ? (
          <div className="text-center py-16 text-sm text-jolshaa-on-surface-variant">
            {t('support.noTickets')}
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map(ticket => (
              <button
                key={ticket._id}
                onClick={() => navigate(`/support/tickets/${ticket._id}`)}
                className="w-full text-left rounded-xl border border-jolshaa-outline-variant bg-jolshaa-surface-container-lowest p-4 hover:bg-jolshaa-surface-container-low transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-jolshaa-on-surface truncate">{ticket.subject}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[ticket.status] || ''}`}>
                    {ticket.status?.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-jolshaa-on-surface-variant line-clamp-1">{ticket.description}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SupportTickets;
