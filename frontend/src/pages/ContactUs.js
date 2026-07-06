import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';

const CATEGORIES = [
  { key: 'general', label: 'General' },
  { key: 'support', label: 'Support' },
  { key: 'feedback', label: 'Feedback' },
  { key: 'partnership', label: 'Partnership' },
  { key: 'abuse', label: 'Report Abuse' },
  { key: 'other', label: 'Other' },
];

const ContactUs = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', category: 'general' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const submit = async () => {
    if (!form.name || !form.email || !form.subject || !form.message) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setSending(true);
    try {
      await API.post('/support/contact', form);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message.');
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
          <h1 className="font-display text-xl font-bold text-jolshaa-on-surface">Contact Us</h1>
        </div>

        {sent ? (
          <div className="rounded-xl border border-jolshaa-outline-variant bg-jolshaa-surface-container-lowest p-6 text-center">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-sm font-medium text-jolshaa-on-surface mb-1">Message sent</p>
            <p className="text-xs text-jolshaa-on-surface-variant mb-4">We'll get back to you as soon as possible.</p>
            <Button onClick={() => navigate('/')} fullWidth>Back to Home</Button>
          </div>
        ) : (
          <div className="rounded-xl border border-jolshaa-outline-variant bg-jolshaa-surface-container-lowest p-4 space-y-4">
            {error && (
              <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>
            )}

            <div>
              <label className="text-xs text-jolshaa-on-surface-variant mb-1 block">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => update('name', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-jolshaa-surface-container-low border border-jolshaa-outline-variant text-jolshaa-on-surface outline-none focus:border-jolshaa-teal focus:ring-2 focus:ring-jolshaa-teal/20"
              />
            </div>

            <div>
              <label className="text-xs text-jolshaa-on-surface-variant mb-1 block">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-jolshaa-surface-container-low border border-jolshaa-outline-variant text-jolshaa-on-surface outline-none focus:border-jolshaa-teal focus:ring-2 focus:ring-jolshaa-teal/20"
              />
            </div>

            <div>
              <label className="text-xs text-jolshaa-on-surface-variant mb-1 block">Category</label>
              <select
                value={form.category}
                onChange={e => update('category', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-jolshaa-surface-container-low border border-jolshaa-outline-variant text-jolshaa-on-surface outline-none focus:border-jolshaa-teal focus:ring-2 focus:ring-jolshaa-teal/20"
              >
                {CATEGORIES.map(c => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-jolshaa-on-surface-variant mb-1 block">Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={e => update('subject', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-jolshaa-surface-container-low border border-jolshaa-outline-variant text-jolshaa-on-surface outline-none focus:border-jolshaa-teal focus:ring-2 focus:ring-jolshaa-teal/20"
              />
            </div>

            <div>
              <label className="text-xs text-jolshaa-on-surface-variant mb-1 block">Message</label>
              <textarea
                rows={5}
                value={form.message}
                onChange={e => update('message', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-jolshaa-surface-container-low border border-jolshaa-outline-variant text-jolshaa-on-surface outline-none focus:border-jolshaa-teal focus:ring-2 focus:ring-jolshaa-teal/20 resize-none"
              />
            </div>

            <Button onClick={submit} loading={sending} fullWidth size="lg">
              Send Message
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ContactUs;
