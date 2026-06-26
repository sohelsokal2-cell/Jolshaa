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

  useEffect(() => {
    if (activeTab === 'sessions') fetchSessions();
    else if (activeTab === 'login-history') fetchLoginHistory();
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
      setLoginHistory(res.data.loginHistory);
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

  const tabs = [
    { key: 'password', label: 'Password' },
    { key: 'sessions', label: 'Active Sessions' },
    { key: 'login-history', label: 'Login History' },
  ];

  return (
    <Layout>
      <div className="max-w-xl mx-auto mt-8 px-4 pb-8">
        <h1 className="text-xl font-bold text-gray-800 mb-4">Security & Account</h1>

        <div className="flex gap-2 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Password Change */}
        {activeTab === 'password' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Change Password</h2>
            <div className="space-y-3">
              <input
                type="password"
                placeholder="Current password"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="New password"
                value={passwords.newPass}
                onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {passwordMsg && (
                <p className={`text-sm ${passwordMsg.includes('success') ? 'text-green-600' : 'text-red-500'}`}>
                  {passwordMsg}
                </p>
              )}
              <button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {passwordLoading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        )}

        {/* Sessions */}
        {activeTab === 'sessions' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Active Sessions</h2>
              {sessions.length > 1 && (
                <button onClick={handleRevokeAll} className="text-xs text-red-600 hover:underline">
                  Revoke all other sessions
                </button>
              )}
            </div>
            {sessionsLoading ? (
              <p className="text-gray-500 text-sm">Loading...</p>
            ) : sessions.length === 0 ? (
              <p className="text-gray-500 text-sm">No active sessions</p>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{session.userAgent || 'Unknown device'}</p>
                      <p className="text-xs text-gray-500">
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
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Login History</h2>
            {historyLoading ? (
              <p className="text-gray-500 text-sm">Loading...</p>
            ) : loginHistory.length === 0 ? (
              <p className="text-gray-500 text-sm">No login history</p>
            ) : (
              <div className="space-y-2">
                {loginHistory.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                    <div>
                      <p className="font-medium text-gray-700">{entry.ip || 'Unknown IP'}</p>
                      <p className="text-xs text-gray-500">{entry.userAgent || 'Unknown device'}</p>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Security;
