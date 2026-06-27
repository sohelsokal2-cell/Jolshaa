import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import Layout from '../components/layout/Layout';

const Security = () => {
  const [activeTab, setActiveTab] = useState('password');
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const [loginHistory, setLoginHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [safety, setSafety] = useState({
    loginAlerts: true,
    twoFactorEnabled: false,
    contentFilterLevel: 'moderate',
    restrictedDMs: false,
  });
  const [safetyLoading, setSafetyLoading] = useState(false);
  const [safetyMsg, setSafetyMsg] = useState('');

  useEffect(() => {
    if (activeTab === 'sessions') fetchSessions();
    else if (activeTab === 'login-history') fetchLoginHistory();
    else if (activeTab === 'safety') fetchSafety();
  }, [activeTab]);

  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await API.get('/auth/sessions');
      setSessions(res.data.sessions);
    } catch (err) {
      console.error('Failed to fetch sessions');
    } finally {
      setSessionsLoading(false);
    }
  };

  const fetchLoginHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await API.get('/auth/login-history');
      setLoginHistory(res.data.history || []);
    } catch (err) {
      console.error('Failed to fetch login history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.newPass) {
      setPasswordMsg('Please fill in all fields');
      return;
    }
    if (passwords.newPass !== passwords.confirm) {
      setPasswordMsg('New passwords do not match');
      return;
    }
    if (passwords.newPass.length < 6) {
      setPasswordMsg('Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    setPasswordMsg('');
    try {
      await API.put('/auth/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.newPass,
      });
      setPasswordMsg('Password changed successfully');
      setPasswords({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      setPasswordMsg(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await API.delete(`/auth/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
    } catch (err) {
      console.error('Failed to revoke session');
    }
  };

  const handleRevokeAll = async () => {
    if (!window.confirm('This will sign you out of all other devices. Continue?')) return;
    try {
      await API.delete('/auth/sessions');
      fetchSessions();
    } catch (err) {
      console.error('Failed to revoke sessions');
    }
  };

  const fetchSafety = async () => {
    setSafetyLoading(true);
    try {
      const res = await API.get('/auth/safety');
      if (res.data.safety) setSafety(res.data.safety);
    } catch (err) {
      console.error('Failed to fetch safety settings');
    } finally {
      setSafetyLoading(false);
    }
  };

  const handleSafetyUpdate = async (field, value) => {
    setSafetyLoading(true);
    setSafetyMsg('');
    try {
      const updated = { ...safety, [field]: value };
      await API.put('/auth/safety', updated);
      setSafety(updated);
      setSafetyMsg('Settings saved');
      setTimeout(() => setSafetyMsg(''), 3000);
    } catch (err) {
      setSafetyMsg('Failed to save settings');
    } finally {
      setSafetyLoading(false);
    }
  };

  const tabs = [
    { key: 'password', label: 'Password' },
    { key: 'sessions', label: 'Active Sessions' },
    { key: 'login-history', label: 'Login History' },
    { key: 'safety', label: 'Safety' },
  ];

  return (
    <Layout>
      <div className="max-w-xl mx-auto mt-8 px-4 pb-8">
        <h1 className="text-xl font-bold text-on-surface mb-4">Security & Account</h1>

        <div className="flex gap-2 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === tab.key
                  ? 'bg-primary-600 text-white'
                  : 'card text-on-surface-variant hover:bg-surface-high'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Password Change */}
        {activeTab === 'password' && (
          <div className="card rounded-lg shadow-sm p-6">
            <h2 className="font-semibold text-on-surface mb-4">Change Password</h2>
            <div className="space-y-3">
              <input
                type="password"
                placeholder="Current password"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                className="input w-full rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="password"
                placeholder="New password"
                value={passwords.newPass}
                onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                className="input w-full rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                className="input w-full rounded-lg px-3 py-2 text-sm"
              />
              {passwordMsg && (
                <p className={`text-sm ${passwordMsg.includes('success') ? 'text-green-600' : 'text-red-500'}`}>
                  {passwordMsg}
                </p>
              )}
              <button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {passwordLoading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        )}

        {/* Sessions */}
        {activeTab === 'sessions' && (
          <div className="card rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-on-surface">Active Sessions</h2>
              {sessions.length > 1 && (
                <button onClick={handleRevokeAll} className="text-xs text-red-600 hover:underline">
                  Revoke all other sessions
                </button>
              )}
            </div>
            {sessionsLoading ? (
              <p className="text-on-surface-variant text-sm">Loading...</p>
            ) : sessions.length === 0 ? (
              <p className="text-on-surface-variant text-sm">No active sessions</p>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session._id} className="flex items-center justify-between p-3 bg-surface-high/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-on-surface-variant">{session.userAgent || 'Unknown device'}</p>
                      <p className="text-xs text-on-surface-variant">
                        {session.ip || 'Unknown IP'} &middot; Last active: {new Date(session.lastActive).toLocaleString()}
                      </p>
                    </div>
                    {!session.isCurrent && (
                      <button
                        onClick={() => handleRevokeSession(session._id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Revoke
                      </button>
                    )}
                    {session.isCurrent && (
                      <span className="text-xs text-green-600 font-medium">Current</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Login History */}
        {activeTab === 'login-history' && (
          <div className="card rounded-lg shadow-sm p-6">
            <h2 className="font-semibold text-on-surface mb-4">Login History</h2>
            {historyLoading ? (
              <p className="text-on-surface-variant text-sm">Loading...</p>
            ) : loginHistory.length === 0 ? (
              <p className="text-on-surface-variant text-sm">No login history</p>
            ) : (
              <div className="space-y-2">
                {loginHistory.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-surface-high/50 rounded-lg text-sm">
                    <div>
                      <p className="font-medium text-on-surface-variant">{entry.ip || 'Unknown IP'}</p>
                      <p className="text-xs text-on-surface-variant">{entry.userAgent || 'Unknown device'}</p>
                    </div>
                    <span className="text-xs text-on-surface-variant">{new Date(entry.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Safety Settings */}
        {activeTab === 'safety' && (
          <div className="card rounded-lg shadow-sm p-6">
            <h2 className="font-semibold text-on-surface mb-4">Safety & Privacy</h2>
            {safetyMsg && (
              <p className={`text-sm mb-3 ${safetyMsg.includes('saved') ? 'text-green-600' : 'text-red-500'}`}>
                {safetyMsg}
              </p>
            )}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-on-surface-variant">Login Alerts</p>
                  <p className="text-xs text-on-surface-variant">Get notified of new logins from unknown devices</p>
                </div>
                <button
                  onClick={() => handleSafetyUpdate('loginAlerts', !safety.loginAlerts)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${safety.loginAlerts ? 'bg-primary-600' : 'bg-neutral-300'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${safety.loginAlerts ? 'left-4.5' : 'left-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-on-surface-variant">Two-Factor Authentication</p>
                  <p className="text-xs text-on-surface-variant">Add an extra layer of security to your account</p>
                </div>
                <button
                  onClick={() => handleSafetyUpdate('twoFactorEnabled', !safety.twoFactorEnabled)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${safety.twoFactorEnabled ? 'bg-primary-600' : 'bg-neutral-300'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${safety.twoFactorEnabled ? 'left-4.5' : 'left-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-on-surface-variant">Content Filter</p>
                  <p className="text-xs text-on-surface-variant">Filter potentially sensitive content</p>
                </div>
                <select
                  value={safety.contentFilterLevel}
                  onChange={(e) => handleSafetyUpdate('contentFilterLevel', e.target.value)}
                  className="input px-3 py-1.5 rounded-lg text-sm"
                >
                  <option value="off">Off</option>
                  <option value="moderate">Moderate</option>
                  <option value="strict">Strict</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-on-surface-variant">Restrict DMs</p>
                  <p className="text-xs text-on-surface-variant">Only allow friends to send you messages</p>
                </div>
                <button
                  onClick={() => handleSafetyUpdate('restrictedDMs', !safety.restrictedDMs)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${safety.restrictedDMs ? 'bg-primary-600' : 'bg-neutral-300'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${safety.restrictedDMs ? 'left-4.5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Security;
