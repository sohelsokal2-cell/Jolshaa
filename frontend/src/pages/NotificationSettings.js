import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';

const NOTIFICATION_TYPES = [
  { key: 'friend_request', label: 'Friend Requests', icon: '👤' },
  { key: 'friend_accept', label: 'Friend Acceptances', icon: '👥' },
  { key: 'comment', label: 'Comments', icon: '💬' },
  { key: 'reaction', label: 'Reactions', icon: '❤️' },
  { key: 'tag', label: 'Tags', icon: '🏷️' },
  { key: 'message', label: 'Messages', icon: '✉️' },
  { key: 'group_invite', label: 'Group Invites', icon: '📋' },
  { key: 'share', label: 'Shares', icon: '🔄' },
  { key: 'event_invite', label: 'Event Invites', icon: '📅' },
  { key: 'event_rsvp', label: 'Event RSVPs', icon: '✅' },
  { key: 'tip', label: 'Tips', icon: '💰' },
  { key: 'subscription', label: 'Subscriptions', icon: '⭐' },
  { key: 'system', label: 'System', icon: '🔔' }
];

const NotificationSettings = () => {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState({});
  const [quietHours, setQuietHours] = useState({ enabled: false, start: '22:00', end: '08:00' });
  const [emailNotifs, setEmailNotifs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const res = await API.get('/notification-preferences');
      const data = res.data.preferences;
      setPrefs(data.preferences || {});
      setQuietHours(data.quietHours || { enabled: false, start: '22:00', end: '08:00' });
      setEmailNotifs(data.emailNotifications || false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const togglePref = (key) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      await API.put('/notification-preferences', {
        preferences: prefs,
        quietHours,
        emailNotifications: emailNotifs
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto py-6 px-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <svg className="w-5 h-5 text-neutral-600 dark:text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Notification Settings</h1>
        </div>

        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 mb-4">
          <h2 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-3 uppercase tracking-wide">Notification Types</h2>
          {NOTIFICATION_TYPES.map(({ key, label, icon }) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-700 last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-lg">{icon}</span>
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{label}</span>
              </div>
              <button
                onClick={() => togglePref(key)}
                className={`relative w-11 h-6 rounded-full transition-colors ${prefs[key] ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${prefs[key] ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 mb-4">
          <h2 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-3 uppercase tracking-wide">Quiet Hours</h2>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-neutral-900 dark:text-neutral-100">Enable quiet hours</span>
            <button
              onClick={() => setQuietHours(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${quietHours.enabled ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${quietHours.enabled ? 'translate-x-5' : ''}`} />
            </button>
          </div>
          {quietHours.enabled && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-neutral-500 dark:text-neutral-400 mb-1 block">Start</label>
                <input
                  type="time"
                  value={quietHours.start}
                  onChange={e => setQuietHours(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 outline-none focus:border-primary-500"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-neutral-500 dark:text-neutral-400 mb-1 block">End</label>
                <input
                  type="time"
                  value={quietHours.end}
                  onChange={e => setQuietHours(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 outline-none focus:border-primary-500"
                />
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Email notifications</span>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Receive notifications via email</p>
            </div>
            <button
              onClick={() => setEmailNotifs(!emailNotifs)}
              className={`relative w-11 h-6 rounded-full transition-colors ${emailNotifs ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${emailNotifs ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>

        <Button onClick={savePreferences} loading={saving} fullWidth size="lg">
          Save Preferences
        </Button>
      </div>
    </Layout>
  );
};

export default NotificationSettings;
