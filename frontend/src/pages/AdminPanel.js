import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Layout from '../components/layout/Layout';
import Avatar from '../components/ui/Avatar';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Tabs from '../components/ui/Tabs';
import Modal from '../components/ui/Modal';

const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  if (!user?.isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">Access Denied</h2>
            <p className="text-sm text-neutral-500">You don't have admin privileges.</p>
            <Link to="/feed" className="inline-block mt-4 text-sm text-primary-600 hover:underline">Go to Feed</Link>
          </div>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'users', label: 'Users' },
    { key: 'reports', label: 'Reports' },
    { key: 'safety', label: 'Safety' },
    { key: 'spam', label: 'Spam' },
    { key: 'blocked', label: 'Blocked' },
    { key: 'offenders', label: 'Offenders' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'system', label: 'System' },
    { key: 'appeals', label: 'Appeals' },
    { key: 'posts', label: 'Posts' },
    { key: 'comments', label: 'Comments' },
    { key: 'stories', label: 'Stories' },
    { key: 'reels', label: 'Reels' },
    { key: 'listings', label: 'Listings' },
    { key: 'bulk', label: 'Bulk Actions' },
    { key: 'verification', label: 'Verification' },
    { key: 'admins', label: 'Admins' },
    { key: 'audit', label: 'Audit Log' },
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Admin Panel</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage users, content, and platform settings</p>
        </div>

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'reports' && <ReportsTab />}
        {activeTab === 'safety' && <SafetyDashboardTab />}
        {activeTab === 'spam' && <SpamQueueTab />}
        {activeTab === 'blocked' && <BlockedUsersTab />}
        {activeTab === 'offenders' && <RepeatOffendersTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'system' && <SystemControlTab />}
        {activeTab === 'appeals' && <AppealsTab />}
        {activeTab === 'posts' && <PostsModerationTab />}
        {activeTab === 'comments' && <CommentsModerationTab />}
        {activeTab === 'stories' && <StoriesModerationTab />}
        {activeTab === 'reels' && <ReelsModerationTab />}
        {activeTab === 'listings' && <ListingsModerationTab />}
        {activeTab === 'bulk' && <BulkActionsTab />}
        {activeTab === 'verification' && <VerificationTab />}
        {activeTab === 'admins' && <AdminsTab />}
        {activeTab === 'audit' && <AuditTab />}
      </div>
    </Layout>
  );
};

