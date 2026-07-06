import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import Layout from '../components/layout/Layout';
import { useFestivalTheme, FESTIVAL_THEMES } from '../context/FestivalThemeContext';

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

  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFASetup, setTwoFASetup] = useState(null); // { secret, qrCode, backupCodes }
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAMsg, setTwoFAMsg] = useState('');

  const [dataExportLoading, setDataExportLoading] = useState(false);
  const [dataExportMsg, setDataExportMsg] = useState('');

  const { festival, setFestival } = useFestivalTheme();

  useEffect(() => {
    if (activeTab === 'sessions') fetchSessions();
    else if (activeTab === 'login-history') fetchLoginHistory();
    else if (activeTab === 'safety') { fetchSafety(); fetch2FAStatus(); }
  }, [activeTab]);

  const fetch2FAStatus = async () => {
    try {
      const res = await API.get('/security/2fa/status');
      setTwoFAEnabled(!!res.data.twoFactorEnabled);
    } catch (err) {
      console.error('Failed to fetch 2FA status');
    }
  };

  const handleStart2FASetup = async () => {
    setTwoFALoading(true);
    setTwoFAMsg('');
    try {
      const res = await API.post('/security/2fa/enable');
      setTwoFASetup(res.data);
    } catch (err) {
      setTwoFAMsg(err.response?.data?.message || 'Failed to start 2FA setup');
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleActivate2FA = async () => {
    if (!twoFACode.trim()) return;
    setTwoFALoading(true);
    setTwoFAMsg('');
    try {
      await API.post('/security/2fa/verify', { code: twoFACode.trim() });
      setTwoFAEnabled(true);
      setTwoFASetup(null);
      setTwoFACode('');
      setTwoFAMsg('Two-factor authentication enabled');
    } catch (err) {
      setTwoFAMsg(err.response?.data?.message || 'Invalid code');
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm('Disable two-factor authentication? This will make your account less secure.')) return;
    setTwoFALoading(true);
    setTwoFAMsg('');
    try {
      await API.post('/security/2fa/disable');
      setTwoFAEnabled(false);
      setTwoFASetup(null);
      setTwoFAMsg('Two-factor authentication disabled');
    } catch (err) {
      setTwoFAMsg(err.response?.data?.message || 'Failed to disable 2FA');
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleDownloadMyData = async () => {
    setDataExportLoading(true);
    setDataExportMsg('');
    try {
      const res = await API.get('/security/export-my-data', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'my_data_export.json');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setDataExportMsg('Failed to download your data');
    } finally {
      setDataExportLoading(false);
    }
  };

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
        <h1 className="font-display text-xl font-bold text-jolshaa-on-surface mb-4">Security & Account</h1>

        <div className="flex gap-2 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === tab.key
                  ? 'bg-jolshaa-teal text-jolshaa-on-teal'
                  : 'bg-jolshaa-surface-container-lowest text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container-high'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Password Change */}
        {activeTab === 'password' && (
          <div className="bg-jolshaa-surface-container-lowest rounded-2xl shadow-ambient p-6">
            <h2 className="font-display font-semibold text-jolshaa-on-surface mb-4">Change Password</h2>
            <div className="space-y-3">
              <input
                type="password"
                placeholder="Current password"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
              />
              <input
                type="password"
                placeholder="New password"
                value={passwords.newPass}
                onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
              />
              {passwordMsg && (
                <p className={`text-sm ${passwordMsg.includes('success') ? 'text-green-600' : 'text-red-500'}`}>
                  {passwordMsg}
                </p>
              )}
              <button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                className="px-4 py-2 bg-jolshaa-teal text-jolshaa-on-teal rounded-lg text-sm font-medium hover:bg-jolshaa-teal-container disabled:opacity-50 transition-colors"
              >
                {passwordLoading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        )}

        {/* Sessions */}
        {activeTab === 'sessions' && (
          <div className="bg-jolshaa-surface-container-lowest rounded-2xl shadow-ambient p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-jolshaa-on-surface">Active Sessions</h2>
              {sessions.length > 1 && (
                <button onClick={handleRevokeAll} className="text-xs text-red-600 hover:underline">
                  Revoke all other sessions
                </button>
              )}
            </div>
            {sessionsLoading ? (
              <p className="text-jolshaa-on-surface-variant text-sm">Loading...</p>
            ) : sessions.length === 0 ? (
              <p className="text-jolshaa-on-surface-variant text-sm">No active sessions</p>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session._id} className="flex items-center justify-between p-3 bg-jolshaa-surface-container-high/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-jolshaa-on-surface-variant">{session.userAgent || 'Unknown device'}</p>
                      <p className="text-xs text-jolshaa-on-surface-variant">
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
          <div className="bg-jolshaa-surface-container-lowest rounded-2xl shadow-ambient p-6">
            <h2 className="font-display font-semibold text-jolshaa-on-surface mb-4">Login History</h2>
            {historyLoading ? (
              <p className="text-jolshaa-on-surface-variant text-sm">Loading...</p>
            ) : loginHistory.length === 0 ? (
              <p className="text-jolshaa-on-surface-variant text-sm">No login history</p>
            ) : (
              <div className="space-y-2">
                {loginHistory.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-jolshaa-surface-container-high/50 rounded-lg text-sm">
                    <div>
                      <p className="font-medium text-jolshaa-on-surface-variant">{entry.ip || 'Unknown IP'}</p>
                      <p className="text-xs text-jolshaa-on-surface-variant">{entry.userAgent || 'Unknown device'}</p>
                    </div>
                    <span className="text-xs text-jolshaa-on-surface-variant">{new Date(entry.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Safety Settings */}
        {activeTab === 'safety' && (
          <div className="bg-jolshaa-surface-container-lowest rounded-2xl shadow-ambient p-6">
            <h2 className="font-display font-semibold text-jolshaa-on-surface mb-4">Safety & Privacy</h2>
            {safetyMsg && (
              <p className={`text-sm mb-3 ${safetyMsg.includes('saved') ? 'text-green-600' : 'text-red-500'}`}>
                {safetyMsg}
              </p>
            )}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-jolshaa-on-surface-variant">Login Alerts</p>
                  <p className="text-xs text-jolshaa-on-surface-variant">Get notified of new logins from unknown devices</p>
                </div>
                <button
                  onClick={() => handleSafetyUpdate('loginAlerts', !safety.loginAlerts)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${safety.loginAlerts ? 'bg-jolshaa-teal' : 'bg-jolshaa-outline-variant'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${safety.loginAlerts ? 'left-4.5' : 'left-0.5'}`} />
                </button>
              </div>
              <div className="p-3 bg-jolshaa-surface-container-high/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-jolshaa-on-surface-variant">Two-Factor Authentication</p>
                    <p className="text-xs text-jolshaa-on-surface-variant">Secure your account with an authenticator app</p>
                  </div>
                  {twoFAEnabled ? (
                    <span className="text-xs text-green-600 font-medium">Enabled</span>
                  ) : (
                    <span className="text-xs text-jolshaa-on-surface-variant">Disabled</span>
                  )}
                </div>

                {twoFAMsg && (
                  <p className={`text-sm mt-2 ${twoFAMsg.includes('enabled') || twoFAMsg.includes('disabled') ? 'text-green-600' : 'text-red-500'}`}>
                    {twoFAMsg}
                  </p>
                )}

                {!twoFAEnabled && !twoFASetup && (
                  <button
                    onClick={handleStart2FASetup}
                    disabled={twoFALoading}
                    className="mt-3 px-4 py-2 bg-jolshaa-teal text-jolshaa-on-teal rounded-lg text-sm font-medium hover:bg-jolshaa-teal-container disabled:opacity-50 transition-colors"
                  >
                    {twoFALoading ? 'Starting...' : 'Set up 2FA'}
                  </button>
                )}

                {twoFAEnabled && (
                  <button
                    onClick={handleDisable2FA}
                    disabled={twoFALoading}
                    className="mt-3 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
                  >
                    Disable 2FA
                  </button>
                )}

                {twoFASetup && (
                  <div className="mt-4 space-y-3 border-t border-jolshaa-outline-variant pt-3">
                    <p className="text-xs text-jolshaa-on-surface-variant">
                      Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), or enter the secret manually.
                    </p>
                    <img src={twoFASetup.qrCode} alt="2FA QR code" className="w-40 h-40 mx-auto rounded-lg bg-white p-2" />
                    <p className="text-xs text-center font-mono break-all text-jolshaa-on-surface-variant">{twoFASetup.secret}</p>

                    <div>
                      <p className="text-xs font-medium text-jolshaa-on-surface-variant mb-1">Backup codes (save these somewhere safe):</p>
                      <div className="grid grid-cols-2 gap-1 text-xs font-mono bg-jolshaa-surface-container-lowest rounded-lg p-2">
                        {twoFASetup.backupCodes?.map((code, i) => (
                          <span key={i}>{code}</span>
                        ))}
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Enter 6-digit code to activate"
                      value={twoFACode}
                      onChange={(e) => setTwoFACode(e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleActivate2FA}
                        disabled={twoFALoading}
                        className="px-4 py-2 bg-jolshaa-teal text-jolshaa-on-teal rounded-lg text-sm font-medium hover:bg-jolshaa-teal-container disabled:opacity-50 transition-colors"
                      >
                        {twoFALoading ? 'Verifying...' : 'Activate'}
                      </button>
                      <button
                        onClick={() => { setTwoFASetup(null); setTwoFACode(''); }}
                        className="px-4 py-2 bg-jolshaa-surface-container-high text-jolshaa-on-surface-variant rounded-lg text-sm font-medium hover:bg-jolshaa-outline-variant transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-3 bg-jolshaa-surface-container-high/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-jolshaa-on-surface-variant">Download Your Data</p>
                    <p className="text-xs text-jolshaa-on-surface-variant">Get a copy of your profile, posts, comments and messages</p>
                  </div>
                  <button
                    onClick={handleDownloadMyData}
                    disabled={dataExportLoading}
                    className="px-4 py-2 bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-jolshaa-on-surface rounded-lg text-sm font-medium hover:bg-jolshaa-surface-container-high disabled:opacity-50 transition-colors"
                  >
                    {dataExportLoading ? 'Preparing...' : 'Download'}
                  </button>
                </div>
                {dataExportMsg && <p className="text-sm mt-2 text-red-500">{dataExportMsg}</p>}
              </div>
              <div className="p-3 bg-jolshaa-surface-container-high/50 rounded-lg">
                <p className="text-sm font-medium text-jolshaa-on-surface-variant mb-2">Festival Theme</p>
                <div className="flex gap-2 flex-wrap">
                  {FESTIVAL_THEMES.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFestival(f.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        festival === f.value
                          ? 'bg-jolshaa-teal text-jolshaa-on-teal border-jolshaa-teal'
                          : 'bg-jolshaa-surface-container-lowest border-jolshaa-outline-variant text-jolshaa-on-surface hover:bg-jolshaa-surface-container-high'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-jolshaa-on-surface-variant">Content Filter</p>
                  <p className="text-xs text-jolshaa-on-surface-variant">Filter potentially sensitive content</p>
                </div>
                <select
                  value={safety.contentFilterLevel}
                  onChange={(e) => handleSafetyUpdate('contentFilterLevel', e.target.value)}
                  className="w-full rounded-lg px-3 py-1.5 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
                >
                  <option value="off">Off</option>
                  <option value="moderate">Moderate</option>
                  <option value="strict">Strict</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-jolshaa-on-surface-variant">Restrict DMs</p>
                  <p className="text-xs text-jolshaa-on-surface-variant">Only allow friends to send you messages</p>
                </div>
                <button
                  onClick={() => handleSafetyUpdate('restrictedDMs', !safety.restrictedDMs)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${safety.restrictedDMs ? 'bg-jolshaa-teal' : 'bg-jolshaa-outline-variant'}`}
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