// --- Dashboard ---
const DashboardTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/stats').then(res => setStats(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8 text-neutral-500">Loading...</div>;
  if (!stats) return null;

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20' },
    { label: 'Total Posts', value: stats.totalPosts, color: 'text-neutral-600', bg: 'bg-neutral-100 dark:bg-neutral-700' },
    { label: 'Groups', value: stats.totalGroups, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Pages', value: stats.totalPages, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Active Today', value: stats.activeToday, color: 'text-accent-600', bg: 'bg-accent-50 dark:bg-accent-900/20' },
    { label: 'Pending Reports', value: stats.pendingReports, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
    { label: 'Suspended', value: stats.suspendedUsers, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Banned', value: stats.bannedUsers, color: 'text-red-700', bg: 'bg-red-50 dark:bg-red-900/20' },
    { label: 'Verified', value: stats.verifiedUsers, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20' },
    { label: 'Pending Appeals', value: stats.pendingAppeals, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Pending Verifications', value: stats.pendingVerifications, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Admin Actions', value: stats.totalAdminActions, color: 'text-neutral-600', bg: 'bg-neutral-100 dark:bg-neutral-700' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {statCards.map(card => (
          <Card key={card.label} className={`${card.bg}`}>
            <p className="text-xs font-medium text-neutral-500">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          </Card>
        ))}
      </div>

      {stats.recentActions?.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Recent Admin Actions</h3>
          <div className="space-y-2">
            {stats.recentActions.map(action => (
              <div key={action._id} className="flex items-center gap-3 text-xs">
                <Avatar src={action.admin?.profilePhoto} alt={action.admin?.name} size="xs" />
                <span className="text-neutral-700 dark:text-neutral-300">
                  <span className="font-medium">{action.admin?.name}</span> performed{' '}
                  <Badge variant="neutral" size="xs">{action.action}</Badge>
                </span>
                <span className="text-neutral-400 ml-auto">{new Date(action.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

// --- Users ---
const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [showRestrictModal, setShowRestrictModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [warnMessage, setWarnMessage] = useState('');
  const [restrictType, setRestrictType] = useState('post');
  const [restrictDays, setRestrictDays] = useState(7);
  const [banReason, setBanReason] = useState('');
  const [suspendReason, setSuspendReason] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (filter) params.set('status', filter);
      const res = await API.get(`/admin/users?${params}`);
      setUsers(res.data.users);
    } catch (err) {
      console.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [filter]);

  const handleBan = async () => {
    if (!selectedUser) return;
    try {
      const res = await API.put(`/admin/users/${selectedUser._id}/ban`, { reason: banReason });
      setUsers(prev => prev.map(u => u._id === selectedUser._id ? { ...u, isBanned: res.data.user.isBanned } : u));
      setShowBanModal(false);
      setBanReason('');
      setSelectedUser(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleSuspend = async () => {
    if (!selectedUser) return;
    try {
      const res = await API.put(`/admin/users/${selectedUser._id}/suspend`, { reason: suspendReason });
      setUsers(prev => prev.map(u => u._id === selectedUser._id ? { ...u, isSuspended: res.data.user.isSuspended } : u));
      setShowSuspendModal(false);
      setSuspendReason('');
      setSelectedUser(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleWarn = async () => {
    if (!warnMessage.trim() || !selectedUser) return;
    try {
      await API.post(`/admin/users/${selectedUser._id}/warn`, { message: warnMessage });
      setShowWarnModal(false);
      setWarnMessage('');
      setSelectedUser(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleRestrict = async () => {
    if (!selectedUser) return;
    try {
      await API.post(`/admin/users/${selectedUser._id}/restrict`, { type: restrictType, durationDays: parseInt(restrictDays) || 0 });
      setShowRestrictModal(false);
      setSelectedUser(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      const res = await API.put(`/admin/users/${userId}/role`, { role });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: res.data.role, isAdmin: res.data.isAdmin } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleVerify = async (userId) => {
    try {
      const res = await API.put(`/admin/users/${userId}/verify`);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isVerified: res.data.isVerified } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await API.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u._id !== userId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[200px]">
          <Input placeholder="Search by name or email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchUsers()} />
        </div>
        <Button onClick={fetchUsers} size="sm">Search</Button>
        {['', 'suspended', 'banned', 'verified'].map(f => (
          <Button key={f} variant={filter === f ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter(f)}>
            {f || 'All'}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-neutral-500">Loading...</div>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">User</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-neutral-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={u.profilePhoto} alt={u.name} size="sm" />
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-neutral-100">{u.name}</p>
                          <p className="text-xs text-neutral-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role || 'user'}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="text-xs border border-neutral-300 dark:border-neutral-600 rounded-lg px-2 py-1 bg-white dark:bg-neutral-800"
                        disabled={u.isAdmin}
                      >
                        <option value="user">User</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.isVerified && <Badge variant="primary" size="xs">Verified</Badge>}
                        {u.isSuspended && <Badge variant="warning" size="xs">Suspended</Badge>}
                        {u.isBanned && <Badge variant="danger" size="xs">Banned</Badge>}
                        {u.isAdmin && <Badge variant="primary" size="xs">Admin</Badge>}
                        {u.warnings?.length > 0 && <Badge variant="warning" size="xs">{u.warnings.length} warn</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end flex-wrap">
                        {!u.isAdmin && (
                          <>
                            <Button size="xs" variant="ghost" onClick={() => { setSelectedUser(u); setShowWarnModal(true); }}>Warn</Button>
                            <Button size="xs" variant="ghost" onClick={() => { setSelectedUser(u); setShowRestrictModal(true); }}>Restrict</Button>
                            <Button size="xs" variant={u.isBanned ? 'success' : 'danger'} onClick={() => { setSelectedUser(u); setShowBanModal(true); }}>
                              {u.isBanned ? 'Unban' : 'Ban'}
                            </Button>
                            <Button size="xs" variant={u.isSuspended ? 'success' : 'secondary'} onClick={() => { setSelectedUser(u); setShowSuspendModal(true); }}>
                              {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                            </Button>
                            <Button size="xs" variant="ghost" onClick={() => handleVerify(u._id)}>
                              {u.isVerified ? 'Unverify' : 'Verify'}
                            </Button>
                            <Button size="xs" variant="danger" onClick={() => handleDelete(u._id)}>Delete</Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && <p className="text-center py-6 text-neutral-500 text-sm">No users found</p>}
        </Card>
      )}

      {/* Warn Modal */}
      <Modal isOpen={showWarnModal} onClose={() => setShowWarnModal(false)} title={`Warn ${selectedUser?.name || ''}`}>
        <div className="p-5 space-y-4">
          <Input label="Warning message" value={warnMessage} onChange={e => setWarnMessage(e.target.value)} placeholder="Describe the warning..." />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowWarnModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleWarn}>Send Warning</Button>
          </div>
        </div>
      </Modal>

      {/* Restrict Modal */}
      <Modal isOpen={showRestrictModal} onClose={() => setShowRestrictModal(false)} title={`Restrict ${selectedUser?.name || ''}`}>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Restriction Type</label>
            <select value={restrictType} onChange={e => setRestrictType(e.target.value)} className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-800">
              <option value="post">Cannot Post</option>
              <option value="comment">Cannot Comment</option>
              <option value="message">Cannot Message</option>
              <option value="friend_request">Cannot Send Friend Requests</option>
              <option value="group_join">Cannot Join Groups</option>
            </select>
          </div>
          <Input label="Duration (days, 0 = permanent)" type="number" value={restrictDays} onChange={e => setRestrictDays(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowRestrictModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleRestrict}>Apply Restriction</Button>
          </div>
        </div>
      </Modal>

      {/* Ban Modal */}
      <Modal isOpen={showBanModal} onClose={() => setShowBanModal(false)} title={`${selectedUser?.isBanned ? 'Unban' : 'Ban'} ${selectedUser?.name || ''}`}>
        <div className="p-5 space-y-4">
          {selectedUser?.isBanned ? (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Are you sure you want to unban this user?</p>
          ) : (
            <Input label="Ban reason" value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Describe the reason for banning..." />
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setShowBanModal(false); setBanReason(''); }}>Cancel</Button>
            <Button variant={selectedUser?.isBanned ? 'success' : 'danger'} onClick={handleBan}>
              {selectedUser?.isBanned ? 'Unban User' : 'Ban User'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Suspend Modal */}
      <Modal isOpen={showSuspendModal} onClose={() => setShowSuspendModal(false)} title={`${selectedUser?.isSuspended ? 'Unsuspend' : 'Suspend'} ${selectedUser?.name || ''}`}>
        <div className="p-5 space-y-4">
          {selectedUser?.isSuspended ? (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Are you sure you want to unsuspend this user?</p>
          ) : (
            <Input label="Suspend reason" value={suspendReason} onChange={e => setSuspendReason(e.target.value)} placeholder="Describe the reason for suspension..." />
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setShowSuspendModal(false); setSuspendReason(''); }}>Cancel</Button>
            <Button variant={selectedUser?.isSuspended ? 'success' : 'secondary'} onClick={handleSuspend}>
              {selectedUser?.isSuspended ? 'Unsuspend User' : 'Suspend User'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// --- Reports ---
const ReportsTab = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  const [resolveModal, setResolveModal] = useState(null);
  const [resolution, setResolution] = useState('no_action');
  const [escalateModal, setEscalateModal] = useState(null);
  const [escalateReason, setEscalateReason] = useState('');
  const [assignModal, setAssignModal] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (reasonFilter) params.append('reason', reasonFilter);
      const res = await API.get(`/admin/safety/reports?${params.toString()}`);
      setReports(res.data.reports);
    } catch (err) {
      console.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [filter, priorityFilter, reasonFilter]);

  const handleAssign = async (reportId) => {
    try {
      const res = await API.put(`/admin/safety/reports/${reportId}/assign`, {});
      setReports(prev => prev.map(r => r._id === reportId ? res.data.report : r));
      setAssignModal(null);
    } catch (err) { alert('Failed to assign'); }
  };

  const handleEscalate = async (reportId) => {
    try {
      const res = await API.put(`/admin/safety/reports/${reportId}/escalate`, { reason: escalateReason });
      setReports(prev => prev.map(r => r._id === reportId ? res.data.report : r));
      setEscalateModal(null);
      setEscalateReason('');
    } catch (err) { alert('Failed to escalate'); }
  };

  const handleResolve = async (reportId) => {
    try {
      const res = await API.put(`/admin/safety/reports/${reportId}/resolve`, { resolution });
      setReports(prev => prev.map(r => r._id === reportId ? res.data.report : r));
      setResolveModal(null);
      setResolution('no_action');
    } catch (err) { alert('Failed to resolve'); }
  };

  const handleDismiss = async (reportId) => {
    try {
      const res = await API.put(`/admin/reports/${reportId}`, { status: 'dismissed' });
      setReports(prev => prev.map(r => r._id === reportId ? res.data.report : r));
    } catch (err) { alert('Failed'); }
  };

  const handleRemoveContent = async (report) => {
    if (!window.confirm(`Remove this ${report.targetType}?`)) return;
    try {
      if (report.targetType === 'post') await API.delete(`/admin/posts/${report.targetId}`);
      else if (report.targetType === 'comment') await API.delete(`/admin/comments/${report.targetId}`);
      else if (report.targetType === 'story') await API.delete(`/admin/stories/${report.targetId}`);
      else if (report.targetType === 'reel') await API.delete(`/admin/moderation/reels/${report.targetId}`);
      else if (report.targetType === 'listing') await API.put(`/admin/moderation/listings/${report.targetId}/remove`);
      else if (report.targetType === 'group_post') await API.delete(`/admin/posts/${report.targetId}`);
      const res = await API.put(`/admin/safety/reports/${report._id}/resolve`, { resolution: 'content_removed' });
      setReports(prev => prev.map(r => r._id === report._id ? res.data.report : r));
    } catch (err) { alert('Failed'); }
  };

  const statusColors = { pending: 'warning', reviewed: 'primary', resolved: 'success', dismissed: 'neutral', escalated: 'danger' };
  const priorityColors = { low: 'neutral', medium: 'warning', high: 'danger', critical: 'danger' };
  const resolutionLabels = { none: '-', content_removed: 'Content Removed', warning_issued: 'Warning Issued', account_suspended: 'Account Suspended', account_banned: 'Account Banned', no_action: 'No Action', other: 'Other' };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        {['pending', 'reviewed', 'escalated', 'resolved', 'dismissed', 'all'].map(s => (
          <Button key={s} variant={filter === s ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter(s)}>
            {s}
          </Button>
        ))}
        <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-600 mx-1" />
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="text-xs border border-neutral-300 dark:border-neutral-600 rounded px-2 py-1 bg-white dark:bg-neutral-800">
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <select value={reasonFilter} onChange={e => setReasonFilter(e.target.value)} className="text-xs border border-neutral-300 dark:border-neutral-600 rounded px-2 py-1 bg-white dark:bg-neutral-800">
          <option value="">All Reasons</option>
          <option value="spam">Spam</option>
          <option value="harassment">Harassment</option>
          <option value="hate_speech">Hate Speech</option>
          <option value="violence">Violence</option>
          <option value="nudity">Nudity</option>
          <option value="misinformation">Misinformation</option>
          <option value="copyright">Copyright</option>
          <option value="fake_account">Fake Account</option>
          <option value="other">Other</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8 text-neutral-500">Loading...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">No reports found</div>
      ) : (
        <div className="space-y-3">
          {reports.map(report => (
            <Card key={report._id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant={statusColors[report.status]} size="xs">{report.status}</Badge>
                    <Badge variant={priorityColors[report.priority]} size="xs">{report.priority}</Badge>
                    {report.escalationLevel > 0 && (
                      <Badge variant="danger" size="xs">L{report.escalationLevel}</Badge>
                    )}
                    <span className="text-xs font-medium text-neutral-500 capitalize">{report.targetType}</span>
                    <span className="text-xs text-neutral-400">{report.reason?.replace(/_/g, ' ')}</span>
                    {report.isAutoFlagged && <Badge variant="warning" size="xs">Auto</Badge>}
                  </div>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">
                    <span className="font-medium">{report.reporter?.name}</span> reported this {report.targetType}
                  </p>
                  {report.description && <p className="text-xs text-neutral-500 mt-1 italic">"{report.description}"</p>}
                  <div className="flex items-center gap-3 mt-1 text-2xs text-neutral-400">
                    <span>{new Date(report.createdAt).toLocaleString()}</span>
                    {report.assignedTo && <span>Assigned: <span className="text-neutral-600 dark:text-neutral-300">{report.assignedTo.name}</span></span>}
                    {report.resolution && report.resolution !== 'none' && (
                      <span className="text-green-600 dark:text-green-400">Resolution: {resolutionLabels[report.resolution]}</span>
                    )}
                  </div>
                  {report.evidenceUrls?.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {report.evidenceUrls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-2xs text-primary-600 hover:underline">Evidence {i + 1}</a>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end">
                  {report.status !== 'resolved' && report.status !== 'dismissed' && (
                    <>
                      <Button size="xs" variant="ghost" onClick={() => setAssignModal(report._id)}>Assign</Button>
                      <Button size="xs" variant="ghost" onClick={() => setEscalateModal(report._id)}>Escalate</Button>
                      {(report.targetType === 'post' || report.targetType === 'comment' || report.targetType === 'story' || report.targetType === 'reel' || report.targetType === 'listing' || report.targetType === 'group_post') && (
                        <Button size="xs" variant="danger" onClick={() => handleRemoveContent(report)}>Remove</Button>
                      )}
                      <Button size="xs" variant="success" onClick={() => setResolveModal(report._id)}>Resolve</Button>
                      <Button size="xs" variant="ghost" onClick={() => handleDismiss(report._id)}>Dismiss</Button>
                    </>
                  )}
                  <Button size="xs" variant="ghost" onClick={() => setSelectedReport(report)}>Details</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Assign Modal */}
      {assignModal && (
        <Modal isOpen={!!assignModal} onClose={() => setAssignModal(null)} title="Assign Report">
          <div className="p-5 space-y-3">
            <p className="text-sm text-neutral-600">Assign this report to yourself?</p>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="secondary" onClick={() => setAssignModal(null)}>Cancel</Button>
              <Button size="sm" onClick={() => handleAssign(assignModal)}>Assign to Me</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Escalate Modal */}
      {escalateModal && (
        <Modal isOpen={!!escalateModal} onClose={() => { setEscalateModal(null); setEscalateReason(''); }} title="Escalate Report">
          <div className="p-5 space-y-3">
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Reason for escalation</label>
            <textarea
              value={escalateReason}
              onChange={e => setEscalateReason(e.target.value)}
              placeholder="Why is this being escalated?"
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-800 resize-none"
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="secondary" onClick={() => { setEscalateModal(null); setEscalateReason(''); }}>Cancel</Button>
              <Button size="sm" variant="danger" onClick={() => handleEscalate(escalateModal)}>Escalate</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Resolve Modal */}
      {resolveModal && (
        <Modal isOpen={!!resolveModal} onClose={() => { setResolveModal(null); setResolution('no_action'); }} title="Resolve Report">
          <div className="p-5 space-y-3">
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Resolution</label>
            <select
              value={resolution}
              onChange={e => setResolution(e.target.value)}
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-800"
            >
              <option value="no_action">No Action</option>
              <option value="content_removed">Content Removed</option>
              <option value="warning_issued">Warning Issued</option>
              <option value="account_suspended">Account Suspended</option>
              <option value="account_banned">Account Banned</option>
              <option value="other">Other</option>
            </select>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="secondary" onClick={() => { setResolveModal(null); setResolution('no_action'); }}>Cancel</Button>
              <Button size="sm" variant="success" onClick={() => handleResolve(resolveModal)}>Resolve</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Details Modal */}
      {selectedReport && (
        <Modal isOpen={!!selectedReport} onClose={() => setSelectedReport(null)} title="Report Details">
          <div className="p-5 space-y-3 text-sm max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-neutral-500">Status:</span> <Badge variant={statusColors[selectedReport.status]} size="xs">{selectedReport.status}</Badge></div>
              <div><span className="text-neutral-500">Priority:</span> <Badge variant={priorityColors[selectedReport.priority]} size="xs">{selectedReport.priority}</Badge></div>
              <div><span className="text-neutral-500">Type:</span> {selectedReport.targetType}</div>
              <div><span className="text-neutral-500">Reason:</span> {selectedReport.reason?.replace(/_/g, ' ')}</div>
              <div><span className="text-neutral-500">Escalation:</span> Level {selectedReport.escalationLevel}</div>
              <div><span className="text-neutral-500">Auto-flagged:</span> {selectedReport.isAutoFlagged ? 'Yes' : 'No'}</div>
              {selectedReport.assignedTo && <div><span className="text-neutral-500">Assigned:</span> {selectedReport.assignedTo.name}</div>}
              {selectedReport.reviewedBy && <div><span className="text-neutral-500">Reviewed by:</span> {selectedReport.reviewedBy.name}</div>}
              {selectedReport.resolvedBy && <div><span className="text-neutral-500">Resolved by:</span> {selectedReport.resolvedBy.name}</div>}
              {selectedReport.resolution && selectedReport.resolution !== 'none' && <div><span className="text-neutral-500">Resolution:</span> {resolutionLabels[selectedReport.resolution]}</div>}
            </div>
            <div><span className="text-neutral-500">Reported by:</span> {selectedReport.reporter?.name}</div>
            {selectedReport.description && <div><span className="text-neutral-500">Description:</span> "{selectedReport.description}"</div>}
            {selectedReport.evidenceUrls?.length > 0 && (
              <div>
                <span className="text-neutral-500">Evidence:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedReport.evidenceUrls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline block">{url}</a>
                  ))}
                </div>
              </div>
            )}
            {selectedReport.escalationHistory?.length > 0 && (
              <div>
                <span className="text-neutral-500">Escalation History:</span>
                <div className="space-y-1 mt-1">
                  {selectedReport.escalationHistory.map((e, i) => (
                    <div key={i} className="text-xs text-neutral-600 dark:text-neutral-400">
                      Level {e.fromLevel} → {e.toLevel} at {new Date(e.escalatedAt).toLocaleString()}
                      {e.reason && <span className="italic"> — {e.reason}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="text-2xs text-neutral-400">Created: {new Date(selectedReport.createdAt).toLocaleString()}</div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// --- Appeals ---
const AppealsTab = () => {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [adminNote, setAdminNote] = useState('');

  const fetchAppeals = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/admin/appeals?status=${filter}`);
      setAppeals(res.data.appeals);
    } catch (err) {
      console.error('Failed to fetch appeals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppeals(); }, [filter]);

  const handleAppeal = async (appealId, status) => {
    try {
      const res = await API.put(`/admin/appeals/${appealId}`, { status, adminNote });
      setAppeals(prev => prev.map(a => a._id === appealId ? res.data.appeal : a));
      setSelectedAppeal(null);
      setAdminNote('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const typeLabels = { ban: 'Ban Appeal', suspend: 'Suspension Appeal', warning: 'Warning Appeal', restriction: 'Restriction Appeal', verification: 'Verification Request' };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['pending', 'reviewed', 'accepted', 'rejected', 'all'].map(s => (
          <Button key={s} variant={filter === s ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter(s)}>
            {s}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-neutral-500">Loading...</div>
      ) : appeals.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">No appeals found</div>
      ) : (
        <div className="space-y-3">
          {appeals.map(appeal => (
            <Card key={appeal._id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={appeal.status === 'pending' ? 'warning' : appeal.status === 'accepted' ? 'success' : 'neutral'} size="xs">{appeal.status}</Badge>
                    <span className="text-xs font-medium text-neutral-500">{typeLabels[appeal.type] || appeal.type}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar src={appeal.user?.profilePhoto} alt={appeal.user?.name} size="xs" />
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{appeal.user?.name}</span>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{appeal.reason}</p>
                  {appeal.adminNote && <p className="text-xs text-neutral-500 mt-1 italic">Admin: {appeal.adminNote}</p>}
                  <p className="text-2xs text-neutral-400 mt-1">{new Date(appeal.createdAt).toLocaleString()}</p>
                </div>
                {appeal.status === 'pending' && (
                  <div className="flex gap-1.5 flex-shrink-0">
                    <Button size="xs" variant="ghost" onClick={() => setSelectedAppeal(appeal)}>Review</Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={!!selectedAppeal} onClose={() => setSelectedAppeal(null)} title="Review Appeal">
        <div className="p-5 space-y-4">
          {selectedAppeal && (
            <>
              <div>
                <p className="text-sm text-neutral-500">User</p>
                <p className="font-medium">{selectedAppeal.user?.name}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Type</p>
                <p className="font-medium">{typeLabels[selectedAppeal.type]}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Reason</p>
                <p className="text-sm">{selectedAppeal.reason}</p>
              </div>
              <Input label="Admin note" value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Optional note..." />
              <div className="flex justify-end gap-2">
                <Button variant="danger" onClick={() => handleAppeal(selectedAppeal._id, 'rejected')}>Reject</Button>
                <Button variant="success" onClick={() => handleAppeal(selectedAppeal._id, 'accepted')}>Accept</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

// --- Verification Requests ---
const VerificationTab = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/verification-requests').then(res => setRequests(res.data.users)).finally(() => setLoading(false));
  }, []);

  const handleVerify = async (userId) => {
    try {
      await API.put(`/admin/users/${userId}/verify`);
      setRequests(prev => prev.filter(u => u._id !== userId));
    } catch (err) {
      alert('Failed');
    }
  };

  const handleReject = async (userId) => {
    try {
      await API.put(`/admin/users/${userId}/verify`);
      setRequests(prev => prev.filter(u => u._id !== userId));
    } catch (err) {
      alert('Failed');
    }
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-8 text-neutral-500">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">No pending verification requests</div>
      ) : (
        <div className="space-y-3">
          {requests.map(u => (
            <Card key={u._id}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar src={u.profilePhoto} alt={u.name} size="md" />
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">{u.name}</p>
                    <p className="text-xs text-neutral-500">{u.email}</p>
                    {u.verificationReason && <p className="text-xs text-neutral-500 mt-1 italic">"{u.verificationReason}"</p>}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Button size="xs" variant="danger" onClick={() => handleReject(u._id)}>Reject</Button>
                  <Button size="xs" variant="success" onClick={() => handleVerify(u._id)}>Verify</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Admin Accounts ---
const AdminsTab = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/admins').then(res => setAdmins(res.data.admins)).finally(() => setLoading(false));
  }, []);

  const roleColors = { superadmin: 'danger', admin: 'primary', moderator: 'success' };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-8 text-neutral-500">Loading...</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {admins.map(a => (
            <Card key={a._id}>
              <div className="flex items-center gap-3">
                <Avatar src={a.profilePhoto} alt={a.name} size="lg" />
                <div className="flex-1">
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">{a.name}</p>
                  <p className="text-xs text-neutral-500">{a.email}</p>
                </div>
                <Badge variant={roleColors[a.role] || 'neutral'} size="sm">{a.role}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Audit Log ---
const AuditTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async (p = 1) => {
    setLoading(true);
    try {
      const res = await API.get(`/admin/audit-log?page=${p}&limit=30`);
      setLogs(res.data.logs);
      setTotalPages(res.data.totalPages);
      setPage(p);
    } catch (err) {
      console.error('Failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const actionLabels = {
    'user.suspend': 'Suspended', 'user.unsuspend': 'Unsuspended',
    'user.ban': 'Banned', 'user.unban': 'Unbanned',
    'user.warn': 'Warned', 'user.delete': 'Deleted',
    'user.verify': 'Verified', 'user.unverify': 'Unverified',
    'user.role_change': 'Role Changed', 'user.restrict': 'Restricted',
    'content.remove_post': 'Removed Post', 'content.remove_comment': 'Removed Comment',
    'content.remove_story': 'Removed Story', 'content.remove_reel': 'Removed Reel',
    'content.remove_listing': 'Removed Listing',
    'content.flag_post': 'Flagged Post', 'content.flag_comment': 'Flagged Comment',
    'content.flag_story': 'Flagged Story', 'content.flag_reel': 'Flagged Reel',
    'content.flag_listing': 'Flagged Listing',
    'content.hide_post': 'Hidden Post', 'content.hide_comment': 'Hidden Comment',
    'content.hide_story': 'Hidden Story', 'content.hide_reel': 'Hidden Reel',
    'content.hide_listing': 'Hidden Listing',
    'content.shadow_hide': 'Shadow Hidden',
    'content.bulk_remove': 'Bulk Removed', 'content.bulk_flag': 'Bulk Flagged',
    'content.bulk_hide': 'Bulk Hidden',
    'report.resolve': 'Resolved Report', 'report.dismiss': 'Dismissed Report',
    'appeal.accept': 'Accepted Appeal', 'appeal.reject': 'Rejected Appeal',
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-8 text-neutral-500">Loading...</div>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Admin</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Action</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Target</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Details</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                {logs.map(log => (
                  <tr key={log._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar src={log.admin?.profilePhoto} alt={log.admin?.name} size="xs" />
                        <span className="text-xs font-medium">{log.admin?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="neutral" size="xs">{actionLabels[log.action] || log.action}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-600 dark:text-neutral-400">{log.targetName || log.targetType}</td>
                    <td className="px-4 py-3 text-xs text-neutral-500">{JSON.stringify(log.details)}</td>
                    <td className="px-4 py-3 text-xs text-neutral-400">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {logs.length === 0 && <p className="text-center py-6 text-neutral-500 text-sm">No audit logs</p>}
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => fetchLogs(page - 1)}>Previous</Button>
          <span className="text-sm text-neutral-500 py-1">Page {page} of {totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => fetchLogs(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
};

// ============================================================
// CONTENT MODERATION TABS
// ============================================================

// --- Posts Moderation ---
const PostsModerationTab = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = filter ? `?status=${filter}` : '';
      const res = await API.get(`/admin/moderation/posts${params}`);
      setPosts(res.data.posts);
    } catch (err) { console.error('Failed'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchPosts(); }, [filter]);

  const handleAction = async (id, action) => {
    try {
      const res = await API.put(`/admin/moderation/posts/${id}/${action}`);
      setPosts(prev => prev.map(p => p._id === id ? res.data.post : p));
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this post permanently?')) return;
    try {
      await API.delete(`/admin/posts/${id}`);
      setPosts(prev => prev.filter(p => p._id !== id));
    } catch (err) { alert('Failed'); }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedIds.length === posts.length) setSelectedIds([]);
    else setSelectedIds(posts.map(p => p._id));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        {['', 'flagged', 'hidden', 'pending'].map(f => (
          <Button key={f} variant={filter === f ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter(f)}>
            {f || 'All'}
          </Button>
        ))}
        {selectedIds.length > 0 && (
          <div className="flex gap-1 ml-auto">
            <Button size="xs" variant="danger" onClick={async () => { await API.post('/admin/moderation/bulk', { type: 'post', ids: selectedIds, action: 'remove' }); setSelectedIds([]); fetchPosts(); }}>Bulk Remove ({selectedIds.length})</Button>
            <Button size="xs" variant="secondary" onClick={async () => { await API.post('/admin/moderation/bulk', { type: 'post', ids: selectedIds, action: 'flag' }); setSelectedIds([]); fetchPosts(); }}>Bulk Flag</Button>
            <Button size="xs" variant="secondary" onClick={async () => { await API.post('/admin/moderation/bulk', { type: 'post', ids: selectedIds, action: 'hide' }); setSelectedIds([]); fetchPosts(); }}>Bulk Hide</Button>
          </div>
        )}
      </div>

      {loading ? <div className="text-center py-8 text-neutral-500">Loading...</div> : posts.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">No posts found</div>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="px-4 py-3"><input type="checkbox" checked={selectedIds.length === posts.length && posts.length > 0} onChange={selectAll} className="rounded" /></th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Author</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Content</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-neutral-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                {posts.map(post => (
                  <tr key={post._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                    <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.includes(post._id)} onChange={() => toggleSelect(post._id)} className="rounded" /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar src={post.author?.profilePhoto} alt={post.author?.name} size="xs" />
                        <span className="text-xs font-medium">{post.author?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs max-w-[200px] truncate">{post.text?.substring(0, 100) || 'Media post'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {post.isFlagged && <Badge variant="danger" size="xs">Flagged</Badge>}
                        {post.isHidden && <Badge variant="warning" size="xs">Hidden</Badge>}
                        {post.moderationStatus === 'pending_review' && <Badge variant="primary" size="xs">Pending</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-400">{new Date(post.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <Button size="xs" variant="ghost" onClick={() => handleAction(post._id, post.isFlagged ? 'approve' : 'flag')}>{post.isFlagged ? 'Approve' : 'Flag'}</Button>
                        <Button size="xs" variant="ghost" onClick={() => handleAction(post._id, 'hide')}>{post.isHidden ? 'Unhide' : 'Hide'}</Button>
                        <Button size="xs" variant="ghost" onClick={() => handleAction(post._id, 'shadow-hide')}>Shadow</Button>
                        <Button size="xs" variant="danger" onClick={() => handleRemove(post._id)}>Remove</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

// --- Comments Moderation ---
const CommentsModerationTab = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchComments = async () => {
    setLoading(true);
    try {
      const params = filter ? `?status=${filter}` : '';
      const res = await API.get(`/admin/moderation/comments${params}`);
      setComments(res.data.comments);
    } catch (err) { console.error('Failed'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchComments(); }, [filter]);

  const handleAction = async (id, action) => {
    try {
      const res = await API.put(`/admin/moderation/comments/${id}/${action}`);
      setComments(prev => prev.map(c => c._id === id ? res.data.comment : c));
    } catch (err) { alert('Failed'); }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this comment?')) return;
    try {
      await API.delete(`/admin/comments/${id}`);
      setComments(prev => prev.filter(c => c._id !== id));
    } catch (err) { alert('Failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['', 'flagged', 'hidden'].map(f => (
          <Button key={f} variant={filter === f ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter(f)}>
            {f || 'All'}
          </Button>
        ))}
      </div>

      {loading ? <div className="text-center py-8 text-neutral-500">Loading...</div> : comments.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">No comments found</div>
      ) : (
        <div className="space-y-2">
          {comments.map(c => (
            <Card key={c._id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar src={c.author?.profilePhoto} alt={c.author?.name} size="xs" />
                    <span className="text-xs font-medium">{c.author?.name}</span>
                    {c.isFlagged && <Badge variant="danger" size="xs">Flagged</Badge>}
                    {c.isHidden && <Badge variant="warning" size="xs">Hidden</Badge>}
                  </div>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">{c.text}</p>
                  {c.post && <p className="text-xs text-neutral-400 mt-1">On post: "{c.post.text?.substring(0, 50)}..."</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button size="xs" variant="ghost" onClick={() => handleAction(c._id, c.isFlagged ? 'approve' : 'flag')}>{c.isFlagged ? 'Approve' : 'Flag'}</Button>
                  <Button size="xs" variant="ghost" onClick={() => handleAction(c._id, 'hide')}>{c.isHidden ? 'Unhide' : 'Hide'}</Button>
                  <Button size="xs" variant="danger" onClick={() => handleRemove(c._id)}>Remove</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Stories Moderation ---
const StoriesModerationTab = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchStories = async () => {
    setLoading(true);
    try {
      const params = filter ? `?status=${filter}` : '';
      const res = await API.get(`/admin/moderation/stories${params}`);
      setStories(res.data.stories);
    } catch (err) { console.error('Failed'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchStories(); }, [filter]);

  const handleAction = async (id, action) => {
    try {
      const res = await API.put(`/admin/moderation/stories/${id}/${action}`);
      setStories(prev => prev.map(s => s._id === id ? res.data.story : s));
    } catch (err) { alert('Failed'); }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this story?')) return;
    try {
      await API.delete(`/admin/stories/${id}`);
      setStories(prev => prev.filter(s => s._id !== id));
    } catch (err) { alert('Failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['', 'flagged', 'hidden'].map(f => (
          <Button key={f} variant={filter === f ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter(f)}>
            {f || 'All'}
          </Button>
        ))}
      </div>

      {loading ? <div className="text-center py-8 text-neutral-500">Loading...</div> : stories.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">No stories found</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {stories.map(s => (
            <Card key={s._id}>
              <div className="aspect-[9/16] bg-neutral-100 dark:bg-neutral-700 rounded-lg mb-2 overflow-hidden">
                {s.mediaType === 'video' ? (
                  <video src={s.media} className="w-full h-full object-cover" />
                ) : (
                  <img src={s.media} alt="Story" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar src={s.author?.profilePhoto} alt={s.author?.name} size="xs" />
                  <span className="text-xs font-medium">{s.author?.name}</span>
                </div>
                <div className="flex gap-1">
                  {s.isFlagged && <Badge variant="danger" size="xs">Flagged</Badge>}
                  {s.isHidden && <Badge variant="warning" size="xs">Hidden</Badge>}
                </div>
              </div>
              <div className="flex gap-1 mt-2">
                <Button size="xs" variant="ghost" className="flex-1" onClick={() => handleAction(s._id, s.isFlagged ? 'approve' : 'flag')}>{s.isFlagged ? 'Approve' : 'Flag'}</Button>
                <Button size="xs" variant="ghost" className="flex-1" onClick={() => handleAction(s._id, 'hide')}>{s.isHidden ? 'Unhide' : 'Hide'}</Button>
                <Button size="xs" variant="danger" className="flex-1" onClick={() => handleRemove(s._id)}>Remove</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Reels Moderation ---
const ReelsModerationTab = () => {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchReels = async () => {
    setLoading(true);
    try {
      const params = filter ? `?status=${filter}` : '';
      const res = await API.get(`/admin/moderation/reels${params}`);
      setReels(res.data.reels);
    } catch (err) { console.error('Failed'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchReels(); }, [filter]);

  const handleAction = async (id, action) => {
    try {
      const res = await API.put(`/admin/moderation/reels/${id}/${action}`);
      setReels(prev => prev.map(r => r._id === id ? res.data.reel : r));
    } catch (err) { alert('Failed'); }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this reel permanently?')) return;
    try {
      await API.delete(`/admin/moderation/reels/${id}`);
      setReels(prev => prev.filter(r => r._id !== id));
    } catch (err) { alert('Failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['', 'flagged', 'hidden'].map(f => (
          <Button key={f} variant={filter === f ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter(f)}>
            {f || 'All'}
          </Button>
        ))}
      </div>

      {loading ? <div className="text-center py-8 text-neutral-500">Loading...</div> : reels.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">No reels found</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {reels.map(r => (
            <Card key={r._id}>
              <div className="aspect-[9/16] bg-neutral-100 dark:bg-neutral-700 rounded-lg mb-2 overflow-hidden">
                <video src={r.video} poster={r.thumbnail} className="w-full h-full object-cover" controls={false} />
              </div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Avatar src={r.author?.profilePhoto} alt={r.author?.name} size="xs" />
                  <span className="text-xs font-medium">{r.author?.name}</span>
                </div>
                <div className="flex gap-1">
                  {r.isFlagged && <Badge variant="danger" size="xs">Flagged</Badge>}
                  {r.isHidden && <Badge variant="warning" size="xs">Hidden</Badge>}
                </div>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">{r.caption || 'No caption'}</p>
              <div className="flex gap-1 mt-2">
                <Button size="xs" variant="ghost" className="flex-1" onClick={() => handleAction(r._id, r.isFlagged ? 'approve' : 'flag')}>{r.isFlagged ? 'Approve' : 'Flag'}</Button>
                <Button size="xs" variant="ghost" className="flex-1" onClick={() => handleAction(r._id, 'hide')}>{r.isHidden ? 'Unhide' : 'Hide'}</Button>
                <Button size="xs" variant="danger" className="flex-1" onClick={() => handleRemove(r._id)}>Remove</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Listings Moderation ---
const ListingsModerationTab = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = filter ? `?status=${filter}` : '';
      const res = await API.get(`/admin/moderation/listings${params}`);
      setListings(res.data.listings);
    } catch (err) { console.error('Failed'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchListings(); }, [filter]);

  const handleAction = async (id, action) => {
    try {
      const res = await API.put(`/admin/moderation/listings/${id}/${action}`);
      setListings(prev => prev.map(l => l._id === id ? res.data.listing : l));
    } catch (err) { alert('Failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['', 'flagged', 'hidden', 'active', 'removed'].map(f => (
          <Button key={f} variant={filter === f ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter(f)}>
            {f || 'All'}
          </Button>
        ))}
      </div>

      {loading ? <div className="text-center py-8 text-neutral-500">Loading...</div> : listings.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">No listings found</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {listings.map(l => (
            <Card key={l._id}>
              {l.images?.[0] && (
                <div className="aspect-video bg-neutral-100 dark:bg-neutral-700 rounded-lg mb-2 overflow-hidden">
                  <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{l.title}</span>
                <div className="flex gap-1">
                  {l.isFlagged && <Badge variant="danger" size="xs">Flagged</Badge>}
                  {l.isHidden && <Badge variant="warning" size="xs">Hidden</Badge>}
                </div>
              </div>
              <p className="text-xs text-neutral-500">${l.price} - {l.category}</p>
              <div className="flex items-center gap-2 mt-1">
                <Avatar src={l.seller?.profilePhoto} alt={l.seller?.name} size="xs" />
                <span className="text-xs text-neutral-500">{l.seller?.name}</span>
              </div>
              <div className="flex gap-1 mt-2">
                <Button size="xs" variant="ghost" className="flex-1" onClick={() => handleAction(l._id, l.isFlagged ? 'approve' : 'flag')}>{l.isFlagged ? 'Approve' : 'Flag'}</Button>
                <Button size="xs" variant="ghost" className="flex-1" onClick={() => handleAction(l._id, 'hide')}>{l.isHidden ? 'Unhide' : 'Hide'}</Button>
                <Button size="xs" variant="danger" className="flex-1" onClick={() => handleAction(l._id, 'remove')}>Remove</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// REPORTS & SAFETY TABS
// ============================================================

// --- Safety Dashboard ---
const SafetyDashboardTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/safety/dashboard').then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8 text-neutral-500">Loading...</div>;
  if (!data) return null;

  const statCards = [
    { label: 'Total Reports', value: data.totalReports, color: 'text-neutral-600', bg: 'bg-neutral-100 dark:bg-neutral-700' },
    { label: 'Pending', value: data.pendingReports, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Escalated', value: data.escalatedReports, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
    { label: 'Resolved Today', value: data.resolvedToday, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Resolved This Week', value: data.resolvedThisWeek, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20' },
    { label: 'Resolved This Month', value: data.resolvedThisMonth, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Avg Resolution', value: `${data.averageResolutionHours}h`, color: 'text-neutral-600', bg: 'bg-neutral-100 dark:bg-neutral-700' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {statCards.map(card => (
          <Card key={card.label} className={card.bg}>
            <p className="text-xs font-medium text-neutral-500">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Reports by Reason</h3>
          <div className="space-y-2">
            {data.reportsByReason?.map(r => (
              <div key={r._id} className="flex items-center justify-between text-xs">
                <span className="text-neutral-600 dark:text-neutral-400 capitalize">{r._id?.replace(/_/g, ' ')}</span>
                <Badge variant="neutral" size="xs">{r.count}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Reports by Priority</h3>
          <div className="space-y-2">
            {data.reportsByPriority?.map(r => {
              const colors = { low: 'success', medium: 'warning', high: 'danger', critical: 'danger' };
              return (
                <div key={r._id} className="flex items-center justify-between text-xs">
                  <span className="text-neutral-600 dark:text-neutral-400 capitalize">{r._id}</span>
                  <Badge variant={colors[r._id] || 'neutral'} size="xs">{r.count}</Badge>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {data.topReportedUsers?.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Most Reported Users</h3>
          <div className="space-y-2">
            {data.topReportedUsers.map(u => (
              <div key={u._id} className="flex items-center gap-3 text-xs">
                <Avatar src={u.profilePhoto} alt={u.name} size="xs" />
                <span className="font-medium text-neutral-900 dark:text-neutral-100">{u.name}</span>
                <span className="text-neutral-500">{u.reportsReceived} reports</span>
                <Badge variant={u.isRepeatOffender ? 'danger' : 'neutral'} size="xs">Score: {u.safetyScore}</Badge>
                {u.isBanned && <Badge variant="danger" size="xs">Banned</Badge>}
                {u.isSuspended && <Badge variant="warning" size="xs">Suspended</Badge>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {data.recentReports?.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Recent Reports</h3>
          <div className="space-y-2">
            {data.recentReports.map(r => (
              <div key={r._id} className="flex items-center gap-3 text-xs">
                <Avatar src={r.reporter?.profilePhoto} alt={r.reporter?.name} size="xs" />
                <span className="text-neutral-700 dark:text-neutral-300">
                  <span className="font-medium">{r.reporter?.name}</span> reported{' '}
                  <Badge variant="neutral" size="xs">{r.targetType}</Badge>
                  <span className="ml-1 text-neutral-500">{r.reason?.replace(/_/g, ' ')}</span>
                </span>
                {r.assignedTo && <span className="text-neutral-400 ml-auto">Assigned to {r.assignedTo.name}</span>}
                <span className="text-neutral-400 ml-auto">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

// --- Spam Queue ---
const SpamQueueTab = () => {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [scanning, setScanning] = useState(false);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/admin/safety/spam/queue?status=${filter}`);
      setFlags(res.data.flags);
    } catch (err) { console.error('Failed'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchFlags(); }, [filter]);

  const handleScan = async () => {
    setScanning(true);
    try {
      await API.get('/admin/safety/spam/scan');
      fetchFlags();
    } catch (err) { alert('Scan failed'); } finally { setScanning(false); }
  };

  const handleReview = async (id, status) => {
    try {
      await API.put(`/admin/safety/spam/${id}/review`, { status });
      setFlags(prev => prev.map(f => f._id === id ? { ...f, status } : f));
    } catch (err) { alert('Failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        {['pending', 'confirmed', 'dismissed', 'all'].map(f => (
          <Button key={f} variant={filter === f ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter(f)}>
            {f}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={handleScan} disabled={scanning} className="ml-auto">
          {scanning ? 'Scanning...' : 'Run Spam Scan'}
        </Button>
      </div>

      {loading ? <div className="text-center py-8 text-neutral-500">Loading...</div> : flags.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">No spam flags found</div>
      ) : (
        <div className="space-y-2">
          {flags.map(f => (
            <Card key={f._id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar src={f.user?.profilePhoto} alt={f.user?.name} size="xs" />
                    <span className="text-xs font-medium">{f.user?.name}</span>
                    <Badge variant={f.status === 'confirmed' ? 'danger' : f.status === 'dismissed' ? 'success' : 'warning'} size="xs">{f.status}</Badge>
                    <Badge variant="neutral" size="xs">{f.contentType}</Badge>
                    <span className="text-xs text-neutral-400">Confidence: {f.confidence}%</span>
                  </div>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">{f.contentText?.substring(0, 150)}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {f.flags?.map((flag, i) => (
                      <Badge key={i} variant={flag.severity === 'high' ? 'danger' : flag.severity === 'medium' ? 'warning' : 'neutral'} size="xs">{flag.type}</Badge>
                    ))}
                  </div>
                </div>
                {f.status === 'pending' && (
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="xs" variant="danger" onClick={() => handleReview(f._id, 'confirmed')}>Confirm</Button>
                    <Button size="xs" variant="ghost" onClick={() => handleReview(f._id, 'dismissed')}>Dismiss</Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Blocked Users ---
const BlockedUsersTab = () => {
  const [data, setData] = useState({ users: [], blockedByUser: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/safety/blocked-users').then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8 text-neutral-500">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Banned / Suspended Users</h3>
          <div className="space-y-2">
            {data.users.length === 0 ? (
              <p className="text-xs text-neutral-500">No banned or suspended users</p>
            ) : data.users.map(u => (
              <div key={u._id} className="flex items-center gap-3 text-xs">
                <Avatar src={u.profilePhoto} alt={u.name} size="xs" />
                <div className="flex-1">
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">{u.name}</span>
                  <div className="flex gap-1 mt-0.5">
                    {u.isBanned && <Badge variant="danger" size="xs">Banned</Badge>}
                    {u.isSuspended && <Badge variant="warning" size="xs">Suspended</Badge>}
                    {u.isRepeatOffender && <Badge variant="danger" size="xs">Repeat Offender</Badge>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-neutral-500">{u.reportsReceived} reports</p>
                  <p className="text-neutral-400">Score: {u.safetyScore}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Most Blocked Users (by others)</h3>
          <div className="space-y-2">
            {data.blockedByUser?.length === 0 ? (
              <p className="text-xs text-neutral-500">No data</p>
            ) : data.blockedByUser?.map(u => (
              <div key={u._id} className="flex items-center justify-between text-xs">
                <span className="text-neutral-700 dark:text-neutral-300">{u.name}</span>
                <Badge variant="danger" size="xs">{u.blockedCount} blocks</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// --- Repeat Offenders ---
const RepeatOffendersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [caseData, setCaseData] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/safety/repeat-offenders');
      setUsers(res.data.users);
    } catch (err) { console.error('Failed'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const loadCaseHistory = async (userId) => {
    try {
      const res = await API.get(`/admin/safety/user-case-history/${userId}`);
      setCaseData(res.data);
      setSelectedUser(res.data.user);
    } catch (err) { alert('Failed'); }
  };

  const handleFlag = async (id) => {
    try {
      await API.put(`/admin/safety/repeat-offenders/${id}/flag`);
      fetchUsers();
    } catch (err) { alert('Failed'); }
  };

  const handleClear = async (id) => {
    try {
      await API.put(`/admin/safety/repeat-offenders/${id}/clear`);
      fetchUsers();
    } catch (err) { alert('Failed'); }
  };

  return (
    <div className="space-y-4">
      {loading ? <div className="text-center py-8 text-neutral-500">Loading...</div> : users.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">No repeat offenders found</div>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">User</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Reports</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Score</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Warnings</th>
                  <th className="text-right px-4 py-3 font-medium text-neutral-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={u.profilePhoto} alt={u.name} size="sm" />
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-neutral-100">{u.name}</p>
                          <p className="text-xs text-neutral-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium">{u.reportsReceived}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${u.safetyScore >= 70 ? 'bg-green-500' : u.safetyScore >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${u.safetyScore}%` }} />
                        </div>
                        <span className="text-xs text-neutral-500">{u.safetyScore}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {u.isRepeatOffender && <Badge variant="danger" size="xs">Offender</Badge>}
                        {u.isBanned && <Badge variant="danger" size="xs">Banned</Badge>}
                        {u.isSuspended && <Badge variant="warning" size="xs">Suspended</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">{u.warnings?.length || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <Button size="xs" variant="ghost" onClick={() => loadCaseHistory(u._id)}>Case History</Button>
                        {u.isRepeatOffender ? (
                          <Button size="xs" variant="ghost" onClick={() => handleClear(u._id)}>Clear</Button>
                        ) : (
                          <Button size="xs" variant="danger" onClick={() => handleFlag(u._id)}>Flag</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Case History Modal */}
      {selectedUser && caseData && (
        <Modal isOpen={!!selectedUser} onClose={() => { setSelectedUser(null); setCaseData(null); }} title={`Case History: ${selectedUser.name}`}>
          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-neutral-500">Safety Score:</span> <span className="font-medium">{selectedUser.safetyScore}</span></div>
              <div><span className="text-neutral-500">Reports Received:</span> <span className="font-medium">{selectedUser.reportsReceived}</span></div>
              <div><span className="text-neutral-500">Joined:</span> <span className="font-medium">{new Date(selectedUser.createdAt).toLocaleDateString()}</span></div>
              <div><span className="text-neutral-500">Warnings:</span> <span className="font-medium">{selectedUser.warnings?.length || 0}</span></div>
            </div>

            {caseData.reportsAgainst?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Reports Against This User</h4>
                <div className="space-y-1">
                  {caseData.reportsAgainst.map(r => (
                    <div key={r._id} className="text-xs flex items-center gap-2">
                      <Badge variant={r.status === 'resolved' ? 'success' : r.status === 'escalated' ? 'danger' : 'warning'} size="xs">{r.status}</Badge>
                      <span className="text-neutral-500">{r.reason?.replace(/_/g, ' ')}</span>
                      <span className="text-neutral-400 ml-auto">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {caseData.notes?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Moderator Notes</h4>
                <div className="space-y-1">
                  {caseData.notes.map(n => (
                    <div key={n._id} className="text-xs p-2 bg-neutral-50 dark:bg-neutral-800 rounded">
                      <p className="text-neutral-700 dark:text-neutral-300">{n.note}</p>
                      <p className="text-neutral-400 mt-0.5">By {n.author?.name} - {new Date(n.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Add Note</h4>
              <AddNoteForm targetType="user" targetId={selectedUser._id} onAdded={() => loadCaseHistory(selectedUser._id)} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// --- Add Note Form ---
const AddNoteForm = ({ targetType, targetId, onAdded }) => {
  const [note, setNote] = useState('');
  const [tags, setTags] = useState([]);

  const handleSubmit = async () => {
    if (!note.trim()) return;
    try {
      await API.post('/admin/safety/notes', { targetType, targetId, note, tags });
      setNote('');
      setTags([]);
      if (onAdded) onAdded();
    } catch (err) { alert('Failed'); }
  };

  return (
    <div className="space-y-2">
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Add a note..."
        className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-800 resize-none"
        rows={2}
      />
      <div className="flex gap-1 flex-wrap">
        {['escalation', 'investigation', 'resolved', 'follow_up', 'urgent', 'pattern'].map(t => (
          <Button key={t} size="xs" variant={tags.includes(t) ? 'primary' : 'ghost'} onClick={() => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}>
            {t}
          </Button>
        ))}
      </div>
      <Button size="xs" onClick={handleSubmit}>Add Note</Button>
    </div>
  );
};

// ============================================================
// ANALYTICS TAB
// ============================================================

// Simple bar chart component (no external deps)
const BarChart = ({ data, maxVal, color = 'bg-primary-500', height = 100, labelFn }) => {
  const max = maxVal || Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-0.5" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
          <div
            className={`w-full rounded-t ${color} transition-all`}
            style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 2 : 0 }}
          />
          {labelFn && (
            <span className="text-2xs text-neutral-400 truncate w-full text-center" title={d.label}>{d.label}</span>
          )}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-neutral-800 text-white text-2xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
            {d.value}
          </div>
        </div>
      ))}
    </div>
  );
};

const AnalyticsTab = () => {
  const [overview, setOverview] = useState(null);
  const [userGrowth, setUserGrowth] = useState(null);
  const [activeUsers, setActiveUsers] = useState(null);
  const [retention, setRetention] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [contentTrends, setContentTrends] = useState(null);
  const [modStats, setModStats] = useState(null);
  const [modPerf, setModPerf] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState('overview');

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [ov, ug, au, ret, eng, ct, ms, mp, rev] = await Promise.all([
          API.get('/admin/analytics/overview'),
          API.get('/admin/analytics/user-growth?days=30'),
          API.get('/admin/analytics/active-users?days=30'),
          API.get('/admin/analytics/retention'),
          API.get('/admin/analytics/engagement?days=30'),
          API.get('/admin/analytics/content-trends?days=30'),
          API.get('/admin/analytics/moderation-stats?days=30'),
          API.get('/admin/analytics/moderator-performance?days=30'),
          API.get('/admin/analytics/revenue?days=30'),
        ]);
        setOverview(ov.data);
        setUserGrowth(ug.data);
        setActiveUsers(au.data);
        setRetention(ret.data);
        setEngagement(eng.data);
        setContentTrends(ct.data);
        setModStats(ms.data);
        setModPerf(mp.data);
        setRevenue(rev.data);
      } catch (err) { console.error('Analytics load failed'); }
      setLoading(false);
    };
    loadAll();
  }, []);

  if (loading) return <div className="text-center py-8 text-neutral-500">Loading analytics...</div>;

  const subTabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: 'Users' },
    { key: 'engagement', label: 'Engagement' },
    { key: 'content', label: 'Content' },
    { key: 'moderation', label: 'Moderation' },
    { key: 'moderators', label: 'Moderators' },
    { key: 'revenue', label: 'Revenue' },
  ];

  return (
    <div className="space-y-4">
      <Tabs tabs={subTabs} activeTab={subTab} onChange={setSubTab} className="mb-4" />

      {/* ---- OVERVIEW ---- */}
      {subTab === 'overview' && overview && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Users', value: overview.totalUsers, color: 'text-neutral-600' },
              { label: 'DAU', value: overview.dau, color: 'text-blue-600' },
              { label: 'New Today', value: overview.newUsersToday, color: 'text-green-600' },
              { label: 'New This Week', value: overview.newUsersWeek, color: 'text-primary-600' },
              { label: 'Total Posts', value: overview.totalPosts, color: 'text-neutral-600' },
              { label: 'Posts Today', value: overview.postsToday, color: 'text-blue-600' },
              { label: 'Total Comments', value: overview.totalComments, color: 'text-neutral-600' },
              { label: 'Total Reactions', value: overview.totalReactions, color: 'text-neutral-600' },
              { label: 'Pending Reports', value: overview.pendingReports, color: 'text-amber-600' },
              { label: 'Escalated', value: overview.escalatedReports, color: 'text-red-600' },
              { label: 'Resolved Today', value: overview.resolvedToday, color: 'text-green-600' },
              { label: 'Ad Revenue', value: `$${overview.adRevenue.toLocaleString()}`, color: 'text-emerald-600' },
            ].map(card => (
              <Card key={card.label}>
                <p className="text-xs font-medium text-neutral-500">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              </Card>
            ))}
          </div>

          {activeUsers?.dauTrend && (
            <Card>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">DAU Trend (30 days)</h3>
              <BarChart
                data={activeUsers.dauTrend.map(d => ({ label: d.date.slice(5), value: d.count }))}
                color="bg-blue-500"
                height={80}
              />
            </Card>
          )}
        </div>
      )}

      {/* ---- USERS ---- */}
      {subTab === 'users' && userGrowth && activeUsers && retention && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <p className="text-xs font-medium text-neutral-500">DAU</p>
              <p className="text-2xl font-bold text-blue-600">{activeUsers.dau}</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-neutral-500">WAU</p>
              <p className="text-2xl font-bold text-primary-600">{activeUsers.wau}</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-neutral-500">MAU</p>
              <p className="text-2xl font-bold text-emerald-600">{activeUsers.mau}</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-neutral-500">Stickiness (DAU/MAU)</p>
              <p className="text-2xl font-bold text-amber-600">{activeUsers.stickiness}%</p>
            </Card>
          </div>

          {userGrowth.signups?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">New Signups (30 days)</h3>
              <BarChart
                data={userGrowth.signups.map(d => ({ label: d._id.slice(5), value: d.count }))}
                color="bg-green-500"
                height={100}
              />
              <div className="flex gap-4 mt-2 text-xs text-neutral-500">
                <span>Total: {userGrowth.totalUsers}</span>
                <span>Male: {userGrowth.maleCount}</span>
                <span>Female: {userGrowth.femaleCount}</span>
                <span>Verified: {userGrowth.verifiedCount}</span>
                <span>Creators: {userGrowth.creatorCount}</span>
              </div>
            </Card>
          )}

          {activeUsers.dauTrend && (
            <Card>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">DAU Trend</h3>
              <BarChart
                data={activeUsers.dauTrend.map(d => ({ label: d.date.slice(5), value: d.count }))}
                color="bg-blue-500"
                height={80}
              />
            </Card>
          )}

          {retention?.cohorts && (
            <Card>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                Retention Cohorts <span className="font-normal text-neutral-400">(active in last 7 days)</span>
              </h3>
              <div className="space-y-2">
                {retention.cohorts.map(c => (
                  <div key={c.month} className="flex items-center gap-3 text-xs">
                    <span className="w-20 font-medium text-neutral-700 dark:text-neutral-300">{c.month}</span>
                    <div className="flex-1 h-5 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${c.retentionRate}%` }} />
                    </div>
                    <span className="w-20 text-right text-neutral-500">{c.retentionRate}%</span>
                    <span className="w-20 text-right text-neutral-400">{c.retained}/{c.size}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-neutral-500">
                Overall retention: <span className="font-medium text-neutral-700 dark:text-neutral-300">{retention.overallRetention}%</span> ({retention.activeLastWeek}/{retention.totalUsers})
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ---- ENGAGEMENT ---- */}
      {subTab === 'engagement' && engagement && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Posts', value: engagement.totalPosts, sub: engagement.postsInPeriod },
              { label: 'Comments', value: engagement.totalComments, sub: engagement.commentsInPeriod },
              { label: 'Reactions', value: engagement.totalReactions, sub: engagement.reactionsInPeriod },
              { label: 'Stories', value: engagement.totalStories, sub: engagement.storiesInPeriod },
              { label: 'Reels', value: engagement.totalReels, sub: engagement.reelsInPeriod },
            ].map(card => (
              <Card key={card.label}>
                <p className="text-xs font-medium text-neutral-500">{card.label}</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{card.value}</p>
                <p className="text-xs text-green-600">+{card.sub} this period</p>
              </Card>
            ))}
          </div>

          {engagement.reactionBreakdown?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Reaction Types</h3>
              <div className="space-y-1.5">
                {engagement.reactionBreakdown.map(r => {
                  const max = engagement.reactionBreakdown[0]?.count || 1;
                  const colors = { like: 'bg-blue-500', love: 'bg-red-500', haha: 'bg-yellow-500', wow: 'bg-amber-500', sad: 'bg-indigo-500', angry: 'bg-orange-500' };
                  return (
                    <div key={r._id} className="flex items-center gap-2 text-xs">
                      <span className="w-12 capitalize">{r._id}</span>
                      <div className="flex-1 h-4 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${colors[r._id] || 'bg-neutral-500'}`} style={{ width: `${(r.count / max) * 100}%` }} />
                      </div>
                      <span className="w-12 text-right text-neutral-500">{r.count}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {engagement.topPosts?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Top Posts by Engagement</h3>
              <div className="space-y-2">
                {engagement.topPosts.map((p, i) => (
                  <div key={p._id} className="flex items-center gap-3 text-xs">
                    <span className="text-neutral-400 w-4">{i + 1}.</span>
                    <Avatar src={p.author?.profilePhoto} alt={p.author?.name} size="xs" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-neutral-700 dark:text-neutral-300">{p.text?.substring(0, 60) || 'Media post'}</p>
                    </div>
                    <div className="flex gap-2 text-neutral-500 flex-shrink-0">
                      <span>R: {p.analytics?.reach || 0}</span>
                      <span>E: {p.analytics?.engagement || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Average Per Post</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div><span className="text-neutral-500">Reach:</span> <span className="font-medium">{engagement.avgEngagement?.avgReach?.toFixed(0) || 0}</span></div>
              <div><span className="text-neutral-500">Impressions:</span> <span className="font-medium">{engagement.avgEngagement?.avgImpressions?.toFixed(0) || 0}</span></div>
              <div><span className="text-neutral-500">Engagement:</span> <span className="font-medium">{engagement.avgEngagement?.avgEngagement?.toFixed(0) || 0}</span></div>
              <div><span className="text-neutral-500">Clicks:</span> <span className="font-medium">{engagement.avgEngagement?.avgClicks?.toFixed(0) || 0}</span></div>
              <div><span className="text-neutral-500">Shares:</span> <span className="font-medium">{engagement.avgEngagement?.avgShares?.toFixed(0) || 0}</span></div>
            </div>
          </Card>
        </div>
      )}

      {/* ---- CONTENT ---- */}
      {subTab === 'content' && contentTrends && (
        <div className="space-y-4">
          {contentTrends.postsByType?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Posts by Type</h3>
              <div className="space-y-1.5">
                {contentTrends.postsByType.map(r => {
                  const max = Math.max(...contentTrends.postsByType.map(x => x.count), 1);
                  const colors = { profile: 'bg-blue-500', group: 'bg-purple-500', page: 'bg-green-500' };
                  return (
                    <div key={r._id} className="flex items-center gap-2 text-xs">
                      <span className="w-16 capitalize">{r._id || 'unknown'}</span>
                      <div className="flex-1 h-4 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${colors[r._id] || 'bg-neutral-500'}`} style={{ width: `${(r.count / max) * 100}%` }} />
                      </div>
                      <span className="w-12 text-right text-neutral-500">{r.count}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {contentTrends.postsByVisibility?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Posts by Visibility</h3>
              <div className="space-y-1.5">
                {contentTrends.postsByVisibility.map(r => {
                  const max = Math.max(...contentTrends.postsByVisibility.map(x => x.count), 1);
                  const colors = { public: 'bg-green-500', friends: 'bg-blue-500', onlyme: 'bg-neutral-400' };
                  return (
                    <div key={r._id} className="flex items-center gap-2 text-xs">
                      <span className="w-16 capitalize">{r._id}</span>
                      <div className="flex-1 h-4 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${colors[r._id] || 'bg-neutral-500'}`} style={{ width: `${(r.count / max) * 100}%` }} />
                      </div>
                      <span className="w-12 text-right text-neutral-500">{r.count}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {contentTrends.postsPerDay?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Content Per Day (30 days)</h3>
              <BarChart
                data={contentTrends.postsPerDay.map(d => ({ label: d._id.slice(5), value: d.count }))}
                color="bg-blue-500"
                height={80}
              />
            </Card>
          )}

          {contentTrends.topHashtags?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Top Hashtags</h3>
              <div className="space-y-1.5">
                {contentTrends.topHashtags.slice(0, 15).map((h, i) => {
                  const max = contentTrends.topHashtags[0]?.count || 1;
                  return (
                    <div key={h._id} className="flex items-center gap-2 text-xs">
                      <span className="text-neutral-400 w-4">{i + 1}.</span>
                      <span className="font-medium text-primary-600">#{h._id}</span>
                      <div className="flex-1 h-3 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-400 rounded-full" style={{ width: `${(h.count / max) * 100}%` }} />
                      </div>
                      <span className="w-8 text-right text-neutral-500">{h.count}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ---- MODERATION ---- */}
      {subTab === 'moderation' && modStats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <p className="text-xs font-medium text-neutral-500">Avg Resolution</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{modStats.avgResolutionHours}h</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-neutral-500">Escalated Reports</p>
              <p className="text-2xl font-bold text-red-600">{modStats.escalated}</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-neutral-500">Flagged Posts</p>
              <p className="text-2xl font-bold text-amber-600">{modStats.flaggedPosts}</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-neutral-500">Flagged Comments</p>
              <p className="text-2xl font-bold text-amber-600">{modStats.flaggedComments}</p>
            </Card>
          </div>

          {modStats.reportsPerDay?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Report Volume (30 days)</h3>
              <BarChart
                data={modStats.reportsPerDay.map(d => ({ label: d._id.slice(5), value: d.count }))}
                color="bg-red-500"
                height={80}
              />
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modStats.reportsByReason?.length > 0 && (
              <Card>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Reports by Reason</h3>
                <div className="space-y-1.5">
                  {modStats.reportsByReason.map(r => {
                    const max = modStats.reportsByReason[0]?.count || 1;
                    return (
                      <div key={r._id} className="flex items-center gap-2 text-xs">
                        <span className="w-24 capitalize truncate">{r._id?.replace(/_/g, ' ')}</span>
                        <div className="flex-1 h-3 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <div className="h-full bg-red-400 rounded-full" style={{ width: `${(r.count / max) * 100}%` }} />
                        </div>
                        <span className="w-8 text-right text-neutral-500">{r.count}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {modStats.reportsByStatus?.length > 0 && (
              <Card>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Reports by Status</h3>
                <div className="space-y-1.5">
                  {modStats.reportsByStatus.map(r => {
                    const colors = { pending: 'bg-amber-400', reviewed: 'bg-blue-400', resolved: 'bg-green-400', dismissed: 'bg-neutral-400', escalated: 'bg-red-400' };
                    const max = Math.max(...modStats.reportsByStatus.map(x => x.count), 1);
                    return (
                      <div key={r._id} className="flex items-center gap-2 text-xs">
                        <span className="w-16 capitalize">{r._id}</span>
                        <div className="flex-1 h-3 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${colors[r._id] || 'bg-neutral-400'}`} style={{ width: `${(r.count / max) * 100}%` }} />
                        </div>
                        <span className="w-8 text-right text-neutral-500">{r.count}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>

          {modStats.resolutionBreakdown?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Resolution Breakdown</h3>
              <div className="space-y-1.5">
                {modStats.resolutionBreakdown.map(r => {
                  const max = modStats.resolutionBreakdown[0]?.count || 1;
                  return (
                    <div key={r._id} className="flex items-center gap-2 text-xs">
                      <span className="w-32 capitalize">{r._id?.replace(/_/g, ' ')}</span>
                      <div className="flex-1 h-3 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div className="h-full bg-green-400 rounded-full" style={{ width: `${(r.count / max) * 100}%` }} />
                      </div>
                      <span className="w-8 text-right text-neutral-500">{r.count}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ---- MODERATORS ---- */}
      {subTab === 'moderators' && modPerf && (
        <div className="space-y-4">
          {modPerf.actionsPerDay?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Admin Actions Per Day</h3>
              <BarChart
                data={modPerf.actionsPerDay.map(d => ({ label: d._id.slice(5), value: d.count }))}
                color="bg-primary-500"
                height={80}
              />
            </Card>
          )}

          {modPerf.actionsByAdmin?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Actions by Moderator</h3>
              <Card padding={false}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-700">
                        <th className="text-left px-4 py-3 font-medium text-neutral-500">Moderator</th>
                        <th className="text-left px-4 py-3 font-medium text-neutral-500">Total</th>
                        <th className="text-left px-4 py-3 font-medium text-neutral-500">Reports</th>
                        <th className="text-left px-4 py-3 font-medium text-neutral-500">Users</th>
                        <th className="text-left px-4 py-3 font-medium text-neutral-500">Content</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                      {modPerf.actionsByAdmin.map(a => (
                        <tr key={a._id?._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Avatar src={a._id?.profilePhoto} alt={a._id?.name} size="xs" />
                              <div>
                                <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100">{a._id?.name}</p>
                                <p className="text-2xs text-neutral-400 capitalize">{a._id?.role}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs font-medium">{a.totalActions}</td>
                          <td className="px-4 py-3 text-xs text-blue-600">{a.reportActions}</td>
                          <td className="px-4 py-3 text-xs text-amber-600">{a.userActions}</td>
                          <td className="px-4 py-3 text-xs text-purple-600">{a.moderationActions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modPerf.reportsResolved?.length > 0 && (
              <Card>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Reports Resolved</h3>
                <div className="space-y-2">
                  {modPerf.reportsResolved.map(r => (
                    <div key={r._id?._id} className="flex items-center gap-3 text-xs">
                      <Avatar src={r._id?.profilePhoto} alt={r._id?.name} size="xs" />
                      <span className="flex-1 text-neutral-700 dark:text-neutral-300">{r._id?.name}</span>
                      <Badge variant="success" size="xs">{r.count} resolved</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {modPerf.actionTypes?.length > 0 && (
              <Card>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Action Types</h3>
                <div className="space-y-1.5">
                  {modPerf.actionTypes.map(a => {
                    const max = modPerf.actionTypes[0]?.count || 1;
                    return (
                      <div key={a._id} className="flex items-center gap-2 text-xs">
                        <span className="w-32 truncate font-mono">{a._id}</span>
                        <div className="flex-1 h-3 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-400 rounded-full" style={{ width: `${(a.count / max) * 100}%` }} />
                        </div>
                        <span className="w-8 text-right text-neutral-500">{a.count}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ---- REVENUE ---- */}
      {subTab === 'revenue' && revenue && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <p className="text-xs font-medium text-neutral-500">Total Ad Revenue</p>
              <p className="text-2xl font-bold text-emerald-600">${revenue.totalAdSpent.toLocaleString()}</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-neutral-500">Active Ads</p>
              <p className="text-2xl font-bold text-blue-600">{revenue.activeAds}</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-neutral-500">CTR</p>
              <p className="text-2xl font-bold text-amber-600">{revenue.ctr}%</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-neutral-500">Creators</p>
              <p className="text-2xl font-bold text-purple-600">{revenue.creatorCount}</p>
            </Card>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <p className="text-xs font-medium text-neutral-500">Ad Budget</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">${revenue.totalAdBudget.toLocaleString()}</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-neutral-500">Total Impressions</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{revenue.totalImpressions.toLocaleString()}</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-neutral-500">Total Clicks</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{revenue.totalClicks.toLocaleString()}</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-neutral-500">Subscribers</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{revenue.totalSubscribers}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {revenue.adSpendPerDay?.length > 0 && (
              <Card>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Ad Spend Per Day</h3>
                <BarChart
                  data={revenue.adSpendPerDay.map(d => ({ label: d._id.slice(5), value: d.spent }))}
                  color="bg-emerald-500"
                  height={80}
                />
              </Card>
            )}

            {revenue.creatorCategories?.length > 0 && (
              <Card>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Creator Categories</h3>
                <div className="space-y-1.5">
                  {revenue.creatorCategories.map(c => {
                    const max = revenue.creatorCategories[0]?.count || 1;
                    return (
                      <div key={c._id} className="flex items-center gap-2 text-xs">
                        <span className="w-24 capitalize truncate">{c._id || 'uncategorized'}</span>
                        <div className="flex-1 h-3 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-400 rounded-full" style={{ width: `${(c.count / max) * 100}%` }} />
                        </div>
                        <span className="w-8 text-right text-neutral-500">{c.count}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <p className="text-xs font-medium text-neutral-500">Boosted Posts</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{revenue.boostedPosts}</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-neutral-500">Sponsored Posts</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{revenue.sponsoredPosts}</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-neutral-500">Total Ads</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{revenue.totalAds}</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-neutral-500">Listings</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{revenue.totalListings}</p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// SYSTEM CONTROL TAB
// ============================================================

const SystemControlTab = () => {
  const [subTab, setSubTab] = useState('health');

  const subTabs = [
    { key: 'health', label: 'API Health' },
    { key: 'settings', label: 'Settings' },
    { key: 'features', label: 'Features' },
    { key: 'maintenance', label: 'Maintenance' },
    { key: 'announcement', label: 'Announcement' },
    { key: 'jobs', label: 'Jobs' },
    { key: 'errors', label: 'Error Logs' },
    { key: 'cache', label: 'Cache' },
    { key: 'database', label: 'Database' },
  ];

  return (
    <div className="space-y-4">
      <Tabs tabs={subTabs} activeTab={subTab} onChange={setSubTab} className="mb-4" />

      {subTab === 'health' && <HealthPanel />}
      {subTab === 'settings' && <SettingsPanel />}
      {subTab === 'features' && <FeaturesPanel />}
      {subTab === 'maintenance' && <MaintenancePanel />}
      {subTab === 'announcement' && <AnnouncementPanel />}
      {subTab === 'jobs' && <JobsPanel />}
      {subTab === 'errors' && <ErrorsPanel />}
      {subTab === 'cache' && <CachePanel />}
      {subTab === 'database' && <DatabasePanel />}
    </div>
  );
};

// --- Health Panel ---
const HealthPanel = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try { const res = await API.get('/admin/system/health'); setHealth(res.data); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchHealth(); }, []);

  if (loading) return <div className="text-center py-8 text-neutral-500">Checking health...</div>;
  if (!health) return <div className="text-center py-8 text-red-500">Failed to load health</div>;

  const statusColor = { healthy: 'text-green-600 bg-green-50 dark:bg-green-900/20', degraded: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20', unhealthy: 'text-red-600 bg-red-50 dark:bg-red-900/20' };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <p className="text-xs font-medium text-neutral-500">Status</p>
          <p className={`text-2xl font-bold ${statusColor[health.status] || 'text-neutral-600'} px-2 py-0.5 rounded inline-block mt-1`}>{health.status}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-neutral-500">Uptime</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-neutral-500">Node.js</p>
          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{health.nodeVersion}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-neutral-500">Memory (Heap)</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{health.memory?.heapUsed}MB <span className="text-sm text-neutral-400">/ {health.memory?.heapTotal}MB</span></p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Services</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span>MongoDB</span>
              <Badge variant={health.db?.status === 'connected' ? 'success' : 'danger'} size="xs">{health.db?.status} ({health.db?.latency}ms)</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Redis</span>
              <Badge variant={health.redis?.status === 'connected' ? 'success' : 'warning'} size="xs">{health.redis?.status}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>DB Host</span>
              <span className="text-neutral-500">{health.db?.host}</span>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Performance (last 5 min)</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span>Requests/min</span>
              <span className="font-medium">{health.performance?.requestsPerMinute}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Avg Response</span>
              <span className="font-medium">{health.performance?.avgResponseTime}ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Error Rate</span>
              <span className={`font-medium ${parseFloat(health.performance?.errorRate) > 5 ? 'text-red-600' : 'text-green-600'}`}>{health.performance?.errorRate}%</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="text-center">
        <Button size="sm" variant="ghost" onClick={fetchHealth}>Refresh</Button>
      </div>
    </div>
  );
};

// --- Settings Panel ---
const SettingsPanel = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try { const res = await API.get('/admin/system/settings'); setSettings(res.data); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: { ...prev[key], value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {};
      Object.entries(settings).forEach(([k, v]) => { payload[k] = v.value; });
      await API.put('/admin/system/settings', { settings: payload });
      alert('Settings saved');
    } catch { alert('Failed to save'); }
    setSaving(false);
  };

  if (loading) return <div className="text-center py-8 text-neutral-500">Loading...</div>;

  const categories = { site: 'Site Info', security: 'Security', upload: 'Uploads' };

  return (
    <div className="space-y-4">
      {Object.entries(categories).map(([cat, label]) => (
        <Card key={cat}>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">{label}</h3>
          <div className="space-y-3">
            {Object.entries(settings).filter(([, v]) => v.category === cat).map(([key, s]) => (
              <div key={key} className="flex items-center gap-3">
                <label className="text-xs text-neutral-600 dark:text-neutral-400 w-40 flex-shrink-0">{s.description || key}</label>
                {typeof s.value === 'boolean' ? (
                  <button onClick={() => handleChange(key, !s.value)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${s.value ? 'bg-primary-500' : 'bg-neutral-300 dark:bg-neutral-600'}`}>
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${s.value ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                  </button>
                ) : typeof s.value === 'number' ? (
                  <input type="number" value={s.value} onChange={e => handleChange(key, parseInt(e.target.value) || 0)} className="w-24 border border-neutral-300 dark:border-neutral-600 rounded px-2 py-1 text-sm bg-white dark:bg-neutral-800" />
                ) : (
                  <input type="text" value={s.value} onChange={e => handleChange(key, e.target.value)} className="flex-1 border border-neutral-300 dark:border-neutral-600 rounded px-2 py-1 text-sm bg-white dark:bg-neutral-800" />
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
      </div>
    </div>
  );
};

// --- Features Panel ---
const FeaturesPanel = () => {
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchFeatures = async () => {
    setLoading(true);
    try { const res = await API.get('/admin/system/features'); setFeatures(res.data); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchFeatures(); }, []);

  const toggle = async (key) => {
    try {
      const res = await API.put(`/admin/system/features/${key}/toggle`);
      setFeatures(prev => ({ ...prev, [key]: res.data.enabled }));
    } catch { alert('Failed'); }
  };

  if (loading) return <div className="text-center py-8 text-neutral-500">Loading...</div>;

  const labels = {
    allow_signup: 'User Signups', allow_stories: 'Stories', allow_reels: 'Reels',
    allow_marketplace: 'Marketplace', allow_groups: 'Groups', allow_pages: 'Pages',
    allow_events: 'Events', allow_messaging: 'Messaging', allow_live: 'Live Streaming',
    allow_creator_program: 'Creator Program', allow_ads: 'Advertising',
  };

  return (
    <Card>
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Feature Flags</h3>
      <div className="space-y-3">
        {Object.entries(features).map(([key, enabled]) => (
          <div key={key} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-700 last:border-0">
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{labels[key] || key}</p>
              <p className="text-xs text-neutral-400">{key}</p>
            </div>
            <button onClick={() => toggle(key)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-green-500' : 'bg-neutral-300 dark:bg-neutral-600'}`}>
              <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
};

// --- Maintenance Panel ---
const MaintenancePanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try { const res = await API.get('/admin/system/maintenance'); setData(res.data); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const toggle = async () => {
    try {
      const res = await API.put('/admin/system/maintenance/toggle');
      setData(prev => ({ ...prev, enabled: res.data.enabled }));
    } catch { alert('Failed'); }
  };

  if (loading) return <div className="text-center py-8 text-neutral-500">Loading...</div>;

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Maintenance Mode</h3>
            <p className="text-xs text-neutral-500 mt-0.5">When enabled, only admins can access the site</p>
          </div>
          <button onClick={toggle} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${data?.enabled ? 'bg-red-500' : 'bg-neutral-300 dark:bg-neutral-600'}`}>
            <span className={`inline-block h-5 w-5 rounded-full bg-white transition-transform shadow ${data?.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
        {data?.enabled && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">MAINTENANCE MODE IS ACTIVE</p>
            <p className="text-xs text-red-500 mt-1">{data.message}</p>
          </div>
        )}
      </div>
    </Card>
  );
};

// --- Announcement Panel ---
const AnnouncementPanel = () => {
  const [data, setData] = useState({ enabled: false, text: '', type: 'info', link: '', dismissable: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    API.get('/admin/system/announcement').then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await API.put('/admin/system/announcement', data);
      alert('Announcement saved');
    } catch { alert('Failed'); }
    setSaving(false);
  };

  if (loading) return <div className="text-center py-8 text-neutral-500">Loading...</div>;

  const typeColors = { info: 'bg-blue-500', warning: 'bg-amber-500', success: 'bg-green-500', error: 'bg-red-500' };

  return (
    <div className="space-y-4">
      <Card>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Announcement Banner</h3>
            <button onClick={() => setData(p => ({ ...p, enabled: !p.enabled }))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${data.enabled ? 'bg-green-500' : 'bg-neutral-300 dark:bg-neutral-600'}`}>
              <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow ${data.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Banner Text</label>
            <input type="text" value={data.text} onChange={e => setData(p => ({ ...p, text: e.target.value }))} placeholder="Enter announcement text..." className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-800 mt-1" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Type</label>
              <select value={data.type} onChange={e => setData(p => ({ ...p, type: e.target.value }))} className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-800 mt-1">
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Link URL (optional)</label>
              <input type="text" value={data.link} onChange={e => setData(p => ({ ...p, link: e.target.value }))} placeholder="https://..." className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-800 mt-1" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={data.dismissable} onChange={e => setData(p => ({ ...p, dismissable: e.target.checked }))} className="rounded" />
            <label className="text-xs text-neutral-600 dark:text-neutral-400">Users can dismiss this banner</label>
          </div>
        </div>
      </Card>

      {data.enabled && data.text && (
        <Card>
          <h4 className="text-xs font-medium text-neutral-500 mb-2">Preview</h4>
          <div className={`${typeColors[data.type]} text-white px-4 py-3 rounded-lg text-sm flex items-center gap-2`}>
            <span className="flex-1">{data.text}</span>
            {data.dismissable && <span className="text-white/70 cursor-pointer">✕</span>}
          </div>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Announcement'}</Button>
      </div>
    </div>
  );
};

// --- Jobs Panel ---
const JobsPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    setLoading(true);
    try { const res = await API.get('/admin/system/jobs'); setData(res.data); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleCleanup = async () => {
    try { await API.post('/admin/system/jobs/cleanup'); fetchJobs(); } catch { alert('Failed'); }
  };

  const handleToggle = async () => {
    try { const res = await API.put('/admin/system/jobs/toggle'); setData(p => ({ ...p, isRunning: res.data.isRunning })); } catch { alert('Failed'); }
  };

  if (loading) return <div className="text-center py-8 text-neutral-500">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Background Jobs</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={fetchJobs}>Refresh</Button>
          <Button size="sm" variant="ghost" onClick={handleCleanup}>Cleanup</Button>
          <Button size="sm" variant={data?.isRunning ? 'danger' : 'success'} onClick={handleToggle}>
            {data?.isRunning ? 'Pause' : 'Resume'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <p className="text-xs font-medium text-neutral-500">Status</p>
          <Badge variant={data?.isRunning ? 'success' : 'danger'} size="sm">{data?.isRunning ? 'Running' : 'Paused'}</Badge>
        </Card>
        {data?.queues && Object.entries(data.queues).map(([name, stats]) => (
          <Card key={name}>
            <p className="text-xs font-medium text-neutral-500 capitalize">{name}</p>
            <div className="flex gap-2 text-xs mt-1">
              <span className="text-amber-600">{stats.waiting} waiting</span>
              <span className="text-blue-600">{stats.processing} active</span>
            </div>
            <div className="flex gap-2 text-xs mt-0.5">
              <span className="text-green-600">{stats.completed} done</span>
              <span className="text-red-600">{stats.failed} failed</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// --- Errors Panel ---
const ErrorsPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchErrors = async () => {
    setLoading(true);
    try { const res = await API.get('/admin/system/errors?limit=50'); setData(res.data); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchErrors(); }, []);

  const handleClear = async () => {
    try { await API.post('/admin/system/errors/clear'); fetchErrors(); } catch { alert('Failed'); }
  };

  if (loading) return <div className="text-center py-8 text-neutral-500">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Error Logs</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={fetchErrors}>Refresh</Button>
          <Button size="sm" variant="danger" onClick={handleClear}>Clear Old</Button>
        </div>
      </div>

      {data?.stats && (
        <div className="grid grid-cols-3 gap-3">
          <Card><p className="text-xs text-neutral-500">Total</p><p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{data.stats.total}</p></Card>
          <Card><p className="text-xs text-neutral-500">Last 24h</p><p className="text-xl font-bold text-amber-600">{data.stats.last24h}</p></Card>
          <Card><p className="text-xs text-neutral-500">Last Hour</p><p className="text-xl font-bold text-red-600">{data.stats.lastHour}</p></Card>
        </div>
      )}

      {data?.stats?.byCode && Object.keys(data.stats.byCode).length > 0 && (
        <Card>
          <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Errors by Code (24h)</h4>
          <div className="flex flex-wrap gap-1">
            {Object.entries(data.stats.byCode).map(([code, count]) => (
              <Badge key={code} variant="danger" size="xs">{code}: {count}</Badge>
            ))}
          </div>
        </Card>
      )}

      <Card padding={false}>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-700 max-h-[50vh] overflow-y-auto">
          {data?.errors?.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 text-sm">No errors</div>
          ) : data?.errors?.map(e => (
            <div key={e.id} className="px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="danger" size="xs">{e.code}</Badge>
                <span className="text-xs text-neutral-400">{new Date(e.timestamp).toLocaleString()}</span>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">{e.message}</p>
              {e.context?.method && <p className="text-xs text-neutral-400 mt-0.5">{e.context.method} {e.context.path}</p>}
              {e.stack && <pre className="text-2xs text-neutral-400 mt-1 max-h-16 overflow-y-auto whitespace-pre-wrap">{e.stack.substring(0, 300)}</pre>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// --- Cache Panel ---
const CachePanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { API.get('/admin/system/cache').then(res => setData(res.data)).finally(() => setLoading(false)); }, []);

  const handleFlush = async (pattern) => {
    try { await API.post('/admin/system/cache/flush', { pattern }); alert('Cache flushed'); } catch { alert('Failed'); }
  };

  if (loading) return <div className="text-center py-8 text-neutral-500">Loading...</div>;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Cache Management</h3>
        </div>
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span>Redis</span>
            <Badge variant={data?.redis?.available ? 'success' : 'warning'} size="xs">{data?.redis?.available ? 'Connected' : 'Unavailable (memory cache)'}</Badge>
          </div>
        </div>
      </Card>

      <Card>
        <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Cache Key Patterns</h4>
        <div className="flex flex-wrap gap-1 mb-3">
          {data?.keys?.map(k => (
            <Badge key={k} variant="neutral" size="xs">{k}*</Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="danger" onClick={() => handleFlush(null)}>Flush All</Button>
          {data?.keys?.slice(0, 5).map(k => (
            <Button key={k} size="sm" variant="ghost" onClick={() => handleFlush(k)}>{k.replace(/:$/, '')}</Button>
          ))}
        </div>
      </Card>
    </div>
  );
};

// --- Database Panel ---
const DatabasePanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { API.get('/admin/system/database').then(res => setData(res.data)).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="text-center py-8 text-neutral-500">Loading...</div>;

  return (
    <div className="space-y-4">
      {data?.connection && (
        <Card>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Connection</h3>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div><span className="text-neutral-500">Status:</span> <Badge variant={data.connection.state === 'connected' ? 'success' : 'danger'} size="xs">{data.connection.state}</Badge></div>
            <div><span className="text-neutral-500">Host:</span> <span className="font-medium">{data.connection.host}</span></div>
            <div><span className="text-neutral-500">Database:</span> <span className="font-medium">{data.connection.name}</span></div>
          </div>
        </Card>
      )}

      {data?.dbStats && (
        <Card>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Database Size</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div><span className="text-neutral-500">Data:</span> <span className="font-medium">{data.dbStats.size} MB</span></div>
            <div><span className="text-neutral-500">Storage:</span> <span className="font-medium">{data.dbStats.storageSize} MB</span></div>
            <div><span className="text-neutral-500">Indexes:</span> <span className="font-medium">{data.dbStats.indexes}</span></div>
            <div><span className="text-neutral-500">Index Size:</span> <span className="font-medium">{data.dbStats.indexSize} MB</span></div>
          </div>
        </Card>
      )}

      {data?.collections?.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Collections</h3>
          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="text-left px-4 py-3 font-medium text-neutral-500">Collection</th>
                    <th className="text-right px-4 py-3 font-medium text-neutral-500">Documents</th>
                    <th className="text-right px-4 py-3 font-medium text-neutral-500">Last Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                  {data.collections.map(c => (
                    <tr key={c.name} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                      <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100 capitalize">{c.name}</td>
                      <td className="px-4 py-3 text-right text-xs">{c.count.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-xs text-neutral-500">{c.lastActivity ? new Date(c.lastActivity).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Card>
      )}
    </div>
  );
};

// --- Bulk Actions ---
const BulkActionsTab = () => {
  const [type, setType] = useState('post');
  const [action, setAction] = useState('remove');
  const [ids, setIds] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleBulk = async () => {
    const idArray = ids.split(',').map(id => id.trim()).filter(Boolean);
    if (idArray.length === 0) return alert('Enter at least one ID');
    if (!window.confirm(`Are you sure you want to ${action} ${idArray.length} ${type}(s)?`)) return;

    setLoading(true);
    try {
      const res = await API.post('/admin/moderation/bulk', { type, ids: idArray, action });
      setResult(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Bulk Content Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Content Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-800">
              <option value="post">Posts</option>
              <option value="comment">Comments</option>
              <option value="story">Stories</option>
              <option value="reel">Reels</option>
              <option value="listing">Listings</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Action</label>
            <select value={action} onChange={e => setAction(e.target.value)} className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-800">
              <option value="remove">Remove</option>
              <option value="flag">Flag</option>
              <option value="unflag">Unflag</option>
              <option value="hide">Hide</option>
              <option value="unhide">Unhide</option>
              <option value="approve">Approve</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">IDs (comma separated)</label>
            <Input value={ids} onChange={e => setIds(e.target.value)} placeholder="id1, id2, id3..." />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={handleBulk} disabled={loading} variant={action === 'remove' ? 'danger' : 'primary'}>
            {loading ? 'Processing...' : `Execute Bulk ${action}`}
          </Button>
          {result && (
            <Badge variant="success" size="sm">{result.affected} items {action}d</Badge>
          )}
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Shadow Moderation</h3>
        <p className="text-xs text-neutral-500 mb-4">Shadow hidden content is invisible to everyone except the author. The author still sees their own content but nobody else does.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Content Type</label>
            <select id="shadow-type" className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-800">
              <option value="post">Post</option>
              <option value="comment">Comment</option>
              <option value="story">Story</option>
              <option value="reel">Reel</option>
              <option value="listing">Listing</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Content ID</label>
            <Input id="shadow-id" placeholder="Enter content ID..." />
          </div>
          <div className="flex items-end">
            <Button onClick={async () => {
              const t = document.getElementById('shadow-type').value;
              const id = document.getElementById('shadow-id').value.trim();
              if (!id) return alert('Enter a content ID');
              try {
                await API.put(`/admin/moderation/${t}/${id}/shadow-hide`);
                alert('Content shadow hidden successfully');
                document.getElementById('shadow-id').value = '';
              } catch (err) { alert('Failed'); }
            }} variant="danger">Shadow Hide</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminPanel;
