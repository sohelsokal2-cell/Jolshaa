import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import AdminLayout from '../components/admin/AdminLayout';
import MonetizationTab from '../components/admin/MonetizationTab';
import Drawer from '../components/admin/Drawer';
import BulkActionBar from '../components/admin/BulkActionBar';
import Avatar from '../components/ui/Avatar';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Tabs from '../components/ui/Tabs';
import Modal from '../components/ui/Modal';

const SUPERADMIN_ONLY_TAB_KEYS = ['system', 'security', 'ops'];

const AdminPanel = () => {
  const { user } = useAuth();
  const canAccessAdmin = user?.isAdmin || user?.role === 'superadmin';
  const isSuperadmin = user?.role === 'superadmin';
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSuperadmin && SUPERADMIN_ONLY_TAB_KEYS.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [activeTab, isSuperadmin]);

  if (!canAccessAdmin) {
    return (
      <AdminLayout activeSection="dashboard" onSectionChange={setActiveTab} isSuperadmin={isSuperadmin}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h2 className="text-xl font-bold font-display text-jolshaa-on-surface mb-1">Access Denied</h2>
            <p className="text-sm text-jolshaa-on-surface-variant">You don't have admin privileges.</p>
            <Link to="/feed" className="inline-block mt-4 text-sm text-jolshaa-teal hover:underline">Go to Feed</Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeSection={activeTab} onSectionChange={setActiveTab} isSuperadmin={isSuperadmin}>
      <div className="max-w-7xl mx-auto">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'reports' && <ReportsTab />}
        {activeTab === 'safety' && <SafetyDashboardTab />}
        {activeTab === 'spam' && <SpamQueueTab />}
        {activeTab === 'blocked' && <BlockedUsersTab />}
        {activeTab === 'offenders' && <RepeatOffendersTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'system' && <SystemControlTab />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'support' && <SupportTab />}
        {activeTab === 'appeals' && <AppealsTab />}
        {activeTab === 'posts' && <PostsModerationTab />}
        {activeTab === 'comments' && <CommentsModerationTab />}
        {activeTab === 'stories' && <StoriesModerationTab />}
        {activeTab === 'reels' && <ReelsModerationTab />}
        {activeTab === 'listings' && <ListingsModerationTab />}
        {activeTab === 'bulk' && <BulkActionsTab />}
        {activeTab === 'factcheck' && <FactCheckReviewTab />}
        {activeTab === 'verification' && <VerificationTab />}
        {activeTab === 'admins' && <AdminsTab />}
        {activeTab === 'audit' && <AuditTab />}
        {activeTab === 'content-tools' && <ContentToolsTab />}
        {activeTab === 'monetization' && <MonetizationTab />}
        {activeTab === 'community' && <CommunityTab />}
        {activeTab === 'ops' && <OpsQualityTab />}
      </div>
    </AdminLayout>
  );
};

// --- Dashboard ---
const DashboardTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/stats').then(res => setStats(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;
  if (!stats) return null;

  const priorityCards = [
    { label: 'Pending Reports', value: stats.pendingReports, color: 'text-red-600', bg: 'bg-red-50', urgent: true },
    { label: 'Pending Appeals', value: stats.pendingAppeals, color: 'text-amber-600', bg: 'bg-amber-50', urgent: true },
    { label: 'Pending Verifications', value: stats.pendingVerifications, color: 'text-blue-600', bg: 'bg-blue-50', urgent: false },
    { label: 'Suspended Users', value: stats.suspendedUsers, color: 'text-amber-600', bg: 'bg-amber-50', urgent: false },
  ];

  const overviewCards = [
    { label: 'Total Users', value: stats.totalUsers, color: 'text-jolshaa-teal', bg: 'bg-jolshaa-teal/10' },
    { label: 'Total Posts', value: stats.totalPosts, color: 'text-jolshaa-on-surface', bg: 'bg-jolshaa-surface-container-low' },
    { label: 'Active Today', value: stats.activeToday, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Banned Users', value: stats.bannedUsers, color: 'text-red-700', bg: 'bg-red-50' },
    { label: 'Groups', value: stats.totalGroups, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pages', value: stats.totalPages, color: 'text-jolshaa-indigo', bg: 'bg-jolshaa-indigo/10' },
    { label: 'Verified', value: stats.verifiedUsers, color: 'text-jolshaa-teal', bg: 'bg-jolshaa-teal/10' },
    { label: 'Admin Actions', value: stats.totalAdminActions, color: 'text-jolshaa-on-surface', bg: 'bg-jolshaa-surface-container-low' },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-jolshaa-on-surface">Admin Dashboard</h1>
        <p className="text-sm text-jolshaa-on-surface-variant mt-1">Platform overview and things that need your attention</p>
      </div>

      {/* What needs attention now */}
      <Card className="border-l-4 border-l-red-500">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">What needs attention now</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {priorityCards.map(card => (
            <div key={card.label} className={`p-3 rounded-lg ${card.bg} flex items-center justify-between`}>
              <div>
                <p className="text-xs font-medium text-jolshaa-on-surface-variant">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              </div>
              {card.urgent && card.value > 0 && (
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Two-column layout: Overview + Recent Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overview stats */}
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Platform Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {overviewCards.map(card => (
              <Card key={card.label} className={`${card.bg}`}>
                <p className="text-xs font-medium text-jolshaa-on-surface-variant">{card.label}</p>
                <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent admin actions */}
        <div>
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Recent Actions</h3>
          <Card>
            {stats.recentActions?.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActions.slice(0, 8).map(action => (
                  <div key={action._id} className="flex items-start gap-2 text-xs">
                    <Avatar src={action.admin?.profilePhoto} alt={action.admin?.name} size="xs" />
                    <div className="min-w-0">
                      <p className="text-jolshaa-on-surface">
                        <span className="font-medium">{action.admin?.name}</span>
                      </p>
                      <p className="text-jolshaa-on-surface-variant truncate">{action.action}</p>
                      <p className="text-jolshaa-on-surface-variant/70 text-2xs">{new Date(action.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-jolshaa-on-surface-variant text-center py-4">No recent actions</p>
            )}
          </Card>
        </div>
      </div>

      {/* Quick actions */}
      <Card>
        <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="primary" onClick={() => window.location.hash = '#users'}>Manage Users</Button>
          <Button size="sm" variant="danger" onClick={() => window.location.hash = '#reports'}>Review Reports</Button>
          <Button size="sm" variant="warning" onClick={() => window.location.hash = '#spam'}>Spam Queue</Button>
          <Button size="sm" onClick={() => window.location.hash = '#verification'}>Verifications</Button>
          <Button size="sm" onClick={() => window.location.hash = '#support'}>Support Tickets</Button>
        </div>
      </Card>
    </div>
  );
};

// --- Users ---
const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState('-createdAt');
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerUser, setDrawerUser] = useState(null);
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
      if (roleFilter) params.set('role', roleFilter);
      if (sortBy) params.set('sort', sortBy);
      const res = await API.get(`/admin/users?${params}`);
      setUsers(res.data.users);
    } catch (err) {
      console.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [filter, roleFilter, sortBy]);

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
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-jolshaa-on-surface">Users</h1>
        <p className="text-sm text-jolshaa-on-surface-variant mt-1">Manage user accounts, roles, and restrictions</p>
      </div>

      {/* Filter bar */}
      <Card>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px]">
            <Input placeholder="Search by name or email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchUsers()} />
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)} className="text-sm border border-jolshaa-outline-variant rounded-lg px-3 py-2 bg-jolshaa-surface-container-lowest text-jolshaa-on-surface">
            <option value="">All Status</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
            <option value="verified">Verified</option>
          </select>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="text-sm border border-jolshaa-outline-variant rounded-lg px-3 py-2 bg-jolshaa-surface-container-lowest text-jolshaa-on-surface">
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Superadmin</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="text-sm border border-jolshaa-outline-variant rounded-lg px-3 py-2 bg-jolshaa-surface-container-lowest text-jolshaa-on-surface">
            <option value="-createdAt">Newest</option>
            <option value="createdAt">Oldest</option>
            <option value="name">Name A-Z</option>
          </select>
          <Button onClick={fetchUsers} size="sm">Search</Button>
        </div>
      </Card>

      {/* User table */}
      {loading ? (
        <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-jolshaa-outline-variant">
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">User</th>
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-jolshaa-on-surface-variant">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-jolshaa-outline-variant">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-jolshaa-surface-container-low group">
                    <td className="px-4 py-3">
                      <button onClick={() => setDrawerUser(u)} className="flex items-center gap-3 text-left hover:opacity-80">
                        <Avatar src={u.profilePhoto} alt={u.name} size="sm" />
                        <div>
                          <p className="font-medium text-jolshaa-on-surface">{u.name}</p>
                          <p className="text-xs text-jolshaa-on-surface-variant">{u.email}</p>
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role || 'user'}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="text-xs border border-jolshaa-outline-variant rounded-lg px-2 py-1 bg-jolshaa-surface-container-lowest text-jolshaa-on-surface"
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
                      <div className="flex gap-1 justify-end flex-wrap opacity-50 group-hover:opacity-100 transition-opacity">
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
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && <p className="text-center py-6 text-jolshaa-on-surface-variant text-sm">No users found</p>}
        </Card>
      )}

      {/* User Detail Drawer */}
      <Drawer isOpen={!!drawerUser} onClose={() => setDrawerUser(null)} title="User Details">
        {drawerUser && (
          <div className="p-6 space-y-6">
            {/* Profile header */}
            <div className="flex items-center gap-4">
              <Avatar src={drawerUser.profilePhoto} alt={drawerUser.name} size="lg" />
              <div>
                <h3 className="text-lg font-semibold font-display text-jolshaa-on-surface">{drawerUser.name}</h3>
                <p className="text-sm text-jolshaa-on-surface-variant">{drawerUser.email}</p>
                <div className="flex gap-1 mt-1">
                  {drawerUser.isVerified && <Badge variant="primary" size="xs">Verified</Badge>}
                  {drawerUser.isSuspended && <Badge variant="warning" size="xs">Suspended</Badge>}
                  {drawerUser.isBanned && <Badge variant="danger" size="xs">Banned</Badge>}
                  {drawerUser.isAdmin && <Badge variant="primary" size="xs">Admin</Badge>}
                </div>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-jolshaa-surface-container-low rounded-lg">
                <p className="text-xs text-jolshaa-on-surface-variant">Role</p>
                <p className="text-sm font-medium text-jolshaa-on-surface capitalize">{drawerUser.role || 'user'}</p>
              </div>
              <div className="p-3 bg-jolshaa-surface-container-low rounded-lg">
                <p className="text-xs text-jolshaa-on-surface-variant">Joined</p>
                <p className="text-sm font-medium text-jolshaa-on-surface">{new Date(drawerUser.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="p-3 bg-jolshaa-surface-container-low rounded-lg">
                <p className="text-xs text-jolshaa-on-surface-variant">Creator</p>
                <p className="text-sm font-medium text-jolshaa-on-surface">{drawerUser.isCreator ? 'Yes' : 'No'}</p>
              </div>
              <div className="p-3 bg-jolshaa-surface-container-low rounded-lg">
                <p className="text-xs text-jolshaa-on-surface-variant">Warnings</p>
                <p className="text-sm font-medium text-jolshaa-on-surface">{drawerUser.warnings?.length || 0}</p>
              </div>
            </div>

            {/* Quick actions */}
            {!drawerUser.isAdmin && (
              <div>
                <p className="text-sm font-medium text-jolshaa-on-surface mb-3">Quick Actions</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { setSelectedUser(drawerUser); setShowWarnModal(true); }}>Warn</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setSelectedUser(drawerUser); setShowRestrictModal(true); }}>Restrict</Button>
                  <Button size="sm" variant={drawerUser.isBanned ? 'success' : 'danger'} onClick={() => { setSelectedUser(drawerUser); setShowBanModal(true); }}>
                    {drawerUser.isBanned ? 'Unban' : 'Ban'}
                  </Button>
                  <Button size="sm" variant={drawerUser.isSuspended ? 'success' : 'secondary'} onClick={() => { setSelectedUser(drawerUser); setShowSuspendModal(true); }}>
                    {drawerUser.isSuspended ? 'Unsuspend' : 'Suspend'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleVerify(drawerUser._id)}>
                    {drawerUser.isVerified ? 'Unverify' : 'Verify'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

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
            <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">Restriction Type</label>
            <select value={restrictType} onChange={e => setRestrictType(e.target.value)} className="w-full border border-jolshaa-outline-variant rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest text-jolshaa-on-surface">
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
            <p className="text-sm text-jolshaa-on-surface-variant">Are you sure you want to unban this user?</p>
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
            <p className="text-sm text-jolshaa-on-surface-variant">Are you sure you want to unsuspend this user?</p>
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
  const priorityBg = { low: 'bg-jolshaa-surface-container-low', medium: 'bg-amber-50', high: 'bg-red-50', critical: 'bg-red-100' };
  const resolutionLabels = { none: '-', content_removed: 'Content Removed', warning_issued: 'Warning Issued', account_suspended: 'Account Suspended', account_banned: 'Account Banned', no_action: 'No Action', other: 'Other' };

  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const escalatedCount = reports.filter(r => r.status === 'escalated').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-jolshaa-on-surface">Reports & Safety</h1>
        <p className="text-sm text-jolshaa-on-surface-variant mt-1">Review reports, assign, escalate, and resolve incidents</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-amber-50 border-l-4 border-l-amber-500">
          <p className="text-xs text-jolshaa-on-surface-variant">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
        </Card>
        <Card className="bg-red-50 border-l-4 border-l-red-500">
          <p className="text-xs text-jolshaa-on-surface-variant">Escalated</p>
          <p className="text-2xl font-bold text-red-600">{escalatedCount}</p>
        </Card>
        <Card className="bg-jolshaa-surface-container-low border-l-4 border-l-jolshaa-outline">
          <p className="text-xs text-jolshaa-on-surface-variant">Total Loaded</p>
          <p className="text-2xl font-bold text-jolshaa-on-surface">{reports.length}</p>
        </Card>
      </div>

      {/* Filter bar */}
      <Card>
        <div className="flex flex-wrap gap-3 items-center">
          {/* Status tabs */}
          <div className="flex gap-1">
            {['pending', 'reviewed', 'escalated', 'resolved', 'dismissed', 'all'].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  filter === s
                    ? 'bg-jolshaa-teal text-jolshaa-on-teal'
                    : 'bg-jolshaa-surface-container-low text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-jolshaa-outline-variant" />

          {/* Priority filter */}
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="text-xs border border-jolshaa-outline-variant rounded-lg px-2 py-1.5 bg-jolshaa-surface-container-lowest text-jolshaa-on-surface">
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          {/* Reason filter */}
          <select value={reasonFilter} onChange={e => setReasonFilter(e.target.value)} className="text-xs border border-jolshaa-outline-variant rounded-lg px-2 py-1.5 bg-jolshaa-surface-container-lowest text-jolshaa-on-surface">
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
      </Card>

      {/* Reports list - incident console style */}
      {loading ? (
        <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 text-jolshaa-on-surface-variant">No reports found</div>
      ) : (
        <div className="space-y-2">
          {reports.map(report => (
            <Card key={report._id} className={`${priorityBg[report.priority] || 'bg-jolshaa-surface-container-lowest'} transition-all hover:shadow-ambient-hover`}>
              <div className="flex items-start gap-3">
                {/* Priority indicator */}
                <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${
                  report.priority === 'critical' ? 'bg-red-500' :
                  report.priority === 'high' ? 'bg-orange-500' :
                  report.priority === 'medium' ? 'bg-amber-400' : 'bg-jolshaa-outline-variant'
                }`} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header row */}
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant={statusColors[report.status]} size="xs">{report.status}</Badge>
                    <Badge variant={priorityColors[report.priority]} size="xs">{report.priority}</Badge>
                    {report.escalationLevel > 0 && (
                      <Badge variant="danger" size="xs">L{report.escalationLevel}</Badge>
                    )}
                    <span className="text-xs font-medium text-jolshaa-on-surface-variant capitalize">{report.targetType}</span>
                    <span className="text-xs text-jolshaa-on-surface-variant">·</span>
                    <span className="text-xs text-jolshaa-on-surface-variant">{report.reason?.replace(/_/g, ' ')}</span>
                    {report.isAutoFlagged && <Badge variant="warning" size="xs">Auto</Badge>}
                  </div>

                  {/* Reporter info */}
                  <p className="text-sm text-jolshaa-on-surface">
                    <span className="font-medium">{report.reporter?.name}</span> reported this {report.targetType}
                  </p>

                  {/* Description */}
                  {report.description && (
                    <p className="text-xs text-jolshaa-on-surface-variant mt-1 italic">"{report.description}"</p>
                  )}

                  {/* Meta info */}
                  <div className="flex items-center gap-3 mt-2 text-2xs text-jolshaa-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {new Date(report.createdAt).toLocaleString()}
                    </span>
                    {report.assignedTo && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        {report.assignedTo.name}
                      </span>
                    )}
                    {report.resolution && report.resolution !== 'none' && (
                      <span className="text-green-600">✓ {resolutionLabels[report.resolution]}</span>
                    )}
                  </div>

                  {/* Evidence links */}
                  {report.evidenceUrls?.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {report.evidenceUrls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-2xs text-jolshaa-teal hover:underline">Evidence {i + 1}</a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
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
            <p className="text-sm text-jolshaa-on-surface-variant">Assign this report to yourself?</p>
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
            <label className="text-xs font-medium text-jolshaa-on-surface-variant">Reason for escalation</label>
            <textarea
              value={escalateReason}
              onChange={e => setEscalateReason(e.target.value)}
              placeholder="Why is this being escalated?"
              className="w-full border border-jolshaa-outline-variant rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest text-jolshaa-on-surface resize-none"
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
            <label className="text-xs font-medium text-jolshaa-on-surface-variant">Resolution</label>
            <select
              value={resolution}
              onChange={e => setResolution(e.target.value)}
              className="w-full border border-jolshaa-outline-variant rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest text-jolshaa-on-surface"
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
              <div><span className="text-jolshaa-on-surface-variant">Status:</span> <Badge variant={statusColors[selectedReport.status]} size="xs">{selectedReport.status}</Badge></div>
              <div><span className="text-jolshaa-on-surface-variant">Priority:</span> <Badge variant={priorityColors[selectedReport.priority]} size="xs">{selectedReport.priority}</Badge></div>
              <div><span className="text-jolshaa-on-surface-variant">Type:</span> {selectedReport.targetType}</div>
              <div><span className="text-jolshaa-on-surface-variant">Reason:</span> {selectedReport.reason?.replace(/_/g, ' ')}</div>
              <div><span className="text-jolshaa-on-surface-variant">Escalation:</span> Level {selectedReport.escalationLevel}</div>
              <div><span className="text-jolshaa-on-surface-variant">Auto-flagged:</span> {selectedReport.isAutoFlagged ? 'Yes' : 'No'}</div>
              {selectedReport.assignedTo && <div><span className="text-jolshaa-on-surface-variant">Assigned:</span> {selectedReport.assignedTo.name}</div>}
              {selectedReport.reviewedBy && <div><span className="text-jolshaa-on-surface-variant">Reviewed by:</span> {selectedReport.reviewedBy.name}</div>}
              {selectedReport.resolvedBy && <div><span className="text-jolshaa-on-surface-variant">Resolved by:</span> {selectedReport.resolvedBy.name}</div>}
              {selectedReport.resolution && selectedReport.resolution !== 'none' && <div><span className="text-jolshaa-on-surface-variant">Resolution:</span> {resolutionLabels[selectedReport.resolution]}</div>}
            </div>
            <div><span className="text-jolshaa-on-surface-variant">Reported by:</span> {selectedReport.reporter?.name}</div>
            {selectedReport.description && <div><span className="text-jolshaa-on-surface-variant">Description:</span> "{selectedReport.description}"</div>}
            {selectedReport.evidenceUrls?.length > 0 && (
              <div>
                <span className="text-jolshaa-on-surface-variant">Evidence:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedReport.evidenceUrls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-jolshaa-teal hover:underline block">{url}</a>
                  ))}
                </div>
              </div>
            )}
            {selectedReport.escalationHistory?.length > 0 && (
              <div>
                <span className="text-jolshaa-on-surface-variant">Escalation History:</span>
                <div className="space-y-1 mt-1">
                  {selectedReport.escalationHistory.map((e, i) => (
                    <div key={i} className="text-xs text-jolshaa-on-surface-variant">
                      Level {e.fromLevel} → {e.toLevel} at {new Date(e.escalatedAt).toLocaleString()}
                      {e.reason && <span className="italic"> — {e.reason}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="text-2xs text-jolshaa-on-surface-variant">Created: {new Date(selectedReport.createdAt).toLocaleString()}</div>
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
        <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>
      ) : appeals.length === 0 ? (
        <div className="text-center py-12 text-jolshaa-on-surface-variant">No appeals found</div>
      ) : (
        <div className="space-y-3">
          {appeals.map(appeal => (
            <Card key={appeal._id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={appeal.status === 'pending' ? 'warning' : appeal.status === 'accepted' ? 'success' : 'neutral'} size="xs">{appeal.status}</Badge>
                    <span className="text-xs font-medium text-jolshaa-on-surface-variant">{typeLabels[appeal.type] || appeal.type}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar src={appeal.user?.profilePhoto} alt={appeal.user?.name} size="xs" />
                    <span className="text-sm font-medium text-jolshaa-on-surface">{appeal.user?.name}</span>
                  </div>
                  <p className="text-sm text-jolshaa-on-surface-variant">{appeal.reason}</p>
                  {appeal.adminNote && <p className="text-xs text-jolshaa-on-surface-variant mt-1 italic">Admin: {appeal.adminNote}</p>}
                  <p className="text-2xs text-jolshaa-on-surface-variant mt-1">{new Date(appeal.createdAt).toLocaleString()}</p>
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
                <p className="text-sm text-jolshaa-on-surface-variant">User</p>
                <p className="font-medium text-jolshaa-on-surface">{selectedAppeal.user?.name}</p>
              </div>
              <div>
                <p className="text-sm text-jolshaa-on-surface-variant">Type</p>
                <p className="font-medium text-jolshaa-on-surface">{typeLabels[selectedAppeal.type]}</p>
              </div>
              <div>
                <p className="text-sm text-jolshaa-on-surface-variant">Reason</p>
                <p className="text-sm text-jolshaa-on-surface">{selectedAppeal.reason}</p>
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
        <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-jolshaa-on-surface-variant">No pending verification requests</div>
      ) : (
        <div className="space-y-3">
          {requests.map(u => (
            <Card key={u._id}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar src={u.profilePhoto} alt={u.name} size="md" />
                  <div>
                    <p className="font-medium text-jolshaa-on-surface">{u.name}</p>
                    <p className="text-xs text-jolshaa-on-surface-variant">{u.email}</p>
                    {u.verificationReason && <p className="text-xs text-jolshaa-on-surface-variant mt-1 italic">"{u.verificationReason}"</p>}
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
        <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {admins.map(a => (
            <Card key={a._id}>
              <div className="flex items-center gap-3">
                <Avatar src={a.profilePhoto} alt={a.name} size="lg" />
                <div className="flex-1">
                  <p className="font-medium text-jolshaa-on-surface">{a.name}</p>
                  <p className="text-xs text-jolshaa-on-surface-variant">{a.email}</p>
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
        <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-jolshaa-outline-variant">
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Admin</th>
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Action</th>
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Target</th>
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Details</th>
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-jolshaa-outline-variant">
                {logs.map(log => (
                  <tr key={log._id} className="hover:bg-jolshaa-surface-container-low">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar src={log.admin?.profilePhoto} alt={log.admin?.name} size="xs" />
                        <span className="text-xs font-medium text-jolshaa-on-surface">{log.admin?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="neutral" size="xs">{actionLabels[log.action] || log.action}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-jolshaa-on-surface-variant">{log.targetName || log.targetType}</td>
                    <td className="px-4 py-3 text-xs text-jolshaa-on-surface-variant">{JSON.stringify(log.details)}</td>
                    <td className="px-4 py-3 text-xs text-jolshaa-on-surface-variant">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {logs.length === 0 && <p className="text-center py-6 text-jolshaa-on-surface-variant text-sm">No audit logs</p>}
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => fetchLogs(page - 1)}>Previous</Button>
          <span className="text-sm text-jolshaa-on-surface-variant py-1">Page {page} of {totalPages}</span>
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

  const bulkAction = async (action) => {
    try {
      await API.post('/admin/moderation/bulk', { type: 'post', ids: selectedIds, action });
      setSelectedIds([]);
      fetchPosts();
    } catch (err) { alert('Bulk action failed'); }
  };

  const filterTabs = [
    { key: '', label: 'All' },
    { key: 'flagged', label: 'Flagged' },
    { key: 'hidden', label: 'Hidden' },
    { key: 'pending', label: 'Pending Review' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-jolshaa-on-surface">Post Moderation</h1>
        <p className="text-sm text-jolshaa-on-surface-variant mt-1">Review, flag, hide, or remove posts</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-jolshaa-outline-variant">
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              filter === tab.key
                ? 'border-jolshaa-teal text-jolshaa-teal'
                : 'border-transparent text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface'
            }`}
          >
            {tab.label}
            {tab.key === 'flagged' && <span className="ml-1.5 text-2xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{posts.filter(p => p.isFlagged).length}</span>}
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="bg-jolshaa-teal/10 border border-jolshaa-teal/30 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-jolshaa-teal">{selectedIds.length} posts selected</span>
          <div className="flex gap-2">
            <Button size="xs" variant="ghost" onClick={() => bulkAction('flag')}>Bulk Flag</Button>
            <Button size="xs" variant="ghost" onClick={() => bulkAction('hide')}>Bulk Hide</Button>
            <Button size="xs" variant="danger" onClick={() => bulkAction('remove')}>Bulk Remove</Button>
            <Button size="xs" variant="ghost" onClick={() => setSelectedIds([])}>Clear</Button>
          </div>
        </div>
      )}

      {/* Posts list */}
      {loading ? (
        <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-jolshaa-on-surface-variant">No posts found</div>
      ) : (
        <div className="space-y-2">
          {/* Select all */}
          <div className="flex items-center gap-2 px-1">
            <input type="checkbox" checked={selectedIds.length === posts.length && posts.length > 0} onChange={selectAll} className="rounded" />
            <span className="text-xs text-jolshaa-on-surface-variant">Select all ({posts.length})</span>
          </div>

          {/* Post cards with inline preview */}
          {posts.map(post => (
            <Card key={post._id} className="group">
              <div className="flex gap-3">
                {/* Checkbox */}
                <div className="pt-1">
                  <input type="checkbox" checked={selectedIds.includes(post._id)} onChange={() => toggleSelect(post._id)} className="rounded" />
                </div>

                {/* Content preview */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar src={post.author?.profilePhoto} alt={post.author?.name} size="xs" />
                      <span className="text-xs font-medium text-jolshaa-on-surface">{post.author?.name}</span>
                      <span className="text-2xs text-jolshaa-on-surface-variant">{new Date(post.createdAt).toLocaleDateString()}</span>
                      <div className="flex gap-1">
                        {post.isFlagged && <Badge variant="danger" size="xs">Flagged</Badge>}
                        {post.isHidden && <Badge variant="warning" size="xs">Hidden</Badge>}
                        {post.moderationStatus === 'pending_review' && <Badge variant="primary" size="xs">Pending</Badge>}
                      </div>
                    </div>
                  </div>

                  {/* Inline content preview */}
                  <p className="text-sm text-jolshaa-on-surface mb-2">{post.text?.substring(0, 300) || 'Media post'}</p>

                  {/* Media preview */}
                  {post.media?.length > 0 && (
                    <div className="flex gap-2 mb-2">
                      {post.media.slice(0, 3).map((m, i) => (
                        <div key={i} className="w-20 h-20 rounded-lg bg-jolshaa-surface-container-low overflow-hidden">
                          {m.type === 'image' || m.endsWith?.('.jpg') || m.endsWith?.('.png') ? (
                            <img src={m.url || m} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-jolshaa-outline">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      ))}
                      {post.media.length > 3 && (
                        <div className="w-20 h-20 rounded-lg bg-jolshaa-surface-container-low flex items-center justify-center text-xs text-jolshaa-on-surface-variant">
                          +{post.media.length - 3}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions - visible on hover */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="xs" variant="ghost" onClick={() => handleAction(post._id, post.isFlagged ? 'approve' : 'flag')}>
                      {post.isFlagged ? 'Approve' : 'Flag'}
                    </Button>
                    <Button size="xs" variant="ghost" onClick={() => handleAction(post._id, 'hide')}>
                      {post.isHidden ? 'Unhide' : 'Hide'}
                    </Button>
                    <Button size="xs" variant="ghost" onClick={() => handleAction(post._id, 'shadow-hide')}>Shadow</Button>
                    <Button size="xs" variant="danger" onClick={() => handleRemove(post._id)}>Remove</Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
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

      {loading ? <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div> : comments.length === 0 ? (
        <div className="text-center py-12 text-jolshaa-on-surface-variant">No comments found</div>
      ) : (
        <div className="space-y-2">
          {comments.map(c => (
            <Card key={c._id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar src={c.author?.profilePhoto} alt={c.author?.name} size="xs" />
                    <span className="text-xs font-medium text-jolshaa-on-surface">{c.author?.name}</span>
                    {c.isFlagged && <Badge variant="danger" size="xs">Flagged</Badge>}
                    {c.isHidden && <Badge variant="warning" size="xs">Hidden</Badge>}
                  </div>
                  <p className="text-sm text-jolshaa-on-surface">{c.text}</p>
                  {c.post && <p className="text-xs text-jolshaa-on-surface-variant mt-1">On post: "{c.post.text?.substring(0, 50)}..."</p>}
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

      {loading ? <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div> : stories.length === 0 ? (
        <div className="text-center py-12 text-jolshaa-on-surface-variant">No stories found</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {stories.map(s => (
            <Card key={s._id}>
              <div className="aspect-[9/16] bg-jolshaa-surface-container-low rounded-lg mb-2 overflow-hidden">
                {s.mediaType === 'video' ? (
                  <video src={s.media} className="w-full h-full object-cover" />
                ) : (
                  <img src={s.media} alt="Story" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar src={s.author?.profilePhoto} alt={s.author?.name} size="xs" />
                  <span className="text-xs font-medium text-jolshaa-on-surface">{s.author?.name}</span>
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

      {loading ? <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div> : reels.length === 0 ? (
        <div className="text-center py-12 text-jolshaa-on-surface-variant">No reels found</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {reels.map(r => (
            <Card key={r._id}>
              <div className="aspect-[9/16] bg-jolshaa-surface-container-low rounded-lg mb-2 overflow-hidden">
                <video src={r.video} poster={r.thumbnail} className="w-full h-full object-cover" controls={false} />
              </div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Avatar src={r.author?.profilePhoto} alt={r.author?.name} size="xs" />
                  <span className="text-xs font-medium text-jolshaa-on-surface">{r.author?.name}</span>
                </div>
                <div className="flex gap-1">
                  {r.isFlagged && <Badge variant="danger" size="xs">Flagged</Badge>}
                  {r.isHidden && <Badge variant="warning" size="xs">Hidden</Badge>}
                </div>
              </div>
              <p className="text-xs text-jolshaa-on-surface-variant truncate">{r.caption || 'No caption'}</p>
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

      {loading ? <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div> : listings.length === 0 ? (
        <div className="text-center py-12 text-jolshaa-on-surface-variant">No listings found</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {listings.map(l => (
            <Card key={l._id}>
              {l.images?.[0] && (
                <div className="aspect-video bg-jolshaa-surface-container-low rounded-lg mb-2 overflow-hidden">
                  <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-jolshaa-on-surface">{l.title}</span>
                <div className="flex gap-1">
                  {l.isFlagged && <Badge variant="danger" size="xs">Flagged</Badge>}
                  {l.isHidden && <Badge variant="warning" size="xs">Hidden</Badge>}
                </div>
              </div>
              <p className="text-xs text-jolshaa-on-surface-variant">${l.price} - {l.category}</p>
              <div className="flex items-center gap-2 mt-1">
                <Avatar src={l.seller?.profilePhoto} alt={l.seller?.name} size="xs" />
                <span className="text-xs text-jolshaa-on-surface-variant">{l.seller?.name}</span>
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

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;
  if (!data) return null;

  const statCards = [
    { label: 'Total Reports', value: data.totalReports, color: 'text-jolshaa-on-surface', bg: 'bg-jolshaa-surface-container-low' },
    { label: 'Pending', value: data.pendingReports, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Escalated', value: data.escalatedReports, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Resolved Today', value: data.resolvedToday, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Resolved This Week', value: data.resolvedThisWeek, color: 'text-jolshaa-teal', bg: 'bg-jolshaa-teal/10' },
    { label: 'Resolved This Month', value: data.resolvedThisMonth, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Avg Resolution', value: `${data.averageResolutionHours}h`, color: 'text-jolshaa-on-surface', bg: 'bg-jolshaa-surface-container-low' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {statCards.map(card => (
          <Card key={card.label} className={card.bg}>
            <p className="text-xs font-medium text-jolshaa-on-surface-variant">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Reports by Reason</h3>
          <div className="space-y-2">
            {data.reportsByReason?.map(r => (
              <div key={r._id} className="flex items-center justify-between text-xs">
                <span className="text-jolshaa-on-surface-variant capitalize">{r._id?.replace(/_/g, ' ')}</span>
                <Badge variant="neutral" size="xs">{r.count}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Reports by Priority</h3>
          <div className="space-y-2">
            {data.reportsByPriority?.map(r => {
              const colors = { low: 'success', medium: 'warning', high: 'danger', critical: 'danger' };
              return (
                <div key={r._id} className="flex items-center justify-between text-xs">
                  <span className="text-jolshaa-on-surface-variant capitalize">{r._id}</span>
                  <Badge variant={colors[r._id] || 'neutral'} size="xs">{r.count}</Badge>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {data.topReportedUsers?.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Most Reported Users</h3>
          <div className="space-y-2">
            {data.topReportedUsers.map(u => (
              <div key={u._id} className="flex items-center gap-3 text-xs">
                <Avatar src={u.profilePhoto} alt={u.name} size="xs" />
                <span className="font-medium text-jolshaa-on-surface">{u.name}</span>
                <span className="text-jolshaa-on-surface-variant">{u.reportsReceived} reports</span>
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
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Recent Reports</h3>
          <div className="space-y-2">
            {data.recentReports.map(r => (
              <div key={r._id} className="flex items-center gap-3 text-xs">
                <Avatar src={r.reporter?.profilePhoto} alt={r.reporter?.name} size="xs" />
                <span className="text-jolshaa-on-surface-variant">
                  <span className="font-medium text-jolshaa-on-surface">{r.reporter?.name}</span> reported{' '}
                  <Badge variant="neutral" size="xs">{r.targetType}</Badge>
                  <span className="ml-1 text-jolshaa-on-surface-variant">{r.reason?.replace(/_/g, ' ')}</span>
                </span>
                {r.assignedTo && <span className="text-jolshaa-on-surface-variant ml-auto">Assigned to {r.assignedTo.name}</span>}
                <span className="text-jolshaa-on-surface-variant ml-auto">{new Date(r.createdAt).toLocaleDateString()}</span>
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

      {loading ? <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div> : flags.length === 0 ? (
        <div className="text-center py-12 text-jolshaa-on-surface-variant">No spam flags found</div>
      ) : (
        <div className="space-y-2">
          {flags.map(f => (
            <Card key={f._id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar src={f.user?.profilePhoto} alt={f.user?.name} size="xs" />
                    <span className="text-xs font-medium text-jolshaa-on-surface">{f.user?.name}</span>
                    <Badge variant={f.status === 'confirmed' ? 'danger' : f.status === 'dismissed' ? 'success' : 'warning'} size="xs">{f.status}</Badge>
                    <Badge variant="neutral" size="xs">{f.contentType}</Badge>
                    <span className="text-xs text-jolshaa-on-surface-variant">Confidence: {f.confidence}%</span>
                  </div>
                  <p className="text-sm text-jolshaa-on-surface-variant">{f.contentText?.substring(0, 150)}</p>
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

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Banned / Suspended Users</h3>
          <div className="space-y-2">
            {data.users.length === 0 ? (
              <p className="text-xs text-jolshaa-on-surface-variant">No banned or suspended users</p>
            ) : data.users.map(u => (
              <div key={u._id} className="flex items-center gap-3 text-xs">
                <Avatar src={u.profilePhoto} alt={u.name} size="xs" />
                <div className="flex-1">
                  <span className="font-medium text-jolshaa-on-surface">{u.name}</span>
                  <div className="flex gap-1 mt-0.5">
                    {u.isBanned && <Badge variant="danger" size="xs">Banned</Badge>}
                    {u.isSuspended && <Badge variant="warning" size="xs">Suspended</Badge>}
                    {u.isRepeatOffender && <Badge variant="danger" size="xs">Repeat Offender</Badge>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-jolshaa-on-surface-variant">{u.reportsReceived} reports</p>
                  <p className="text-jolshaa-on-surface-variant">Score: {u.safetyScore}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Most Blocked Users (by others)</h3>
          <div className="space-y-2">
            {data.blockedByUser?.length === 0 ? (
              <p className="text-xs text-jolshaa-on-surface-variant">No data</p>
            ) : data.blockedByUser?.map(u => (
              <div key={u._id} className="flex items-center justify-between text-xs">
                <span className="text-jolshaa-on-surface-variant">{u.name}</span>
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
      {loading ? <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div> : users.length === 0 ? (
        <div className="text-center py-12 text-jolshaa-on-surface-variant">No repeat offenders found</div>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-jolshaa-outline-variant">
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">User</th>
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Reports</th>
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Score</th>
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Warnings</th>
                  <th className="text-right px-4 py-3 font-medium text-jolshaa-on-surface-variant">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-jolshaa-outline-variant">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-jolshaa-surface-container-low">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={u.profilePhoto} alt={u.name} size="sm" />
                        <div>
                          <p className="font-medium text-jolshaa-on-surface">{u.name}</p>
                          <p className="text-xs text-jolshaa-on-surface-variant">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-jolshaa-on-surface">{u.reportsReceived}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-jolshaa-surface-container-high rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${u.safetyScore >= 70 ? 'bg-green-500' : u.safetyScore >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${u.safetyScore}%` }} />
                        </div>
                        <span className="text-xs text-jolshaa-on-surface-variant">{u.safetyScore}</span>
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
              <div><span className="text-jolshaa-on-surface-variant">Safety Score:</span> <span className="font-medium text-jolshaa-on-surface">{selectedUser.safetyScore}</span></div>
              <div><span className="text-jolshaa-on-surface-variant">Reports Received:</span> <span className="font-medium text-jolshaa-on-surface">{selectedUser.reportsReceived}</span></div>
              <div><span className="text-jolshaa-on-surface-variant">Joined:</span> <span className="font-medium text-jolshaa-on-surface">{new Date(selectedUser.createdAt).toLocaleDateString()}</span></div>
              <div><span className="text-jolshaa-on-surface-variant">Warnings:</span> <span className="font-medium text-jolshaa-on-surface">{selectedUser.warnings?.length || 0}</span></div>
            </div>

            {caseData.reportsAgainst?.length > 0 && (
              <div>
                <h4 className="font-display text-xs font-semibold text-jolshaa-on-surface mb-2">Reports Against This User</h4>
                <div className="space-y-1">
                  {caseData.reportsAgainst.map(r => (
                    <div key={r._id} className="text-xs flex items-center gap-2">
                      <Badge variant={r.status === 'resolved' ? 'success' : r.status === 'escalated' ? 'danger' : 'warning'} size="xs">{r.status}</Badge>
                      <span className="text-jolshaa-on-surface-variant">{r.reason?.replace(/_/g, ' ')}</span>
                      <span className="text-jolshaa-on-surface-variant ml-auto">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {caseData.notes?.length > 0 && (
              <div>
                <h4 className="font-display text-xs font-semibold text-jolshaa-on-surface mb-2">Moderator Notes</h4>
                <div className="space-y-1">
                  {caseData.notes.map(n => (
                    <div key={n._id} className="text-xs p-2 bg-jolshaa-surface-container-low rounded">
                      <p className="text-jolshaa-on-surface">{n.note}</p>
                      <p className="text-jolshaa-on-surface-variant mt-0.5">By {n.author?.name} - {new Date(n.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="font-display text-xs font-semibold text-jolshaa-on-surface mb-2">Add Note</h4>
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
        className="w-full border border-jolshaa-outline-variant rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest text-jolshaa-on-surface resize-none"
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
const BarChart = ({ data, maxVal, color = 'bg-jolshaa-teal', height = 100, labelFn }) => {
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
            <span className="text-2xs text-jolshaa-on-surface-variant truncate w-full text-center" title={d.label}>{d.label}</span>
          )}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-jolshaa-on-surface text-white text-2xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
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
  const [timeRange, setTimeRange] = useState('30');

  const loadAll = async (days) => {
    setLoading(true);
    try {
      const [ov, ug, au, ret, eng, ct, ms, mp, rev] = await Promise.all([
        API.get('/admin/analytics/overview'),
        API.get(`/admin/analytics/user-growth?days=${days}`),
        API.get(`/admin/analytics/active-users?days=${days}`),
        API.get('/admin/analytics/retention'),
        API.get(`/admin/analytics/engagement?days=${days}`),
        API.get(`/admin/analytics/content-trends?days=${days}`),
        API.get(`/admin/analytics/moderation-stats?days=${days}`),
        API.get(`/admin/analytics/moderator-performance?days=${days}`),
        API.get(`/admin/analytics/revenue?days=${days}`),
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

  useEffect(() => { loadAll(parseInt(timeRange)); }, [timeRange]);

  const TrendBadge = ({ value, suffix = '' }) => {
    if (value === undefined || value === null) return null;
    const isPositive = value > 0;
    return (
      <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${isPositive ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-jolshaa-on-surface-variant'}`}>
        {isPositive ? '↑' : value < 0 ? '↓' : '→'} {Math.abs(value)}{suffix}
      </span>
    );
  };

  const timeRanges = [
    { key: '7', label: '7D' },
    { key: '30', label: '30D' },
    { key: '90', label: '90D' },
    { key: '365', label: '1Y' },
  ];

  if (loading) return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-jolshaa-surface-container-low rounded animate-pulse" />
        <div className="h-8 w-32 bg-jolshaa-surface-container-low rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="h-20 bg-jolshaa-surface-container-low rounded-lg animate-pulse" />)}
      </div>
      <div className="h-64 bg-jolshaa-surface-container-low rounded-lg animate-pulse" />
    </div>
  );

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
      {/* Header with time range */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-jolshaa-on-surface font-display">Analytics</h2>
          <p className="text-xs text-jolshaa-on-surface-variant">Platform metrics and trends</p>
        </div>
        <div className="flex items-center gap-1 bg-jolshaa-surface-container-low rounded-lg p-0.5">
          {timeRanges.map(r => (
            <button key={r.key} onClick={() => setTimeRange(r.key)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${timeRange === r.key ? 'bg-jolshaa-surface-container-lowest text-jolshaa-on-surface shadow-sm' : 'text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface'}`}>{r.label}</button>
          ))}
        </div>
      </div>

      <Tabs tabs={subTabs} activeTab={subTab} onChange={setSubTab} className="mb-4" />

      {/* ---- OVERVIEW ---- */}
      {subTab === 'overview' && overview && (
        <div className="space-y-4">
          {/* Primary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Users', value: overview.totalUsers, color: 'text-jolshaa-on-surface', trend: overview.usersTrend },
              { label: 'DAU', value: overview.dau, color: 'text-blue-600', trend: overview.dauTrend },
              { label: 'New Today', value: overview.newUsersToday, color: 'text-green-600', trend: overview.newUsersTrend },
              { label: 'New This Week', value: overview.newUsersWeek, color: 'text-jolshaa-teal' },
            ].map(card => (
              <Card key={card.label}>
                <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color} mt-1`}>{card.value}</p>
                {card.trend !== undefined && <TrendBadge value={card.trend} suffix="%" />}
              </Card>
            ))}
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Posts Today', value: overview.postsToday, color: 'text-blue-600' },
              { label: 'Pending Reports', value: overview.pendingReports, color: 'text-amber-600', urgent: overview.pendingReports > 0 },
              { label: 'Escalated', value: overview.escalatedReports, color: 'text-red-600', urgent: overview.escalatedReports > 0 },
              { label: 'Ad Revenue', value: `$${overview.adRevenue?.toLocaleString()}`, color: 'text-emerald-600' },
            ].map(card => (
              <Card key={card.label} className={card.urgent ? 'border-amber-200' : ''}>
                <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color} mt-1`}>{card.value}</p>
              </Card>
            ))}
          </div>

          {/* DAU Trend Chart */}
          {activeUsers?.dauTrend && (
            <Card>
              <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">DAU Trend ({timeRange} days)</h3>
              <BarChart
                data={activeUsers.dauTrend.map(d => ({ label: d.date.slice(5), value: d.count }))}
                color="bg-blue-500"
                height={100}
              />
            </Card>
          )}

          {/* Moderator Performance Quick View */}
          {modPerf?.actionsByAdmin?.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">Moderator Activity</h3>
                <button onClick={() => setSubTab('moderators')} className="text-xs text-jolshaa-teal hover:underline">View all</button>
              </div>
              <div className="space-y-2">
                {modPerf.actionsByAdmin.slice(0, 3).map(a => (
                  <div key={a._id?._id} className="flex items-center gap-3 text-xs">
                    <Avatar src={a._id?.profilePhoto} alt={a._id?.name} size="xs" />
                    <span className="flex-1 font-medium text-jolshaa-on-surface">{a._id?.name}</span>
                    <div className="flex gap-2 text-jolshaa-on-surface-variant">
                      <span className="text-blue-600">{a.reportActions} reports</span>
                      <span className="text-amber-600">{a.userActions} users</span>
                      <span className="text-purple-600">{a.moderationActions} content</span>
                    </div>
                    <span className="font-medium text-jolshaa-on-surface-variant">{a.totalActions}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ---- USERS ---- */}
      {subTab === 'users' && userGrowth && activeUsers && retention && (
        <div className="space-y-4">
          {/* Active User Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">DAU</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{activeUsers.dau}</p>
              <TrendBadge value={activeUsers.dauTrend} suffix="%" />
            </Card>
            <Card>
              <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">WAU</p>
              <p className="text-2xl font-bold text-jolshaa-teal mt-1">{activeUsers.wau}</p>
            </Card>
            <Card>
              <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">MAU</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{activeUsers.mau}</p>
            </Card>
            <Card>
              <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Stickiness</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{activeUsers.stickiness}%</p>
              <p className="text-[10px] text-jolshaa-on-surface-variant mt-0.5">DAU/MAU ratio</p>
            </Card>
          </div>

          {/* Signups Chart */}
          {userGrowth.signups?.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">New Signups ({timeRange} days)</h3>
                <div className="flex gap-3 text-[10px]">
                  <span className="text-jolshaa-on-surface-variant">Total: <span className="font-medium text-jolshaa-on-surface-variant">{userGrowth.totalUsers}</span></span>
                  <span className="text-blue-500">Male: <span className="font-medium">{userGrowth.maleCount}</span></span>
                  <span className="text-pink-500">Female: <span className="font-medium">{userGrowth.femaleCount}</span></span>
                  <span className="text-green-500">Verified: <span className="font-medium">{userGrowth.verifiedCount}</span></span>
                </div>
              </div>
              <BarChart
                data={userGrowth.signups.map(d => ({ label: d._id.slice(5), value: d.count }))}
                color="bg-green-500"
                height={100}
              />
            </Card>
          )}

          {/* DAU Trend */}
          {activeUsers.dauTrend && (
            <Card>
              <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">DAU Trend ({timeRange} days)</h3>
              <BarChart
                data={activeUsers.dauTrend.map(d => ({ label: d.date.slice(5), value: d.count }))}
                color="bg-blue-500"
                height={80}
              />
            </Card>
          )}

          {/* Retention Cohorts */}
          {retention?.cohorts && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">Retention Cohorts</h3>
                <span className="text-xs text-jolshaa-on-surface-variant">Overall: <span className="font-medium text-jolshaa-on-surface-variant">{retention.overallRetention}%</span></span>
              </div>
              <div className="space-y-2">
                {retention.cohorts.map(c => (
                  <div key={c.month} className="flex items-center gap-3 text-xs">
                    <span className="w-20 font-medium text-jolshaa-on-surface-variant">{c.month}</span>
                    <div className="flex-1 h-5 bg-jolshaa-surface-container-low rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${c.retentionRate > 50 ? 'bg-green-500' : c.retentionRate > 30 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${c.retentionRate}%` }} />
                    </div>
                    <span className="w-16 text-right font-medium text-jolshaa-on-surface-variant">{c.retentionRate}%</span>
                    <span className="w-16 text-right text-jolshaa-on-surface-variant">{c.retained}/{c.size}</span>
                  </div>
                ))}
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
              { label: 'Posts', value: engagement.totalPosts, sub: engagement.postsInPeriod, color: 'blue' },
              { label: 'Comments', value: engagement.totalComments, sub: engagement.commentsInPeriod, color: 'green' },
              { label: 'Reactions', value: engagement.totalReactions, sub: engagement.reactionsInPeriod, color: 'red' },
              { label: 'Stories', value: engagement.totalStories, sub: engagement.storiesInPeriod, color: 'purple' },
              { label: 'Reels', value: engagement.totalReels, sub: engagement.reelsInPeriod, color: 'amber' },
            ].map(card => (
              <Card key={card.label}>
                <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">{card.label}</p>
                <p className="text-2xl font-bold text-jolshaa-on-surface mt-1">{card.value}</p>
                <p className="text-[10px] text-green-600 mt-0.5">+{card.sub} this period</p>
              </Card>
            ))}
          </div>

          {engagement.reactionBreakdown?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Reaction Types</h3>
              <div className="space-y-1.5">
                {engagement.reactionBreakdown.map(r => {
                  const max = engagement.reactionBreakdown[0]?.count || 1;
                  const colors = { like: 'bg-blue-500', love: 'bg-red-500', haha: 'bg-yellow-500', wow: 'bg-amber-500', sad: 'bg-indigo-500', angry: 'bg-orange-500' };
                  return (
                    <div key={r._id} className="flex items-center gap-2 text-xs">
                      <span className="w-12 capitalize">{r._id}</span>
                      <div className="flex-1 h-4 bg-jolshaa-surface-container-low rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${colors[r._id] || 'bg-jolshaa-outline'}`} style={{ width: `${(r.count / max) * 100}%` }} />
                      </div>
                      <span className="w-12 text-right text-jolshaa-on-surface-variant">{r.count}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {engagement.topPosts?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Top Posts by Engagement</h3>
              <div className="space-y-2">
                {engagement.topPosts.map((p, i) => (
                  <div key={p._id} className="flex items-center gap-3 text-xs">
                    <span className="text-jolshaa-on-surface-variant w-4">{i + 1}.</span>
                    <Avatar src={p.author?.profilePhoto} alt={p.author?.name} size="xs" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-jolshaa-on-surface-variant">{p.text?.substring(0, 60) || 'Media post'}</p>
                    </div>
                    <div className="flex gap-2 text-jolshaa-on-surface-variant flex-shrink-0">
                      <span>R: {p.analytics?.reach || 0}</span>
                      <span>E: {p.analytics?.engagement || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Average Per Post</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div><span className="text-jolshaa-on-surface-variant">Reach:</span> <span className="font-medium">{engagement.avgEngagement?.avgReach?.toFixed(0) || 0}</span></div>
              <div><span className="text-jolshaa-on-surface-variant">Impressions:</span> <span className="font-medium">{engagement.avgEngagement?.avgImpressions?.toFixed(0) || 0}</span></div>
              <div><span className="text-jolshaa-on-surface-variant">Engagement:</span> <span className="font-medium">{engagement.avgEngagement?.avgEngagement?.toFixed(0) || 0}</span></div>
              <div><span className="text-jolshaa-on-surface-variant">Clicks:</span> <span className="font-medium">{engagement.avgEngagement?.avgClicks?.toFixed(0) || 0}</span></div>
              <div><span className="text-jolshaa-on-surface-variant">Shares:</span> <span className="font-medium">{engagement.avgEngagement?.avgShares?.toFixed(0) || 0}</span></div>
            </div>
          </Card>
        </div>
      )}

      {/* ---- CONTENT ---- */}
      {subTab === 'content' && contentTrends && (
        <div className="space-y-4">
          {contentTrends.postsByType?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Posts by Type</h3>
              <div className="space-y-1.5">
                {contentTrends.postsByType.map(r => {
                  const max = Math.max(...contentTrends.postsByType.map(x => x.count), 1);
                  const colors = { profile: 'bg-blue-500', group: 'bg-purple-500', page: 'bg-green-500' };
                  return (
                    <div key={r._id} className="flex items-center gap-2 text-xs">
                      <span className="w-16 capitalize">{r._id || 'unknown'}</span>
                      <div className="flex-1 h-4 bg-jolshaa-surface-container-low rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${colors[r._id] || 'bg-jolshaa-outline'}`} style={{ width: `${(r.count / max) * 100}%` }} />
                      </div>
                      <span className="w-12 text-right text-jolshaa-on-surface-variant">{r.count}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {contentTrends.postsByVisibility?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Posts by Visibility</h3>
              <div className="space-y-1.5">
                {contentTrends.postsByVisibility.map(r => {
                  const max = Math.max(...contentTrends.postsByVisibility.map(x => x.count), 1);
                  const colors = { public: 'bg-green-500', friends: 'bg-blue-500', onlyme: 'bg-jolshaa-outline' };
                  return (
                    <div key={r._id} className="flex items-center gap-2 text-xs">
                      <span className="w-16 capitalize">{r._id}</span>
                      <div className="flex-1 h-4 bg-jolshaa-surface-container-low rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${colors[r._id] || 'bg-jolshaa-outline'}`} style={{ width: `${(r.count / max) * 100}%` }} />
                      </div>
                      <span className="w-12 text-right text-jolshaa-on-surface-variant">{r.count}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {contentTrends.postsPerDay?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Content Per Day (30 days)</h3>
              <BarChart
                data={contentTrends.postsPerDay.map(d => ({ label: d._id.slice(5), value: d.count }))}
                color="bg-blue-500"
                height={80}
              />
            </Card>
          )}

          {contentTrends.topHashtags?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Top Hashtags</h3>
              <div className="space-y-1.5">
                {contentTrends.topHashtags.slice(0, 15).map((h, i) => {
                  const max = contentTrends.topHashtags[0]?.count || 1;
                  return (
                    <div key={h._id} className="flex items-center gap-2 text-xs">
                      <span className="text-jolshaa-on-surface-variant w-4">{i + 1}.</span>
                      <span className="font-medium text-jolshaa-teal">#{h._id}</span>
                      <div className="flex-1 h-3 bg-jolshaa-surface-container-low rounded-full overflow-hidden">
                        <div className="h-full bg-jolshaa-teal rounded-full" style={{ width: `${(h.count / max) * 100}%` }} />
                      </div>
                      <span className="w-8 text-right text-jolshaa-on-surface-variant">{h.count}</span>
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
              <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Avg Resolution</p>
              <p className="text-2xl font-bold text-jolshaa-on-surface mt-1">{modStats.avgResolutionHours}h</p>
            </Card>
            <Card className={modStats.escalated > 0 ? 'border-red-200' : ''}>
              <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Escalated</p>
              <p className={`text-2xl font-bold mt-1 ${modStats.escalated > 0 ? 'text-red-600' : 'text-green-600'}`}>{modStats.escalated}</p>
            </Card>
            <Card className={modStats.flaggedPosts > 0 ? 'border-amber-200' : ''}>
              <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Flagged Posts</p>
              <p className={`text-2xl font-bold mt-1 ${modStats.flaggedPosts > 0 ? 'text-amber-600' : 'text-green-600'}`}>{modStats.flaggedPosts}</p>
            </Card>
            <Card>
              <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Flagged Comments</p>
              <p className={`text-2xl font-bold mt-1 ${modStats.flaggedComments > 0 ? 'text-amber-600' : 'text-green-600'}`}>{modStats.flaggedComments}</p>
            </Card>
          </div>

          {modStats.reportsPerDay?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Report Volume (30 days)</h3>
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
                <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Reports by Reason</h3>
                <div className="space-y-1.5">
                  {modStats.reportsByReason.map(r => {
                    const max = modStats.reportsByReason[0]?.count || 1;
                    return (
                      <div key={r._id} className="flex items-center gap-2 text-xs">
                        <span className="w-24 capitalize truncate">{r._id?.replace(/_/g, ' ')}</span>
                        <div className="flex-1 h-3 bg-jolshaa-surface-container-low rounded-full overflow-hidden">
                          <div className="h-full bg-red-400 rounded-full" style={{ width: `${(r.count / max) * 100}%` }} />
                        </div>
                        <span className="w-8 text-right text-jolshaa-on-surface-variant">{r.count}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {modStats.reportsByStatus?.length > 0 && (
              <Card>
                <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Reports by Status</h3>
                <div className="space-y-1.5">
                  {modStats.reportsByStatus.map(r => {
                    const colors = { pending: 'bg-amber-400', reviewed: 'bg-blue-400', resolved: 'bg-green-400', dismissed: 'bg-jolshaa-outline', escalated: 'bg-red-400' };
                    const max = Math.max(...modStats.reportsByStatus.map(x => x.count), 1);
                    return (
                      <div key={r._id} className="flex items-center gap-2 text-xs">
                        <span className="w-16 capitalize">{r._id}</span>
                        <div className="flex-1 h-3 bg-jolshaa-surface-container-low rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${colors[r._id] || 'bg-jolshaa-outline'}`} style={{ width: `${(r.count / max) * 100}%` }} />
                        </div>
                        <span className="w-8 text-right text-jolshaa-on-surface-variant">{r.count}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>

          {modStats.resolutionBreakdown?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Resolution Breakdown</h3>
              <div className="space-y-1.5">
                {modStats.resolutionBreakdown.map(r => {
                  const max = modStats.resolutionBreakdown[0]?.count || 1;
                  return (
                    <div key={r._id} className="flex items-center gap-2 text-xs">
                      <span className="w-32 capitalize">{r._id?.replace(/_/g, ' ')}</span>
                      <div className="flex-1 h-3 bg-jolshaa-surface-container-low rounded-full overflow-hidden">
                        <div className="h-full bg-green-400 rounded-full" style={{ width: `${(r.count / max) * 100}%` }} />
                      </div>
                      <span className="w-8 text-right text-jolshaa-on-surface-variant">{r.count}</span>
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
          {/* Actions Per Day Chart */}
          {modPerf.actionsPerDay?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Admin Actions Per Day ({timeRange} days)</h3>
              <BarChart
                data={modPerf.actionsPerDay.map(d => ({ label: d._id.slice(5), value: d.count }))}
                color="bg-jolshaa-teal"
                height={100}
              />
            </Card>
          )}

          {/* Moderator Leaderboard */}
          {modPerf.actionsByAdmin?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Moderator Leaderboard</h3>
              <div className="space-y-2">
                {modPerf.actionsByAdmin.map((a, i) => (
                  <div key={a._id?._id} className="flex items-center gap-3 py-2 border-b border-jolshaa-outline-variant last:border-0">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-jolshaa-surface-container-high text-jolshaa-on-surface-variant' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-jolshaa-surface-container-low text-jolshaa-on-surface-variant'}`}>{i + 1}</span>
                    <Avatar src={a._id?.profilePhoto} alt={a._id?.name} size="xs" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-jolshaa-on-surface">{a._id?.name}</p>
                      <p className="text-[10px] text-jolshaa-on-surface-variant capitalize">{a._id?.role}</p>
                    </div>
                    <div className="flex gap-3 text-[10px]">
                      <div className="text-center"><p className="font-bold text-blue-600">{a.reportActions}</p><p className="text-jolshaa-on-surface-variant">reports</p></div>
                      <div className="text-center"><p className="font-bold text-amber-600">{a.userActions}</p><p className="text-jolshaa-on-surface-variant">users</p></div>
                      <div className="text-center"><p className="font-bold text-purple-600">{a.moderationActions}</p><p className="text-jolshaa-on-surface-variant">content</p></div>
                    </div>
                    <span className="text-sm font-bold text-jolshaa-on-surface w-12 text-right">{a.totalActions}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Reports Resolved + Action Types */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modPerf.reportsResolved?.length > 0 && (
              <Card>
                <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Reports Resolved</h3>
                <div className="space-y-2">
                  {modPerf.reportsResolved.map(r => (
                    <div key={r._id?._id} className="flex items-center gap-3 text-xs">
                      <Avatar src={r._id?.profilePhoto} alt={r._id?.name} size="xs" />
                      <span className="flex-1 text-jolshaa-on-surface-variant">{r._id?.name}</span>
                      <Badge variant="success" size="xs">{r.count} resolved</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {modPerf.actionTypes?.length > 0 && (
              <Card>
                <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Action Types</h3>
                <div className="space-y-1.5">
                  {modPerf.actionTypes.map(a => {
                    const max = modPerf.actionTypes[0]?.count || 1;
                    return (
                      <div key={a._id} className="flex items-center gap-2 text-xs">
                        <span className="w-32 truncate font-mono text-jolshaa-on-surface-variant">{a._id}</span>
                        <div className="flex-1 h-3 bg-jolshaa-surface-container-low rounded-full overflow-hidden">
                          <div className="h-full bg-jolshaa-teal rounded-full" style={{ width: `${(a.count / max) * 100}%` }} />
                        </div>
                        <span className="w-8 text-right font-medium text-jolshaa-on-surface-variant">{a.count}</span>
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
          {/* Revenue Hero */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-emerald-50 border-emerald-200">
              <p className="text-[10px] font-medium text-emerald-700 uppercase tracking-wider">Total Ad Revenue</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">${revenue.totalAdSpent?.toLocaleString()}</p>
            </Card>
            <Card>
              <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Active Ads</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{revenue.activeAds}</p>
            </Card>
            <Card>
              <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">CTR</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{revenue.ctr}%</p>
            </Card>
            <Card>
              <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Creators</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{revenue.creatorCount}</p>
            </Card>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Ad Budget</p>
              <p className="text-lg font-bold text-jolshaa-on-surface mt-1">${revenue.totalAdBudget?.toLocaleString()}</p>
            </Card>
            <Card>
              <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Impressions</p>
              <p className="text-lg font-bold text-jolshaa-on-surface mt-1">{revenue.totalImpressions?.toLocaleString()}</p>
            </Card>
            <Card>
              <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Clicks</p>
              <p className="text-lg font-bold text-jolshaa-on-surface mt-1">{revenue.totalClicks?.toLocaleString()}</p>
            </Card>
            <Card>
              <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Subscribers</p>
              <p className="text-lg font-bold text-jolshaa-on-surface mt-1">{revenue.totalSubscribers}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {revenue.adSpendPerDay?.length > 0 && (
              <Card>
                <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Ad Spend Per Day</h3>
                <BarChart
                  data={revenue.adSpendPerDay.map(d => ({ label: d._id.slice(5), value: d.spent }))}
                  color="bg-emerald-500"
                  height={80}
                />
              </Card>
            )}

            {revenue.creatorCategories?.length > 0 && (
              <Card>
                <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Creator Categories</h3>
                <div className="space-y-1.5">
                  {revenue.creatorCategories.map(c => {
                    const max = revenue.creatorCategories[0]?.count || 1;
                    return (
                      <div key={c._id} className="flex items-center gap-2 text-xs">
                        <span className="w-24 capitalize truncate">{c._id || 'uncategorized'}</span>
                        <div className="flex-1 h-3 bg-jolshaa-surface-container-low rounded-full overflow-hidden">
                          <div className="h-full bg-purple-400 rounded-full" style={{ width: `${(c.count / max) * 100}%` }} />
                        </div>
                        <span className="w-8 text-right text-jolshaa-on-surface-variant">{c.count}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Boosted Posts</p>
              <p className="text-lg font-bold text-jolshaa-on-surface mt-1">{revenue.boostedPosts}</p>
            </Card>
            <Card>
              <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Sponsored Posts</p>
              <p className="text-lg font-bold text-jolshaa-on-surface mt-1">{revenue.sponsoredPosts}</p>
            </Card>
            <Card>
              <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Total Ads</p>
              <p className="text-lg font-bold text-jolshaa-on-surface mt-1">{revenue.totalAds}</p>
            </Card>
            <Card>
              <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Listings</p>
              <p className="text-lg font-bold text-jolshaa-on-surface mt-1">{revenue.totalListings}</p>
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
  const [subTab, setSubTab] = useState('overview');
  const [overview, setOverview] = useState(null);

  const fetchOverview = async () => {
    try {
      const [healthRes, errorsRes, jobsRes, settingsRes] = await Promise.allSettled([
        API.get('/admin/system/health'),
        API.get('/admin/system/errors?limit=1'),
        API.get('/admin/system/jobs'),
        API.get('/admin/system/settings'),
      ]);
      setOverview({
        health: healthRes.status === 'fulfilled' ? healthRes.value.data : null,
        errors: errorsRes.status === 'fulfilled' ? errorsRes.value.data : null,
        jobs: jobsRes.status === 'fulfilled' ? jobsRes.value.data : null,
        settings: settingsRes.status === 'fulfilled' ? settingsRes.value.data : null,
      });
    } catch {}
  };

  useEffect(() => { fetchOverview(); }, []);

  const subTabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'settings', label: 'Settings' },
    { key: 'features', label: 'Features' },
    { key: 'health', label: 'API Health' },
    { key: 'jobs', label: 'Jobs' },
    { key: 'scheduler', label: 'Scheduler' },
    { key: 'errors', label: 'Error Logs' },
    { key: 'maintenance', label: 'Maintenance' },
    { key: 'announcement', label: 'Announcement' },
    { key: 'cache', label: 'Cache' },
    { key: 'database', label: 'Database' },
  ];

  const healthColor = overview?.health?.status === 'healthy' ? 'text-green-600 bg-green-50 border-green-200'
    : overview?.health?.status === 'degraded' ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-red-600 bg-red-50 border-red-200';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold font-display text-jolshaa-on-surface">System Control</h2>
          <p className="text-xs text-jolshaa-on-surface-variant">Platform health, settings, and infrastructure</p>
        </div>
        <Button size="sm" variant="ghost" onClick={fetchOverview}>Refresh All</Button>
      </div>

      {/* Quick Status Bar */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button onClick={() => setSubTab('health')} className={`text-left p-3 rounded-lg border transition-all hover:shadow-ambient ${healthColor}`}>
            <p className="text-[10px] font-medium uppercase tracking-wider opacity-70">System Status</p>
            <p className="text-lg font-bold capitalize">{overview.health?.status || 'Unknown'}</p>
          </button>
          <button onClick={() => setSubTab('errors')} className={`text-left p-3 rounded-lg border transition-all hover:shadow-ambient ${overview.errors?.stats?.lastHour > 0 ? 'text-red-600 bg-red-50 border-red-200' : 'text-green-600 bg-green-50 border-green-200'}`}>
            <p className="text-[10px] font-medium uppercase tracking-wider opacity-70">Errors (1h)</p>
            <p className="text-lg font-bold">{overview.errors?.stats?.lastHour || 0}</p>
          </button>
          <button onClick={() => setSubTab('jobs')} className={`text-left p-3 rounded-lg border transition-all hover:shadow-ambient ${!overview.jobs?.isRunning ? 'text-red-600 bg-red-50 border-red-200' : 'text-green-600 bg-green-50 border-green-200'}`}>
            <p className="text-[10px] font-medium uppercase tracking-wider opacity-70">Background Jobs</p>
            <p className="text-lg font-bold">{overview.jobs?.isRunning ? 'Running' : 'Paused'}</p>
          </button>
          <button onClick={() => setSubTab('maintenance')} className={`text-left p-3 rounded-lg border transition-all hover:shadow-ambient ${overview.settings?.maintenance_mode?.value ? 'text-red-600 bg-red-50 border-red-200' : 'text-green-600 bg-green-50 border-green-200'}`}>
            <p className="text-[10px] font-medium uppercase tracking-wider opacity-70">Maintenance</p>
            <p className="text-lg font-bold">{overview.settings?.maintenance_mode?.value ? 'Active' : 'Off'}</p>
          </button>
        </div>
      )}

      <Tabs tabs={subTabs} activeTab={subTab} onChange={setSubTab} className="mb-4" />

      {subTab === 'overview' && <SystemOverviewPanel />}
      {subTab === 'settings' && <SettingsPanel />}
      {subTab === 'features' && <FeaturesPanel />}
      {subTab === 'health' && <HealthPanel />}
      {subTab === 'jobs' && <JobsPanel />}
      {subTab === 'scheduler' && <SchedulerPanel />}
      {subTab === 'errors' && <ErrorsPanel />}
      {subTab === 'maintenance' && <MaintenancePanel />}
      {subTab === 'announcement' && <AnnouncementPanel />}
      {subTab === 'cache' && <CachePanel />}
      {subTab === 'database' && <DatabasePanel />}
    </div>
  );
};

// --- System Overview Panel ---
const SystemOverviewPanel = () => {
  const [health, setHealth] = useState(null);
  const [errors, setErrors] = useState(null);
  const [jobs, setJobs] = useState(null);
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      API.get('/admin/system/health').then(r => setHealth(r.data)),
      API.get('/admin/system/errors?limit=5').then(r => setErrors(r.data)),
      API.get('/admin/system/jobs').then(r => setJobs(r.data)),
      API.get('/admin/system/features').then(r => setFeatures(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading system overview...</div>;

  const healthColor = health?.status === 'healthy' ? 'green' : health?.status === 'degraded' ? 'amber' : 'red';

  return (
    <div className="space-y-4">
      {/* System Health Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <p className="text-xs font-medium text-jolshaa-on-surface-variant">Status</p>
          <p className={`text-2xl font-bold text-${healthColor}-600 capitalize`}>{health?.status || 'Unknown'}</p>
          {health?.uptime && <p className="text-[10px] text-jolshaa-on-surface-variant mt-0.5">Up {Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m</p>}
        </Card>
        <Card>
          <p className="text-xs font-medium text-jolshaa-on-surface-variant">Memory</p>
          <p className="text-2xl font-bold text-jolshaa-on-surface">{health?.memory?.heapUsed}MB</p>
          <div className="w-full bg-jolshaa-surface-container-high rounded-full h-1.5 mt-1.5">
            <div className={`bg-${healthColor}-500 h-1.5 rounded-full`} style={{ width: `${Math.min(100, ((health?.memory?.heapUsed || 0) / (health?.memory?.heapTotal || 1)) * 100)}%` }} />
          </div>
        </Card>
        <Card>
          <p className="text-xs font-medium text-jolshaa-on-surface-variant">DB Latency</p>
          <p className="text-2xl font-bold text-jolshaa-on-surface">{health?.db?.latency || '-'}ms</p>
          <Badge variant={health?.db?.status === 'connected' ? 'success' : 'danger'} size="xs">{health?.db?.status || 'Unknown'}</Badge>
        </Card>
        <Card>
          <p className="text-xs font-medium text-jolshaa-on-surface-variant">Errors (24h)</p>
          <p className={`text-2xl font-bold ${(errors?.stats?.last24h || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>{errors?.stats?.last24h || 0}</p>
          {errors?.stats?.lastHour > 0 && <p className="text-[10px] text-red-500 mt-0.5">{errors.stats.lastHour} in last hour</p>}
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Feature Flags Quick View */}
        <Card>
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Feature Flags</h3>
          <div className="space-y-1.5">
            {Object.entries(features).slice(0, 8).map(([key, enabled]) => (
              <div key={key} className="flex items-center justify-between py-1">
                <span className="text-xs text-jolshaa-on-surface-variant capitalize">{key.replace(/_/g, ' ')}</span>
                <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-500' : 'bg-jolshaa-outline-variant'}`} />
              </div>
            ))}
            {Object.keys(features).length > 8 && <p className="text-[10px] text-jolshaa-on-surface-variant">+{Object.keys(features).length - 8} more...</p>}
          </div>
        </Card>

        {/* Background Jobs Quick View */}
        <Card>
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Background Jobs</h3>
          {jobs?.queues ? (
            <div className="space-y-2">
              {Object.entries(jobs.queues).map(([name, stats]) => (
                <div key={name} className="flex items-center justify-between py-1">
                  <span className="text-xs text-jolshaa-on-surface-variant capitalize">{name}</span>
                  <div className="flex items-center gap-2 text-[10px]">
                    {stats.waiting > 0 && <span className="text-amber-600">{stats.waiting}w</span>}
                    {stats.processing > 0 && <span className="text-blue-600">{stats.processing}p</span>}
                    {stats.failed > 0 && <span className="text-red-600">{stats.failed}f</span>}
                    <span className="text-green-600">{stats.completed}</span>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-1 border-t border-jolshaa-outline-variant">
                <span className="text-xs font-medium text-jolshaa-on-surface-variant">Queue Status</span>
                <Badge variant={jobs.isRunning ? 'success' : 'danger'} size="xs">{jobs.isRunning ? 'Running' : 'Paused'}</Badge>
              </div>
            </div>
          ) : (
            <p className="text-xs text-jolshaa-on-surface-variant">No job data</p>
          )}
        </Card>
      </div>

      {/* Recent Errors */}
      {errors?.errors?.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Recent Errors</h3>
          <div className="space-y-2">
            {errors.errors.slice(0, 5).map(e => (
              <div key={e.id} className="flex items-start gap-2 text-xs">
                <Badge variant="danger" size="xs">{e.code}</Badge>
                <span className="text-red-600 flex-1 truncate">{e.message}</span>
                <span className="text-jolshaa-on-surface-variant whitespace-nowrap">{new Date(e.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
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

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Checking health...</div>;
  if (!health) return <div className="text-center py-8 text-red-500">Failed to load health</div>;

  const statusConfig = {
    healthy: { color: 'green', label: 'Healthy', dot: 'bg-green-500', ring: 'ring-green-200' },
    degraded: { color: 'amber', label: 'Degraded', dot: 'bg-amber-500', ring: 'ring-amber-200' },
    unhealthy: { color: 'red', label: 'Unhealthy', dot: 'bg-red-500', ring: 'ring-red-200' },
  };
  const status = statusConfig[health.status] || statusConfig.unhealthy;
  const memPercent = Math.min(100, ((health.memory?.heapUsed || 0) / (health.memory?.heapTotal || 1)) * 100);
  const errRate = parseFloat(health.performance?.errorRate) || 0;

  return (
    <div className="space-y-4">
      {/* Status Hero */}
      <Card className={`border-${status.color}-200`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-full ${status.dot} ring-4 ${status.ring} flex items-center justify-center flex-shrink-0`}>
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold font-display text-jolshaa-on-surface">System {status.label}</h3>
            <p className="text-xs text-jolshaa-on-surface-variant">
              Uptime: {Math.floor(health.uptime / 86400)}d {Math.floor((health.uptime % 86400) / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m &middot; Node {health.nodeVersion}
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={fetchHealth}>Refresh</Button>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Memory Heap</p>
          <p className="text-xl font-bold text-jolshaa-on-surface mt-1">{health.memory?.heapUsed}MB</p>
          <div className="w-full bg-jolshaa-surface-container-high rounded-full h-1.5 mt-2">
            <div className={`${memPercent > 80 ? 'bg-red-500' : memPercent > 60 ? 'bg-amber-500' : 'bg-green-500'} h-1.5 rounded-full transition-all`} style={{ width: `${memPercent}%` }} />
          </div>
          <p className="text-[10px] text-jolshaa-on-surface-variant mt-1">{health.memory?.heapTotal}MB total ({Math.round(memPercent)}%)</p>
        </Card>
        <Card>
          <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">DB Latency</p>
          <p className={`text-xl font-bold ${(health.db?.latency || 0) > 100 ? 'text-red-600' : (health.db?.latency || 0) > 50 ? 'text-amber-600' : 'text-green-600'} mt-1`}>{health.db?.latency || '-'}ms</p>
          <Badge variant={health.db?.status === 'connected' ? 'success' : 'danger'} size="xs" className="mt-2">{health.db?.status}</Badge>
        </Card>
        <Card>
          <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Req/min</p>
          <p className="text-xl font-bold text-jolshaa-on-surface mt-1">{health.performance?.requestsPerMinute || 0}</p>
          <p className="text-[10px] text-jolshaa-on-surface-variant mt-1">Avg {health.performance?.avgResponseTime || 0}ms</p>
        </Card>
        <Card>
          <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Error Rate</p>
          <p className={`text-xl font-bold ${errRate > 5 ? 'text-red-600' : errRate > 1 ? 'text-amber-600' : 'text-green-600'} mt-1`}>{health.performance?.errorRate || '0'}%</p>
          <div className="w-full bg-jolshaa-surface-container-high rounded-full h-1.5 mt-2">
            <div className={`${errRate > 5 ? 'bg-red-500' : errRate > 1 ? 'bg-amber-500' : 'bg-green-500'} h-1.5 rounded-full`} style={{ width: `${Math.min(100, errRate * 10)}%` }} />
          </div>
        </Card>
      </div>

      {/* Services & Host */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-display text-xs font-semibold text-jolshaa-on-surface-variant mb-3 uppercase tracking-wider">Services</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-jolshaa-outline-variant">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${health.db?.status === 'connected' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                <span className="text-sm text-jolshaa-on-surface">MongoDB</span>
              </div>
              <div className="text-right">
                <Badge variant={health.db?.status === 'connected' ? 'success' : 'danger'} size="xs">{health.db?.status}</Badge>
                <p className="text-[10px] text-jolshaa-on-surface-variant mt-0.5">{health.db?.latency}ms &middot; {health.db?.host}</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${health.redis?.status === 'connected' ? 'bg-green-500' : 'bg-amber-500'}`} />
                <span className="text-sm text-jolshaa-on-surface">Redis</span>
              </div>
              <Badge variant={health.redis?.status === 'connected' ? 'success' : 'warning'} size="xs">{health.redis?.status}</Badge>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-display text-xs font-semibold text-jolshaa-on-surface-variant mb-3 uppercase tracking-wider">Performance</h3>
          <div className="space-y-3">
            {[
              { label: 'Requests/min', value: health.performance?.requestsPerMinute, color: 'blue' },
              { label: 'Avg Response', value: `${health.performance?.avgResponseTime}ms`, color: parseFloat(health.performance?.avgResponseTime) > 200 ? 'red' : 'green' },
              { label: 'Error Rate', value: `${health.performance?.errorRate}%`, color: errRate > 5 ? 'red' : errRate > 1 ? 'amber' : 'green' },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between py-2 border-b border-jolshaa-outline-variant last:border-0">
                <span className="text-sm text-jolshaa-on-surface-variant">{m.label}</span>
                <span className={`text-sm font-semibold text-${m.color}-600`}>{m.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// --- Settings Panel ---
const SettingsPanel = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try { const res = await API.get('/admin/system/settings'); setSettings(res.data); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: { ...prev[key], value } }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {};
      Object.entries(settings).forEach(([k, v]) => { payload[k] = v.value; });
      await API.put('/admin/system/settings', { settings: payload });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { alert('Failed to save'); }
    setSaving(false);
  };

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;

  const criticalSettings = Object.entries(settings).filter(([, v]) => v.category === 'security');
  const categories = { site: 'Site Info', upload: 'Uploads' };

  const ToggleSwitch = ({ enabled, onChange, danger }) => (
    <button onClick={onChange} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? (danger ? 'bg-red-500' : 'bg-jolshaa-teal') : 'bg-jolshaa-outline-variant'}`}>
      <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Critical Security Settings */}
      {criticalSettings.length > 0 && (
        <Card className="border-amber-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <h3 className="font-display text-sm font-semibold text-amber-700 uppercase tracking-wider">Security Critical</h3>
          </div>
          <div className="space-y-3">
            {criticalSettings.map(([key, s]) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-jolshaa-outline-variant last:border-0">
                <div className="flex-1">
                  <p className="text-sm font-medium text-jolshaa-on-surface">{s.description || key}</p>
                  <p className="text-[10px] text-jolshaa-on-surface-variant mt-0.5">{key}</p>
                </div>
                <ToggleSwitch enabled={s.value} onChange={() => handleChange(key, !s.value)} danger={key.includes('maintenance') || key.includes('lock')} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Other Categories */}
      {Object.entries(categories).map(([cat, label]) => {
        const catSettings = Object.entries(settings).filter(([, v]) => v.category === cat);
        if (catSettings.length === 0) return null;
        return (
          <Card key={cat}>
            <h3 className="font-display text-xs font-semibold text-jolshaa-on-surface-variant mb-3 uppercase tracking-wider">{label}</h3>
            <div className="space-y-2">
              {catSettings.map(([key, s]) => (
                <div key={key} className="flex items-center gap-3 py-2 border-b border-jolshaa-outline-variant last:border-0">
                  <label className="text-xs text-jolshaa-on-surface-variant w-44 flex-shrink-0">{s.description || key}</label>
                  {typeof s.value === 'boolean' ? (
                    <ToggleSwitch enabled={s.value} onChange={() => handleChange(key, !s.value)} />
                  ) : typeof s.value === 'number' ? (
                    <input type="number" value={s.value} onChange={e => handleChange(key, parseInt(e.target.value) || 0)} className="w-24 border border-jolshaa-outline-variant rounded px-2 py-1.5 text-sm bg-jolshaa-surface-container-lowest focus:ring-2 focus:ring-jolshaa-teal focus:border-jolshaa-teal" />
                  ) : (
                    <input type="text" value={s.value} onChange={e => handleChange(key, e.target.value)} className="flex-1 border border-jolshaa-outline-variant rounded px-2 py-1.5 text-sm bg-jolshaa-surface-container-lowest focus:ring-2 focus:ring-jolshaa-teal focus:border-jolshaa-teal" />
                  )}
                </div>
              ))}
            </div>
          </Card>
        );
      })}

      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-xs text-green-600 flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Saved</span>}
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save All Settings'}</Button>
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

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;

  const labels = {
    allow_signup: 'User Signups', allow_stories: 'Stories', allow_reels: 'Reels',
    allow_marketplace: 'Marketplace', allow_groups: 'Groups', allow_pages: 'Pages',
    allow_events: 'Events', allow_messaging: 'Messaging', allow_live: 'Live Streaming',
    allow_creator_program: 'Creator Program', allow_ads: 'Advertising',
  };

  return (
    <Card>
      <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-4">Feature Flags</h3>
      <div className="space-y-3">
        {Object.entries(features).map(([key, enabled]) => (
          <div key={key} className="flex items-center justify-between py-2 border-b border-jolshaa-outline-variant last:border-0">
            <div>
              <p className="text-sm font-medium text-jolshaa-on-surface">{labels[key] || key}</p>
              <p className="text-xs text-jolshaa-on-surface-variant">{key}</p>
            </div>
            <button onClick={() => toggle(key)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-green-500' : 'bg-jolshaa-outline-variant'}`}>
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

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">Maintenance Mode</h3>
            <p className="text-xs text-jolshaa-on-surface-variant mt-0.5">When enabled, only admins can access the site</p>
          </div>
          <button onClick={toggle} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${data?.enabled ? 'bg-red-500' : 'bg-jolshaa-outline-variant'}`}>
            <span className={`inline-block h-5 w-5 rounded-full bg-white transition-transform shadow ${data?.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
        {data?.enabled && (
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-red-600 font-medium">MAINTENANCE MODE IS ACTIVE</p>
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

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;

  const typeColors = { info: 'bg-blue-500', warning: 'bg-amber-500', success: 'bg-green-500', error: 'bg-red-500' };

  return (
    <div className="space-y-4">
      <Card>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">Announcement Banner</h3>
            <button onClick={() => setData(p => ({ ...p, enabled: !p.enabled }))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${data.enabled ? 'bg-green-500' : 'bg-jolshaa-outline-variant'}`}>
              <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow ${data.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div>
            <label className="text-xs font-medium text-jolshaa-on-surface-variant">Banner Text</label>
            <input type="text" value={data.text} onChange={e => setData(p => ({ ...p, text: e.target.value }))} placeholder="Enter announcement text..." className="w-full border border-jolshaa-outline-variant rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest mt-1" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-jolshaa-on-surface-variant">Type</label>
              <select value={data.type} onChange={e => setData(p => ({ ...p, type: e.target.value }))} className="w-full border border-jolshaa-outline-variant rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest mt-1">
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-jolshaa-on-surface-variant">Link URL (optional)</label>
              <input type="text" value={data.link} onChange={e => setData(p => ({ ...p, link: e.target.value }))} placeholder="https://..." className="w-full border border-jolshaa-outline-variant rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest mt-1" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={data.dismissable} onChange={e => setData(p => ({ ...p, dismissable: e.target.checked }))} className="rounded" />
            <label className="text-xs text-jolshaa-on-surface-variant">Users can dismiss this banner</label>
          </div>
        </div>
      </Card>

      {data.enabled && data.text && (
        <Card>
          <h4 className="font-display text-xs font-medium text-jolshaa-on-surface-variant mb-2">Preview</h4>
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

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">Background Jobs</h3>
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
          <p className="text-xs font-medium text-jolshaa-on-surface-variant">Status</p>
          <Badge variant={data?.isRunning ? 'success' : 'danger'} size="sm">{data?.isRunning ? 'Running' : 'Paused'}</Badge>
        </Card>
        {data?.queues && Object.entries(data.queues).map(([name, stats]) => (
          <Card key={name}>
            <p className="text-xs font-medium text-jolshaa-on-surface-variant capitalize">{name}</p>
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
  const [expandedError, setExpandedError] = useState(null);

  const fetchErrors = async () => {
    setLoading(true);
    try { const res = await API.get('/admin/system/errors?limit=50'); setData(res.data); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchErrors(); }, []);

  const handleClear = async () => {
    try { await API.post('/admin/system/errors/clear'); fetchErrors(); } catch { alert('Failed'); }
  };

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">Error Logs</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={fetchErrors}>Refresh</Button>
          <Button size="sm" variant="danger" onClick={handleClear}>Clear Old</Button>
        </div>
      </div>

      {/* Error Stats Cards */}
      {data?.stats && (
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Total</p>
            <p className="text-2xl font-bold text-jolshaa-on-surface mt-1">{data.stats.total}</p>
          </Card>
          <Card className={data.stats.last24h > 0 ? 'border-amber-200' : ''}>
            <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Last 24h</p>
            <p className={`text-2xl font-bold mt-1 ${data.stats.last24h > 0 ? 'text-amber-600' : 'text-green-600'}`}>{data.stats.last24h}</p>
            {data.stats.last24h > 10 && <p className="text-[10px] text-amber-500 mt-0.5">High error volume</p>}
          </Card>
          <Card className={data.stats.lastHour > 0 ? 'border-red-200' : ''}>
            <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Last Hour</p>
            <p className={`text-2xl font-bold mt-1 ${data.stats.lastHour > 0 ? 'text-red-600' : 'text-green-600'}`}>{data.stats.lastHour}</p>
            {data.stats.lastHour > 0 && <div className="flex items-center gap-1 mt-0.5"><div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /><p className="text-[10px] text-red-500">Active</p></div>}
          </Card>
        </div>
      )}

      {/* Error Codes Breakdown */}
      {data?.stats?.byCode && Object.keys(data.stats.byCode).length > 0 && (
        <Card>
          <h4 className="font-display text-xs font-semibold text-jolshaa-on-surface-variant mb-3 uppercase tracking-wider">Error Codes (24h)</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.stats.byCode).map(([code, count]) => (
              <div key={code} className="flex items-center gap-1.5 bg-red-50 text-red-700 px-2.5 py-1 rounded-full text-xs">
                <span className="font-mono font-medium">{code}</span>
                <span className="bg-red-200 text-red-800 px-1.5 rounded-full text-[10px] font-bold">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Error List */}
      <Card padding={false}>
        <div className="divide-y divide-jolshaa-outline-variant max-h-[50vh] overflow-y-auto">
          {data?.errors?.length === 0 ? (
            <div className="text-center py-12 text-jolshaa-on-surface-variant text-sm">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              No errors logged
            </div>
          ) : data?.errors?.map(e => (
            <div key={e.id} className={`px-4 py-3 hover:bg-jolshaa-surface-container-low transition-colors ${expandedError === e.id ? 'bg-red-50/50' : ''}`}>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="danger" size="xs">{e.code}</Badge>
                <span className="text-xs text-jolshaa-on-surface-variant">{new Date(e.timestamp).toLocaleString()}</span>
                {e.stack && (
                  <button onClick={() => setExpandedError(expandedError === e.id ? null : e.id)} className="text-[10px] text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface ml-auto">
                    {expandedError === e.id ? 'Hide' : 'Stack'}
                  </button>
                )}
              </div>
              <p className="text-sm text-red-600 font-medium">{e.message}</p>
              {e.context?.method && <p className="text-xs text-jolshaa-on-surface-variant mt-0.5 font-mono">{e.context.method} {e.context.path}</p>}
              {expandedError === e.id && e.stack && (
                <pre className="text-[10px] text-jolshaa-on-surface-variant mt-2 p-2 bg-jolshaa-surface-container-low rounded max-h-32 overflow-y-auto whitespace-pre-wrap font-mono">{e.stack}</pre>
              )}
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

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">Cache Management</h3>
        </div>
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span>Redis</span>
            <Badge variant={data?.redis?.available ? 'success' : 'warning'} size="xs">{data?.redis?.available ? 'Connected' : 'Unavailable (memory cache)'}</Badge>
          </div>
        </div>
      </Card>

      <Card>
        <h4 className="font-display text-xs font-semibold text-jolshaa-on-surface-variant mb-2">Cache Key Patterns</h4>
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

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;

  return (
    <div className="space-y-4">
      {data?.connection && (
        <Card>
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Connection</h3>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div><span className="text-jolshaa-on-surface-variant">Status:</span> <Badge variant={data.connection.state === 'connected' ? 'success' : 'danger'} size="xs">{data.connection.state}</Badge></div>
            <div><span className="text-jolshaa-on-surface-variant">Host:</span> <span className="font-medium">{data.connection.host}</span></div>
            <div><span className="text-jolshaa-on-surface-variant">Database:</span> <span className="font-medium">{data.connection.name}</span></div>
          </div>
        </Card>
      )}

      {data?.dbStats && (
        <Card>
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Database Size</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div><span className="text-jolshaa-on-surface-variant">Data:</span> <span className="font-medium">{data.dbStats.size} MB</span></div>
            <div><span className="text-jolshaa-on-surface-variant">Storage:</span> <span className="font-medium">{data.dbStats.storageSize} MB</span></div>
            <div><span className="text-jolshaa-on-surface-variant">Indexes:</span> <span className="font-medium">{data.dbStats.indexes}</span></div>
            <div><span className="text-jolshaa-on-surface-variant">Index Size:</span> <span className="font-medium">{data.dbStats.indexSize} MB</span></div>
          </div>
        </Card>
      )}

      {data?.collections?.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Collections</h3>
          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-jolshaa-outline-variant">
                    <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Collection</th>
                    <th className="text-right px-4 py-3 font-medium text-jolshaa-on-surface-variant">Documents</th>
                    <th className="text-right px-4 py-3 font-medium text-jolshaa-on-surface-variant">Last Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-jolshaa-outline-variant">
                  {data.collections.map(c => (
                    <tr key={c.name} className="hover:bg-jolshaa-surface-container-low">
                      <td className="px-4 py-3 font-medium text-jolshaa-on-surface capitalize">{c.name}</td>
                      <td className="px-4 py-3 text-right text-xs">{c.count.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-xs text-jolshaa-on-surface-variant">{c.lastActivity ? new Date(c.lastActivity).toLocaleString() : '-'}</td>
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

// --- Scheduler Panel ---
const SchedulerPanel = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/system/cron-jobs');
      setJobs(res.data.jobs);
    } catch (err) {
      console.error('Failed to fetch cron jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleTrigger = async (name) => {
    setTriggering(name);
    try {
      await API.post(`/admin/system/cron-jobs/${name}/trigger`);
      setTimeout(fetchJobs, 500);
    } catch (err) {
      alert('Failed to trigger job');
    } finally {
      setTriggering(null);
    }
  };

  const handleToggle = async (name, enabled) => {
    try {
      await API.put(`/admin/system/cron-jobs/${name}/toggle`, { enabled });
      setJobs(prev => prev.map(j => j.name === name ? { ...j, enabled } : j));
    } catch (err) {
      alert('Failed to toggle job');
    }
  };

  const handleTriggerAll = async () => {
    for (const job of jobs) {
      if (job.enabled) {
        try { await API.post(`/admin/system/cron-jobs/${job.name}/trigger`); } catch {}
      }
    }
    setTimeout(fetchJobs, 1000);
  };

  const formatDuration = (ms) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTime = (date) => {
    if (!date) return 'Never';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading cron jobs...</div>;

  const totalRuns = jobs.reduce((sum, j) => sum + j.runCount, 0);
  const totalFails = jobs.reduce((sum, j) => sum + j.failCount, 0);
  const enabledCount = jobs.filter(j => j.enabled).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">Scheduled Jobs (Cron)</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={fetchJobs}>Refresh</Button>
          <Button size="sm" variant="ghost" onClick={handleTriggerAll}>Run All Enabled</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <p className="text-xs font-medium text-jolshaa-on-surface-variant">Total Jobs</p>
          <p className="text-2xl font-bold text-jolshaa-on-surface">{jobs.length}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-jolshaa-on-surface-variant">Enabled</p>
          <p className="text-2xl font-bold text-green-600">{enabledCount}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-jolshaa-on-surface-variant">Total Runs</p>
          <p className="text-2xl font-bold text-blue-600">{totalRuns}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-jolshaa-on-surface-variant">Failed</p>
          <p className={`text-2xl font-bold ${totalFails > 0 ? 'text-red-600' : 'text-green-600'}`}>{totalFails}</p>
        </Card>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-jolshaa-outline-variant">
                <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Job Name</th>
                <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Interval</th>
                <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Last Run</th>
                <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Duration</th>
                <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Runs</th>
                <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Status</th>
                <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Error</th>
                <th className="text-right px-4 py-3 font-medium text-jolshaa-on-surface-variant">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-jolshaa-outline-variant">
              {jobs.map(job => (
                <tr key={job.name} className="hover:bg-jolshaa-surface-container-low">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-jolshaa-on-surface capitalize">
                        {job.name.replace(/_/g, ' ')}
                      </p>
                      <p className="text-2xs text-jolshaa-on-surface-variant font-mono">{job.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="neutral" size="xs">{job.intervalLabel}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-jolshaa-on-surface-variant">
                    {formatTime(job.lastRun)}
                  </td>
                  <td className="px-4 py-3 text-xs text-jolshaa-on-surface-variant">
                    {formatDuration(job.lastDuration)}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="text-blue-600">{job.runCount}</span>
                    {job.failCount > 0 && <span className="text-red-600 ml-1">({job.failCount} failed)</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={job.lastError ? 'danger' : job.enabled ? 'success' : 'neutral'} size="xs">
                        {job.lastError ? 'Error' : job.enabled ? 'Healthy' : 'Disabled'}
                      </Badge>
                      <button
                        onClick={() => handleToggle(job.name, !job.enabled)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${job.enabled ? 'bg-green-500' : 'bg-jolshaa-outline-variant'}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${job.enabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-red-500 max-w-[150px] truncate" title={job.lastError || ''}>
                    {job.lastError || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => handleTrigger(job.name)}
                        disabled={triggering === job.name || !job.enabled}
                      >
                        {triggering === job.name ? 'Running...' : 'Run Now'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {jobs.length === 0 && <p className="text-center py-6 text-jolshaa-on-surface-variant text-sm">No cron jobs found</p>}
      </Card>
    </div>
  );
};

// ============================================================
// SECURITY TAB
// ============================================================

const SecurityTab = () => {
  const [subTab, setSubTab] = useState('overview');

  const subTabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'login-audit', label: 'Login Audit' },
    { key: 'suspicious', label: 'Suspicious Logins' },
    { key: 'sessions', label: 'Sessions' },
    { key: '2fa', label: '2FA' },
    { key: 'ip-device', label: 'IP / Device' },
    { key: 'permissions', label: 'Permission Log' },
    { key: 'password', label: 'Password Reset' },
    { key: 'rate-limit', label: 'Rate-Limit Abuse' },
    { key: 'data-export', label: 'Data Export' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold font-display text-jolshaa-on-surface">Security Center</h2>
          <p className="text-xs text-jolshaa-on-surface-variant">Admin login audit, 2FA, sessions, and threat detection</p>
        </div>
      </div>

      <Tabs tabs={subTabs} activeTab={subTab} onChange={setSubTab} className="mb-4" />
      {subTab === 'overview' && <SecurityOverviewPanel />}
      {subTab === 'login-audit' && <LoginAuditPanel />}
      {subTab === 'suspicious' && <SuspiciousLoginsPanel />}
      {subTab === 'sessions' && <SessionsPanel />}
      {subTab === '2fa' && <TwoFAPanel />}
      {subTab === 'ip-device' && <IPDevicePanel />}
      {subTab === 'permissions' && <PermissionLogPanel />}
      {subTab === 'password' && <PasswordResetPanel />}
      {subTab === 'rate-limit' && <RateLimitAbusePanel />}
      {subTab === 'data-export' && <DataExportPanel />}
    </div>
  );
};

// --- Security Overview Panel ---
const SecurityOverviewPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      API.get('/admin/security/login-audit'),
      API.get('/admin/security/suspicious-logins'),
      API.get('/admin/security/sessions'),
      API.get('/admin/security/2fa/enforcement'),
      API.get('/admin/security/rate-limit-abuse'),
    ]).then(results => {
      setData({
        loginAudit: results[0].status === 'fulfilled' ? results[0].value.data : null,
        suspicious: results[1].status === 'fulfilled' ? results[1].value.data : null,
        sessions: results[2].status === 'fulfilled' ? results[2].value.data : null,
        twoFA: results[3].status === 'fulfilled' ? results[3].value.data : null,
        rateLimit: results[4].status === 'fulfilled' ? results[4].value.data : null,
      });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading security overview...</div>;

  const failedLogins = data?.loginAudit?.entries?.filter(e => !e.success).length || 0;
  const suspiciousCount = data?.suspicious?.suspicious?.length || 0;
  const activeSessions = data?.sessions?.total || 0;
  const rateLimitAbusers = data?.rateLimit?.abuseReport?.length || 0;
  const twoFAEnforced = data?.twoFA?.enforced || false;
  const twoFAEnabled = data?.twoFA?.enabledCount || 0;
  const totalAdmins = data?.twoFA?.totalAdmins || 0;

  const getThreatLevel = () => {
    if (suspiciousCount > 0 || rateLimitAbusers > 0) return { level: 'high', color: 'red', label: 'Elevated' };
    if (failedLogins > 5) return { level: 'medium', color: 'amber', label: 'Moderate' };
    return { level: 'low', color: 'green', label: 'Normal' };
  };
  const threat = getThreatLevel();

  return (
    <div className="space-y-4">
      {/* Threat Level Banner */}
      <Card className={`border-${threat.color}-200`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full bg-${threat.color}-100 flex items-center justify-center flex-shrink-0`}>
            <svg className={`w-6 h-6 text-${threat.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold font-display text-jolshaa-on-surface">Threat Level: <span className={`text-${threat.color}-600`}>{threat.label}</span></h3>
            <p className="text-xs text-jolshaa-on-surface-variant">{suspiciousCount} suspicious activity, {rateLimitAbusers} rate-limit abusers, {failedLogins} failed logins</p>
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className={suspiciousCount > 0 ? 'border-red-200' : ''}>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg ${suspiciousCount > 0 ? 'bg-red-100' : 'bg-green-100'} flex items-center justify-center`}>
              <svg className={`w-4 h-4 ${suspiciousCount > 0 ? 'text-red-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div>
              <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase">Suspicious</p>
              <p className={`text-xl font-bold ${suspiciousCount > 0 ? 'text-red-600' : 'text-green-600'}`}>{suspiciousCount}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </div>
            <div>
              <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase">Sessions</p>
              <p className="text-xl font-bold text-blue-600">{activeSessions}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg ${twoFAEnforced ? 'bg-green-100' : 'bg-amber-100'} flex items-center justify-center`}>
              <svg className={`w-4 h-4 ${twoFAEnforced ? 'text-green-600' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <div>
              <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase">2FA</p>
              <p className="text-xl font-bold text-jolshaa-on-surface">{twoFAEnabled}/{totalAdmins}</p>
              <p className={`text-[10px] ${twoFAEnforced ? 'text-green-600' : 'text-amber-600'}`}>{twoFAEnforced ? 'Enforced' : 'Not enforced'}</p>
            </div>
          </div>
        </Card>
        <Card className={rateLimitAbusers > 0 ? 'border-amber-200' : ''}>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg ${rateLimitAbusers > 0 ? 'bg-amber-100' : 'bg-green-100'} flex items-center justify-center`}>
              <svg className={`w-4 h-4 ${rateLimitAbusers > 0 ? 'text-amber-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase">Rate Abuse</p>
              <p className={`text-xl font-bold ${rateLimitAbusers > 0 ? 'text-amber-600' : 'text-green-600'}`}>{rateLimitAbusers}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Suspicious Logins */}
      {data?.suspicious?.suspicious?.length > 0 && (
        <Card className="border-red-200">
          <h3 className="font-display text-xs font-semibold text-red-700 mb-3 uppercase tracking-wider">Suspicious Activity</h3>
          <div className="space-y-2">
            {data.suspicious.suspicious.slice(0, 3).map(s => (
              <div key={s.adminId} className="flex items-center gap-3 py-2 border-b border-jolshaa-outline-variant last:border-0">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-jolshaa-on-surface">{s.adminName}</p>
                  <p className="text-[10px] text-jolshaa-on-surface-variant">{s.reasons.recentFailedAttempts} failed attempts, {s.reasons.uniqueIPs} IPs</p>
                </div>
                <Badge variant="danger" size="xs">Risk: {s.riskScore}%</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Failed Logins Timeline */}
      {data?.loginAudit?.entries?.filter(e => !e.success).length > 0 && (
        <Card>
          <h3 className="font-display text-xs font-semibold text-jolshaa-on-surface-variant mb-3 uppercase tracking-wider">Recent Failed Logins</h3>
          <div className="space-y-0">
            {data.loginAudit.entries.filter(e => !e.success).slice(0, 5).map((entry, i) => (
              <div key={i} className="flex items-start gap-3 py-2 relative">
                {/* Timeline connector */}
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
                  {i < 4 && <div className="w-0.5 h-full bg-jolshaa-surface-container-high absolute left-[5px] top-3" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-jolshaa-on-surface">{entry.adminName}</span>
                    <Badge variant="danger" size="xs">Failed</Badge>
                  </div>
                  <p className="text-[10px] text-jolshaa-on-surface-variant mt-0.5">{entry.ip || 'Unknown IP'} &middot; {new Date(entry.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

// --- Login Audit Panel ---
const LoginAuditPanel = () => {
  const [data, setData] = useState({ entries: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = filter ? `?userId=${filter}` : '';
      const res = await API.get(`/admin/security/login-audit${params}`);
      setData(res.data);
    } catch (err) { console.error('Failed'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filter]);

  const failedCount = data.entries.filter(e => !e.success).length;
  const successCount = data.entries.filter(e => e.success).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">Admin Login Audit</h3>
        <div className="flex gap-2">
          <select value={filter} onChange={e => setFilter(e.target.value)} className="text-xs border border-jolshaa-outline-variant rounded-lg px-2 py-1.5 bg-jolshaa-surface-container-lowest">
            <option value="">All admins</option>
          </select>
          <Button size="sm" variant="ghost" onClick={fetchData}>Refresh</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Total</p>
          <p className="text-2xl font-bold text-jolshaa-on-surface mt-1">{data.total}</p>
        </Card>
        <Card>
          <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Successful</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{successCount}</p>
        </Card>
        <Card className={failedCount > 0 ? 'border-red-200' : ''}>
          <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Failed</p>
          <p className={`text-2xl font-bold mt-1 ${failedCount > 0 ? 'text-red-600' : 'text-green-600'}`}>{failedCount}</p>
        </Card>
      </div>

      {loading ? <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div> : (
        <Card padding={false}>
          <div className="max-h-[50vh] overflow-y-auto">
            {data.entries.length === 0 ? (
              <div className="text-center py-8 text-jolshaa-on-surface-variant text-sm">No login history</div>
            ) : (
              <div className="divide-y divide-jolshaa-outline-variant">
                {data.entries.map((entry, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-3 hover:bg-jolshaa-surface-container-low transition-colors">
                    {/* Status indicator */}
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${entry.success ? 'bg-green-500' : 'bg-red-500'}`} />
                    {/* Admin info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-jolshaa-on-surface">{entry.adminName}</span>
                        <Badge variant={entry.adminRole === 'superadmin' ? 'danger' : 'primary'} size="xs">{entry.adminRole}</Badge>
                        <Badge variant={entry.success ? 'success' : 'danger'} size="xs">{entry.success ? 'Success' : 'Failed'}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] text-jolshaa-on-surface-variant font-mono">{entry.ip || 'Unknown'}</span>
                        {entry.userAgent && <span className="text-[10px] text-jolshaa-on-surface-variant truncate max-w-[200px]">{entry.userAgent}</span>}
                      </div>
                    </div>
                    {/* Time */}
                    <span className="text-[10px] text-jolshaa-on-surface-variant whitespace-nowrap">{new Date(entry.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

// --- Suspicious Logins Panel ---
const SuspiciousLoginsPanel = () => {
  const [data, setData] = useState({ suspicious: [], total: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/security/suspicious-logins');
      setData(res.data);
    } catch (err) { console.error('Failed'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const getRiskConfig = (score) => {
    if (score >= 70) return { color: 'red', bg: 'bg-red-50', border: 'border-red-200', label: 'High Risk', dot: 'bg-red-500 animate-pulse' };
    if (score >= 40) return { color: 'amber', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Medium Risk', dot: 'bg-amber-500' };
    return { color: 'green', bg: 'bg-green-50', border: 'border-green-200', label: 'Low Risk', dot: 'bg-green-500' };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">Suspicious Login Detection</h3>
        <Button size="sm" variant="ghost" onClick={fetchData}>Refresh</Button>
      </div>

      {loading ? <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div> : data.suspicious.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-sm font-medium text-jolshaa-on-surface">All Clear</p>
            <p className="text-xs text-jolshaa-on-surface-variant mt-0.5">No suspicious logins detected</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.suspicious.map(s => {
            const risk = getRiskConfig(s.riskScore);
            return (
              <Card key={s.adminId} className={`${risk.bg} ${risk.border}`}>
                <div className="flex items-start gap-4">
                  {/* Risk Score Circle */}
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${risk.bg}`}>
                    <div className="text-center">
                      <p className={`text-lg font-bold text-${risk.color}-600`}>{s.riskScore}</p>
                      <p className={`text-[8px] text-${risk.color}-600 uppercase`}>Risk</p>
                    </div>
                  </div>
                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium text-jolshaa-on-surface">{s.adminName}</p>
                      <Badge variant={s.adminRole === 'superadmin' ? 'danger' : 'primary'} size="xs">{s.adminRole}</Badge>
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${risk.dot}`} />
                        <span className={`text-[10px] font-medium text-${risk.color}-600`}>{risk.label}</span>
                      </div>
                    </div>
                    {/* Risk Factors Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-jolshaa-surface-container-lowest rounded p-2">
                        <p className="text-[10px] text-jolshaa-on-surface-variant">Failed (24h)</p>
                        <p className="text-sm font-bold text-red-600">{s.reasons.recentFailedAttempts}</p>
                      </div>
                      <div className="bg-jolshaa-surface-container-lowest rounded p-2">
                        <p className="text-[10px] text-jolshaa-on-surface-variant">Unique IPs</p>
                        <p className="text-sm font-bold text-jolshaa-on-surface">{s.reasons.uniqueIPs}</p>
                      </div>
                      <div className="bg-jolshaa-surface-container-lowest rounded p-2">
                        <p className="text-[10px] text-jolshaa-on-surface-variant">Unique UAs</p>
                        <p className="text-sm font-bold text-jolshaa-on-surface">{s.reasons.uniqueUserAgents}</p>
                      </div>
                      <div className={`rounded p-2 ${s.reasons.shortTimeBurst ? 'bg-red-100' : 'bg-green-100'}`}>
                        <p className="text-[10px] text-jolshaa-on-surface-variant">IP Burst</p>
                        <p className={`text-sm font-bold ${s.reasons.shortTimeBurst ? 'text-red-600' : 'text-green-600'}`}>{s.reasons.shortTimeBurst ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                    {/* Recent Login */}
                    {s.recentLogins.length > 0 && (
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-jolshaa-on-surface-variant">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>Last: {s.recentLogins[0].ip} &middot; {new Date(s.recentLogins[0].timestamp).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- Sessions Panel ---
const SessionsPanel = () => {
  const [data, setData] = useState({ sessions: [], total: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/security/sessions');
      setData(res.data);
    } catch (err) { console.error('Failed'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRevoke = async (userId, sessionId) => {
    if (!window.confirm('Revoke this session?')) return;
    try {
      await API.delete(`/admin/security/sessions/${userId}/${sessionId}`);
      fetchData();
    } catch (err) { alert('Failed'); }
  };

  const handleRevokeAll = async (userId) => {
    if (!window.confirm('Revoke ALL sessions for this admin?')) return;
    try {
      await API.delete(`/admin/security/sessions/${userId}`);
      fetchData();
    } catch (err) { alert('Failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">Admin Sessions ({data.total})</h3>
        <Button size="sm" variant="ghost" onClick={fetchData}>Refresh</Button>
      </div>

      {loading ? <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div> : (
        <Card padding={false}>
          <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-jolshaa-surface-container-lowest">
                <tr className="border-b border-jolshaa-outline-variant">
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Admin</th>
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">IP</th>
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">User Agent</th>
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Created</th>
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Last Active</th>
                  <th className="text-right px-4 py-3 font-medium text-jolshaa-on-surface-variant">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-jolshaa-outline-variant">
                {data.sessions.map((s, i) => (
                  <tr key={i} className="hover:bg-jolshaa-surface-container-low">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-jolshaa-on-surface">{s.adminName}</p>
                        <p className="text-xs text-jolshaa-on-surface-variant">{s.adminRole}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">{s.ip || '-'}</td>
                    <td className="px-4 py-3 text-xs max-w-[200px] truncate" title={s.userAgent}>{s.userAgent || '-'}</td>
                    <td className="px-4 py-3 text-xs text-jolshaa-on-surface-variant">{new Date(s.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-jolshaa-on-surface-variant">{new Date(s.lastActive).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <Button size="xs" variant="ghost" onClick={() => handleRevoke(s.adminId, s._id)}>Revoke</Button>
                        <Button size="xs" variant="danger" onClick={() => handleRevokeAll(s.adminId)}>Revoke All</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.sessions.length === 0 && <p className="text-center py-6 text-jolshaa-on-surface-variant text-sm">No active sessions</p>}
        </Card>
      )}
    </div>
  );
};

// --- 2FA Panel ---
const TwoFAPanel = () => {
  const [enforcement, setEnforcement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [verifyCode, setVerifyCode] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/security/2fa/enforcement');
      setEnforcement(res.data);
    } catch (err) { console.error('Failed'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSetup = async () => {
    try {
      const res = await API.post('/admin/security/2fa/enable');
      setSecret(res.data.secret);
      setBackupCodes(res.data.backupCodes);
      setShowSetup(true);
    } catch (err) { alert('Failed'); }
  };

  const handleVerify = async () => {
    try {
      await API.post('/admin/security/2fa/verify', { code: verifyCode });
      setVerifyCode('');
      setShowSetup(false);
      fetchData();
      alert('2FA enabled successfully');
    } catch (err) { alert(err.response?.data?.message || 'Invalid code'); }
  };

  const handleDisable = async (userId) => {
    if (!window.confirm('Disable 2FA for this admin?')) return;
    try {
      await API.post('/admin/security/2fa/disable');
      fetchData();
    } catch (err) { alert('Failed'); }
  };

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">Two-Factor Authentication</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={fetchData}>Refresh</Button>
          <Button size="sm" onClick={handleSetup}>Setup 2FA (Self)</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <p className="text-xs text-jolshaa-on-surface-variant">Total Admins</p>
          <p className="text-2xl font-bold text-jolshaa-on-surface">{enforcement?.totalAdmins || 0}</p>
        </Card>
        <Card>
          <p className="text-xs text-jolshaa-on-surface-variant">2FA Enabled</p>
          <p className="text-2xl font-bold text-green-600">{enforcement?.enabledCount || 0}</p>
        </Card>
        <Card>
          <p className="text-xs text-jolshaa-on-surface-variant">Enforced</p>
          <p className={`text-2xl font-bold ${enforcement?.enforced ? 'text-green-600' : 'text-red-600'}`}>{enforcement?.enforced ? 'Yes' : 'No'}</p>
        </Card>
      </div>

      {enforcement?.admins && (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-jolshaa-outline-variant">
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Admin</th>
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">2FA Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-jolshaa-outline-variant">
                {enforcement.admins.map(a => (
                  <tr key={a.id} className="hover:bg-jolshaa-surface-container-low">
                    <td className="px-4 py-3">
                      <p className="font-medium text-jolshaa-on-surface">{a.name}</p>
                      <p className="text-xs text-jolshaa-on-surface-variant">{a.email}</p>
                    </td>
                    <td className="px-4 py-3"><Badge variant={a.role === 'superadmin' ? 'danger' : 'primary'} size="xs">{a.role}</Badge></td>
                    <td className="px-4 py-3">
                      <Badge variant={a.twoFactorEnabled ? 'success' : 'warning'} size="xs">
                        {a.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showSetup && (
        <Card>
          <h4 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Setup 2FA</h4>
          <div className="space-y-3 text-xs">
            <div>
              <p className="text-jolshaa-on-surface-variant mb-1">Secret (enter in your authenticator app):</p>
              <code className="block p-2 bg-jolshaa-surface-container-low rounded font-mono break-all">{secret}</code>
            </div>
            <div>
              <p className="text-jolshaa-on-surface-variant mb-1">Backup Codes (save these!):</p>
              <div className="flex flex-wrap gap-1">
                {backupCodes.map((code, i) => (
                  <code key={i} className="px-2 py-1 bg-jolshaa-surface-container-low rounded">{code}</code>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Enter 6-digit code" value={verifyCode} onChange={e => setVerifyCode(e.target.value)} className="flex-1" />
              <Button onClick={handleVerify}>Verify & Enable</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

// --- IP / Device Panel ---
const IPDevicePanel = () => {
  const [data, setData] = useState({ history: [], total: 0, ipSummary: [] });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/security/ip-history');
      setData(res.data);
    } catch (err) { console.error('Failed'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">IP / Device History</h3>
        <Button size="sm" variant="ghost" onClick={fetchData}>Refresh</Button>
      </div>

      {data.ipSummary?.length > 0 && (
        <Card>
          <h4 className="font-display text-xs font-semibold text-jolshaa-on-surface-variant mb-3">IP Summary (Top {data.ipSummary.length})</h4>
          <div className="space-y-2">
            {data.ipSummary.slice(0, 20).map(ip => (
              <div key={ip.ip} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <code className="font-mono text-jolshaa-on-surface">{ip.ip}</code>
                  <span className="text-jolshaa-on-surface-variant">({ip.users.join(', ')})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-jolshaa-on-surface-variant">{ip.count} hits</span>
                  <span className="text-jolshaa-on-surface-variant">{new Date(ip.lastSeen).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {loading ? <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div> : (
        <Card padding={false}>
          <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-jolshaa-surface-container-lowest">
                <tr className="border-b border-jolshaa-outline-variant">
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">User</th>
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">IP</th>
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">User Agent</th>
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-jolshaa-outline-variant">
                {data.history.slice(0, 100).map((h, i) => (
                  <tr key={i} className="hover:bg-jolshaa-surface-container-low">
                    <td className="px-4 py-3">
                      <p className="font-medium text-jolshaa-on-surface">{h.userName}</p>
                      <p className="text-xs text-jolshaa-on-surface-variant">{h.userRole}</p>
                    </td>
                    <td className="px-4 py-3"><Badge variant={h.type === 'login' ? 'primary' : 'neutral'} size="xs">{h.type}</Badge></td>
                    <td className="px-4 py-3 text-xs font-mono">{h.ip || '-'}</td>
                    <td className="px-4 py-3 text-xs max-w-[200px] truncate" title={h.userAgent}>{h.userAgent || '-'}</td>
                    <td className="px-4 py-3">
                      {h.type === 'login' && <Badge variant={h.success ? 'success' : 'danger'} size="xs">{h.success ? 'Success' : 'Failed'}</Badge>}
                      {h.type === 'session' && <Badge variant="neutral" size="xs">Active</Badge>}
                    </td>
                    <td className="px-4 py-3 text-xs text-jolshaa-on-surface-variant">{new Date(h.timestamp).toLocaleString()}</td>
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

// --- Permission Log Panel ---
const PermissionLogPanel = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/security/permission-log');
      setLogs(res.data.logs);
    } catch (err) { console.error('Failed'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const actionLabels = {
    'user.role_change': 'Role Changed',
    'user.verify': 'Verified',
    'user.unverify': 'Unverified',
    'user.ban': 'Banned',
    'user.unban': 'Unbanned',
    'user.suspend': 'Suspended',
    'user.unsuspend': 'Unsuspended',
    'user.restrict': 'Restricted',
    'security.session.revoke': 'Session Revoked',
    'security.session.revoke_all': 'All Sessions Revoked',
    'security.2fa.enable': '2FA Enabled',
    'security.2fa.disable': '2FA Disabled',
    'system.setting.update': 'Setting Updated',
    'system.settings.bulk_update': 'Settings Bulk Updated',
    'system.feature.toggle': 'Feature Toggled',
    'system.maintenance.toggle': 'Maintenance Toggled',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">Permission Change Log</h3>
        <Button size="sm" variant="ghost" onClick={fetchData}>Refresh</Button>
      </div>

      {loading ? <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div> : (
        <Card padding={false}>
          <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-jolshaa-surface-container-lowest">
                <tr className="border-b border-jolshaa-outline-variant">
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Admin</th>
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Action</th>
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Details</th>
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-jolshaa-outline-variant">
                {logs.map(log => (
                  <tr key={log._id} className="hover:bg-jolshaa-surface-container-low">
                    <td className="px-4 py-3">
                      <p className="font-medium text-jolshaa-on-surface">{log.admin?.name}</p>
                      <p className="text-xs text-jolshaa-on-surface-variant">{log.admin?.role}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="neutral" size="xs">{actionLabels[log.action] || log.action}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-jolshaa-on-surface-variant max-w-[250px] truncate">{JSON.stringify(log.details)}</td>
                    <td className="px-4 py-3 text-xs text-jolshaa-on-surface-variant">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {logs.length === 0 && <p className="text-center py-6 text-jolshaa-on-surface-variant text-sm">No permission changes logged</p>}
        </Card>
      )}
    </div>
  );
};

// --- Password Reset Panel ---
const PasswordResetPanel = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetModal, setResetModal] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/admins');
      setAdmins(res.data.admins);
    } catch (err) { console.error('Failed'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleReset = async () => {
    if (!newPassword || newPassword.length < 6) return alert('Password must be at least 6 characters');
    try {
      await API.post(`/admin/security/reset-password/${resetModal._id}`, { newPassword });
      setResetModal(null);
      setNewPassword('');
      alert(`Password reset for ${resetModal.name}. All sessions revoked.`);
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">Admin Password Reset</h3>
        <Button size="sm" variant="ghost" onClick={fetchData}>Refresh</Button>
      </div>

      <Card>
        <p className="text-xs text-jolshaa-on-surface-variant mb-4">Reset an admin's password. This will revoke all their active sessions.</p>
      </Card>

      {loading ? <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div> : (
        <div className="grid gap-3 md:grid-cols-2">
          {admins.map(a => (
            <Card key={a._id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-jolshaa-on-surface">{a.name}</p>
                  <p className="text-xs text-jolshaa-on-surface-variant">{a.email}</p>
                </div>
                <Button size="xs" variant="danger" onClick={() => { setResetModal(a); setNewPassword(''); }}>
                  Reset Password
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {resetModal && (
        <Modal isOpen={!!resetModal} onClose={() => setResetModal(null)} title={`Reset Password: ${resetModal.name}`}>
          <div className="p-5 space-y-4">
            <p className="text-sm text-jolshaa-on-surface-variant">This will set a new password and revoke all active sessions for this admin.</p>
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setResetModal(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleReset}>Reset Password</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// --- Rate-Limit Abuse Panel ---
const RateLimitAbusePanel = () => {
  const [data, setData] = useState({ abuseReport: [], total: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/security/rate-limit-abuse');
      setData(res.data);
    } catch (err) { console.error('Failed'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const getRiskConfig = (level) => {
    if (level === 'high') return { color: 'red', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500 animate-pulse' };
    if (level === 'medium') return { color: 'amber', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' };
    return { color: 'green', bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-500' };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">Rate-Limit Abuse Review</h3>
        <Button size="sm" variant="ghost" onClick={fetchData}>Refresh</Button>
      </div>

      {loading ? <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div> : data.abuseReport.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-sm font-medium text-jolshaa-on-surface">All Clear</p>
            <p className="text-xs text-jolshaa-on-surface-variant mt-0.5">No rate-limit abuse detected</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.abuseReport.map(a => {
            const risk = getRiskConfig(a.riskLevel);
            return (
              <Card key={a.adminId} className={`${risk.bg} ${risk.border}`}>
                <div className="flex items-start gap-4">
                  {/* Risk Badge */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${risk.bg}`}>
                    <div className={`w-3 h-3 rounded-full ${risk.dot}`} />
                  </div>
                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium text-jolshaa-on-surface">{a.adminName}</p>
                      <Badge variant={a.riskLevel === 'high' ? 'danger' : a.riskLevel === 'medium' ? 'warning' : 'success'} size="xs">{a.riskLevel}</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-jolshaa-surface-container-lowest rounded p-2">
                        <p className="text-[10px] text-jolshaa-on-surface-variant">Total Failed</p>
                        <p className="text-sm font-bold text-jolshaa-on-surface">{a.totalFailed}</p>
                      </div>
                      <div className="bg-jolshaa-surface-container-lowest rounded p-2">
                        <p className="text-[10px] text-jolshaa-on-surface-variant">Last 24h</p>
                        <p className="text-sm font-bold text-amber-600">{a.failedLast24h}</p>
                      </div>
                      <div className={`rounded p-2 ${a.failedLastHour > 0 ? 'bg-red-100' : 'bg-jolshaa-surface-container-lowest'}`}>
                        <p className="text-[10px] text-jolshaa-on-surface-variant">Last Hour</p>
                        <p className={`text-sm font-bold ${a.failedLastHour > 0 ? 'text-red-600' : 'text-jolshaa-on-surface'}`}>{a.failedLastHour}</p>
                      </div>
                      <div className="bg-jolshaa-surface-container-lowest rounded p-2">
                        <p className="text-[10px] text-jolshaa-on-surface-variant">Attacker IPs</p>
                        <p className="text-sm font-bold text-jolshaa-on-surface">{a.uniqueAttackerIPs}</p>
                      </div>
                    </div>
                    {a.lastFailed && (
                      <p className="text-[10px] text-jolshaa-on-surface-variant mt-2">Last failed: {new Date(a.lastFailed).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- Data Export Panel ---
const DataExportPanel = () => {
  const [data, setData] = useState({ restrictions: [], total: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/security/data-export');
      setData(res.data);
    } catch (err) { console.error('Failed'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleExport = async (userId, name) => {
    try {
      const res = await API.get(`/admin/security/export-user/${userId}`);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name.replace(/\s+/g, '_')}_export.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { alert('Failed to export'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">Data Export</h3>
        <Button size="sm" variant="ghost" onClick={fetchData}>Refresh</Button>
      </div>

      <Card>
        <p className="text-xs text-jolshaa-on-surface-variant">Export user data for compliance (GDPR/CCPA). Only superadmin can export admin data.</p>
      </Card>

      {loading ? <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div> : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-jolshaa-outline-variant">
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">User</th>
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Role</th>
                  <th className="text-right px-4 py-3 font-medium text-jolshaa-on-surface-variant">Posts</th>
                  <th className="text-right px-4 py-3 font-medium text-jolshaa-on-surface-variant">Messages</th>
                  <th className="text-right px-4 py-3 font-medium text-jolshaa-on-surface-variant">Comments</th>
                  <th className="text-right px-4 py-3 font-medium text-jolshaa-on-surface-variant">Est. Size</th>
                  <th className="text-right px-4 py-3 font-medium text-jolshaa-on-surface-variant">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-jolshaa-outline-variant">
                {data.restrictions.map(u => (
                  <tr key={u.userId} className="hover:bg-jolshaa-surface-container-low">
                    <td className="px-4 py-3">
                      <p className="font-medium text-jolshaa-on-surface">{u.name}</p>
                      <p className="text-xs text-jolshaa-on-surface-variant">{u.email}</p>
                    </td>
                    <td className="px-4 py-3"><Badge variant={u.role === 'superadmin' ? 'danger' : u.role === 'admin' ? 'primary' : 'neutral'} size="xs">{u.role}</Badge></td>
                    <td className="px-4 py-3 text-right text-xs">{u.postCount}</td>
                    <td className="px-4 py-3 text-right text-xs">{u.messageCount}</td>
                    <td className="px-4 py-3 text-right text-xs">{u.commentCount}</td>
                    <td className="px-4 py-3 text-right text-xs">{u.estimatedSizeMB} MB</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="xs" variant="ghost" onClick={() => handleExport(u.userId, u.name)} disabled={!u.canExport}>
                        Export
                      </Button>
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

// ============================================================
// SUPPORT TAB
// ============================================================

const SupportTab = () => {
  const [subTab, setSubTab] = useState('overview');

  const subTabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'tickets', label: 'Tickets' },
    { key: 'contact', label: 'Contact Inbox' },
    { key: 'feedback', label: 'Feedback' },
    { key: 'recovery', label: 'Recovery' },
    { key: 'email', label: 'Email/SMS' },
    { key: 'faq', label: 'FAQ' },
    { key: 'merge', label: 'Merge Users' },
  ];

  return (
    <div className="space-y-4">
      <Tabs tabs={subTabs} activeTab={subTab} onChange={setSubTab} className="mb-4" />
      {subTab === 'overview' && <SupportOverviewPanel />}
      {subTab === 'tickets' && <TicketsPanel />}
      {subTab === 'contact' && <ContactInboxPanel />}
      {subTab === 'feedback' && <FeedbackPanel />}
      {subTab === 'recovery' && <RecoveryPanel />}
      {subTab === 'email' && <EmailDeliveryPanel />}
      {subTab === 'faq' && <FAQPanel />}
      {subTab === 'merge' && <MergeUsersPanel />}
    </div>
  );
};

// --- Support Overview ---
const SupportOverviewPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/support/dashboard').then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;
  if (!data) return null;

  const cards = [
    { label: 'Open Tickets', value: data.openTickets, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Recovery', value: data.pendingRecovery, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Unread Contact', value: data.unreadContact, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'New Feedback', value: data.newFeedback, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Failed Emails (24h)', value: data.failedEmails, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Resolved Today', value: data.resolvedToday, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map(c => (
          <Card key={c.label} className={c.bg}>
            <p className="text-xs font-medium text-jolshaa-on-surface-variant">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          </Card>
        ))}
      </div>

      {data.recentTickets?.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Recent Tickets</h3>
          <div className="space-y-2">
            {data.recentTickets.map(t => (
              <div key={t._id} className="flex items-center gap-3 text-xs">
                <Badge variant={t.status === 'open' ? 'warning' : t.status === 'in_progress' ? 'primary' : 'success'} size="xs">{t.status}</Badge>
                <span className="font-medium text-jolshaa-on-surface flex-1">{t.subject}</span>
                <span className="text-jolshaa-on-surface-variant">{t.user?.name}</span>
                <span className="text-jolshaa-on-surface-variant">{new Date(t.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

// --- Tickets Panel ---
const TicketsPanel = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState('');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = filter ? `?status=${filter}` : '';
      const res = await API.get(`/admin/support/tickets${params}`);
      setTickets(res.data.tickets);
    } catch (err) { console.error('Failed'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchTickets(); }, [filter]);

  const handleUpdate = async (id, updates) => {
    try {
      const res = await API.put(`/admin/support/tickets/${id}`, updates);
      setTickets(prev => prev.map(t => t._id === id ? res.data.ticket : t));
      if (selected?._id === id) setSelected(res.data.ticket);
    } catch (err) { alert('Failed'); }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selected) return;
    try {
      const res = await API.post(`/admin/support/tickets/${selected._id}/reply`, { message: replyText });
      setSelected(res.data.ticket);
      setReplyText('');
    } catch (err) { alert('Failed'); }
  };

  const priorityColors = { low: 'neutral', medium: 'warning', high: 'danger', urgent: 'danger' };
  const statusColors = { open: 'warning', in_progress: 'primary', waiting_user: 'neutral', resolved: 'success', closed: 'neutral' };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        {['', 'open', 'in_progress', 'waiting_user', 'resolved', 'closed'].map(s => (
          <Button key={s} variant={filter === s ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter(s)}>
            {s || 'All'}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={fetchTickets} className="ml-auto">Refresh</Button>
      </div>

      {loading ? <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div> : tickets.length === 0 ? (
        <div className="text-center py-12 text-jolshaa-on-surface-variant">No tickets</div>
      ) : (
        <div className="space-y-2">
          {tickets.map(t => (
            <Card key={t._id} className={selected?._id === t._id ? 'ring-2 ring-jolshaa-teal' : ''} onClick={() => setSelected(t)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={statusColors[t.status]} size="xs">{t.status}</Badge>
                    <Badge variant={priorityColors[t.priority]} size="xs">{t.priority}</Badge>
                    <Badge variant="neutral" size="xs">{t.category}</Badge>
                  </div>
                  <p className="text-sm font-medium text-jolshaa-on-surface">{t.subject}</p>
                  <p className="text-xs text-jolshaa-on-surface-variant mt-1">{t.user?.name} - {new Date(t.createdAt).toLocaleString()}</p>
                  {t.assignedTo && <p className="text-xs text-jolshaa-on-surface-variant">Assigned: {t.assignedTo.name}</p>}
                </div>
                <div className="flex gap-1">
                  <select
                    value={t.status}
                    onChange={e => { e.stopPropagation(); handleUpdate(t._id, { status: e.target.value }); }}
                    className="text-xs border border-jolshaa-outline-variant rounded px-2 py-1 bg-jolshaa-surface-container-lowest"
                    onClick={e => e.stopPropagation()}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="waiting_user">Waiting User</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <Card>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold font-display text-jolshaa-on-surface">{selected.subject}</h4>
              <Button size="xs" variant="ghost" onClick={() => setSelected(null)}>Close</Button>
            </div>
            <p className="text-xs text-jolshaa-on-surface-variant">From: {selected.user?.name} ({selected.user?.email})</p>
            <p className="text-sm text-jolshaa-on-surface-variant">{selected.description}</p>

            {selected.messages?.length > 0 && (
              <div className="space-y-2 mt-4 border-t border-jolshaa-outline-variant pt-3">
                {selected.messages.map((m, i) => (
                  <div key={i} className={`p-2 rounded text-xs ${m.senderType === 'admin' ? 'bg-jolshaa-teal-container ml-8' : 'bg-jolshaa-surface-container-low mr-8'}`}>
                    <p className="font-medium">{m.senderType === 'admin' ? 'Admin' : 'User'}</p>
                    <p className="text-jolshaa-on-surface-variant mt-1">{m.message}</p>
                    <p className="text-jolshaa-on-surface-variant mt-1">{new Date(m.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input placeholder="Type a reply..." value={replyText} onChange={e => setReplyText(e.target.value)} className="flex-1" />
              <Button onClick={handleReply} disabled={!replyText.trim()}>Reply</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

// --- Contact Inbox Panel ---
const ContactInboxPanel = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('unread');
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState('');

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const params = filter ? `?status=${filter}` : '';
      const res = await API.get(`/admin/support/contact${params}`);
      setMessages(res.data.messages);
    } catch (err) { console.error('Failed'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchMessages(); }, [filter]);

  const handleReply = async () => {
    if (!replyText.trim() || !selected) return;
    try {
      const res = await API.put(`/admin/support/contact/${selected._id}`, { replyMessage: replyText, status: 'replied' });
      setMessages(prev => prev.map(m => m._id === selected._id ? res.data.message : m));
      setSelected(null);
      setReplyText('');
    } catch (err) { alert('Failed'); }
  };

  const handleStatus = async (id, status) => {
    try {
      const res = await API.put(`/admin/support/contact/${id}`, { status });
      setMessages(prev => prev.map(m => m._id === id ? res.data.message : m));
    } catch (err) { alert('Failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        {['unread', 'read', 'replied', 'archived', ''].map(s => (
          <Button key={s} variant={filter === s ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter(s)}>
            {s || 'All'}
          </Button>
        ))}
      </div>

      {loading ? <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div> : messages.length === 0 ? (
        <div className="text-center py-12 text-jolshaa-on-surface-variant">No messages</div>
      ) : (
        <div className="space-y-2">
          {messages.map(m => (
            <Card key={m._id} className={m.status === 'unread' ? 'border-l-4 border-l-jolshaa-teal' : ''}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1" onClick={() => { setSelected(m); handleStatus(m._id, m.status === 'unread' ? 'read' : m.status); }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={m.status === 'unread' ? 'primary' : m.status === 'replied' ? 'success' : 'neutral'} size="xs">{m.status}</Badge>
                    <Badge variant="neutral" size="xs">{m.category}</Badge>
                    <span className="text-xs text-jolshaa-on-surface-variant">{m.email}</span>
                  </div>
                  <p className="text-sm font-medium text-jolshaa-on-surface">{m.subject}</p>
                  <p className="text-xs text-jolshaa-on-surface-variant mt-1">{m.name} - {new Date(m.createdAt).toLocaleString()}</p>
                  <p className="text-xs text-jolshaa-on-surface-variant mt-1 line-clamp-2">{m.message}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="xs" variant="ghost" onClick={() => setSelected(m)}>View</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected.subject}>
          <div className="p-5 space-y-3">
            <div className="text-xs space-y-1">
              <p><span className="text-jolshaa-on-surface-variant">From:</span> {selected.name} ({selected.email})</p>
              <p><span className="text-jolshaa-on-surface-variant">Category:</span> {selected.category}</p>
              <p><span className="text-jolshaa-on-surface-variant">Date:</span> {new Date(selected.createdAt).toLocaleString()}</p>
            </div>
            <div className="p-3 bg-jolshaa-surface-container-low rounded text-sm text-jolshaa-on-surface-variant">{selected.message}</div>
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Type a reply..."
              className="w-full border border-jolshaa-outline-variant rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest resize-none"
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setSelected(null)}>Cancel</Button>
              <Button onClick={handleReply} disabled={!replyText.trim()}>Send Reply</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// --- Feedback Panel ---
const FeedbackPanel = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set('status', filter);
      if (typeFilter) params.set('type', typeFilter);
      const res = await API.get(`/admin/support/feedback?${params}`);
      setFeedback(res.data.feedback);
    } catch (err) { console.error('Failed'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchFeedback(); }, [filter, typeFilter]);

  const handleUpdate = async (id, updates) => {
    try {
      const res = await API.put(`/admin/support/feedback/${id}`, updates);
      setFeedback(prev => prev.map(f => f._id === id ? res.data.feedback : f));
    } catch (err) { alert('Failed'); }
  };

  const typeColors = { bug: 'danger', feature_request: 'primary', improvement: 'primary', complaint: 'warning', praise: 'success', other: 'neutral' };
  const statusColors = { new: 'warning', reviewing: 'primary', planned: 'neutral', in_progress: 'primary', completed: 'success', declined: 'neutral' };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        {['', 'new', 'reviewing', 'planned', 'completed', 'declined'].map(s => (
          <Button key={s} variant={filter === s ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter(s)}>
            {s || 'All'}
          </Button>
        ))}
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="text-xs border border-jolshaa-outline-variant rounded px-2 py-1 bg-jolshaa-surface-container-lowest">
          <option value="">All Types</option>
          <option value="bug">Bug</option>
          <option value="feature_request">Feature Request</option>
          <option value="improvement">Improvement</option>
          <option value="complaint">Complaint</option>
          <option value="praise">Praise</option>
        </select>
      </div>

      {loading ? <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div> : feedback.length === 0 ? (
        <div className="text-center py-12 text-jolshaa-on-surface-variant">No feedback</div>
      ) : (
        <div className="space-y-2">
          {feedback.map(f => (
            <Card key={f._id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={typeColors[f.type]} size="xs">{f.type.replace(/_/g, ' ')}</Badge>
                    <Badge variant={statusColors[f.status]} size="xs">{f.status}</Badge>
                    {f.rating && <span className="text-xs text-amber-500">{'★'.repeat(f.rating)}</span>}
                  </div>
                  <p className="text-sm font-medium text-jolshaa-on-surface">{f.title}</p>
                  <p className="text-xs text-jolshaa-on-surface-variant mt-1">{f.user?.name || 'Anonymous'} - {new Date(f.createdAt).toLocaleString()}</p>
                  <p className="text-xs text-jolshaa-on-surface-variant mt-1 line-clamp-2">{f.description}</p>
                </div>
                <select
                  value={f.status}
                  onChange={e => handleUpdate(f._id, { status: e.target.value })}
                  className="text-xs border border-jolshaa-outline-variant rounded px-2 py-1 bg-jolshaa-surface-container-lowest"
                >
                  <option value="new">New</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="declined">Declined</option>
                </select>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Recovery Panel ---
const RecoveryPanel = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selected, setSelected] = useState(null);
  const [adminNote, setAdminNote] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = filter ? `?status=${filter}` : '';
      const res = await API.get(`/admin/support/recovery${params}`);
      setRequests(res.data.requests);
    } catch (err) { console.error('Failed'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchRequests(); }, [filter]);

  const handleAction = async (status) => {
    if (!selected) return;
    try {
      const res = await API.put(`/admin/support/recovery/${selected._id}`, { status, adminNote });
      setRequests(prev => prev.map(r => r._id === selected._id ? res.data.request : r));
      setSelected(null);
      setAdminNote('');
    } catch (err) { alert('Failed'); }
  };

  const typeLabels = { password_reset: 'Password Reset', email_change: 'Email Change', account_unlock: 'Account Unlock', identity_verification: 'Identity Verification', other: 'Other' };
  const statusColors = { pending: 'warning', approved: 'success', rejected: 'danger', expired: 'neutral' };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['pending', 'approved', 'rejected', 'expired', ''].map(s => (
          <Button key={s} variant={filter === s ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter(s)}>
            {s || 'All'}
          </Button>
        ))}
      </div>

      {loading ? <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div> : requests.length === 0 ? (
        <div className="text-center py-12 text-jolshaa-on-surface-variant">No requests</div>
      ) : (
        <div className="space-y-2">
          {requests.map(r => (
            <Card key={r._id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={statusColors[r.status]} size="xs">{r.status}</Badge>
                    <Badge variant="neutral" size="xs">{typeLabels[r.type]}</Badge>
                  </div>
                  <p className="text-sm font-medium text-jolshaa-on-surface">{r.user?.name}</p>
                  <p className="text-xs text-jolshaa-on-surface-variant">{r.user?.email}</p>
                  <p className="text-xs text-jolshaa-on-surface-variant mt-1">{r.reason}</p>
                  {r.adminNote && <p className="text-xs text-jolshaa-teal mt-1">Admin: {r.adminNote}</p>}
                </div>
                {r.status === 'pending' && (
                  <div className="flex gap-1">
                    <Button size="xs" variant="ghost" onClick={() => setSelected(r)}>Review</Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Review Recovery Request">
          <div className="p-5 space-y-4">
            <div className="text-xs space-y-1">
              <p><span className="text-jolshaa-on-surface-variant">User:</span> {selected.user?.name} ({selected.user?.email})</p>
              <p><span className="text-jolshaa-on-surface-variant">Type:</span> {typeLabels[selected.type]}</p>
              <p><span className="text-jolshaa-on-surface-variant">Reason:</span> {selected.reason}</p>
              <p><span className="text-jolshaa-on-surface-variant">Requested:</span> {new Date(selected.createdAt).toLocaleString()}</p>
            </div>
            <Input label="Admin Note" value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Optional note..." />
            <div className="flex justify-end gap-2">
              <Button variant="danger" onClick={() => handleAction('rejected')}>Reject</Button>
              <Button variant="success" onClick={() => handleAction('approved')}>Approve</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// --- Email Delivery Panel ---
const EmailDeliveryPanel = () => {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    Promise.all([
      API.get('/admin/support/email-delivery/stats'),
      API.get(`/admin/support/email-delivery${filter ? `?status=${filter}` : ''}`),
    ]).then(([s, l]) => { setStats(s.data); setLogs(l.data.logs); }).finally(() => setLoading(false));
  }, [filter]);

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;

  return (
    <div className="space-y-4">
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Card><p className="text-xs text-jolshaa-on-surface-variant">Total</p><p className="text-xl font-bold text-jolshaa-on-surface">{stats.total}</p></Card>
          <Card><p className="text-xs text-jolshaa-on-surface-variant">Sent</p><p className="text-xl font-bold text-blue-600">{stats.sent}</p></Card>
          <Card><p className="text-xs text-jolshaa-on-surface-variant">Delivered</p><p className="text-xl font-bold text-green-600">{stats.delivered}</p></Card>
          <Card><p className="text-xs text-jolshaa-on-surface-variant">Failed</p><p className="text-xl font-bold text-red-600">{stats.failed}</p></Card>
          <Card><p className="text-xs text-jolshaa-on-surface-variant">Bounced</p><p className="text-xl font-bold text-amber-600">{stats.bounced}</p></Card>
          <Card><p className="text-xs text-jolshaa-on-surface-variant">Last 24h</p><p className="text-xl font-bold text-jolshaa-teal">{stats.last24h}</p></Card>
        </div>
      )}

      {stats?.recentErrors?.length > 0 && (
        <Card>
          <h4 className="font-display text-xs font-semibold text-jolshaa-on-surface-variant mb-2">Recent Errors</h4>
          <div className="space-y-1">
            {stats.recentErrors.map((e, i) => (
              <div key={i} className="text-xs flex items-center gap-2">
                <Badge variant="danger" size="xs">{e.template}</Badge>
                <span className="text-jolshaa-on-surface-variant">{e.to}</span>
                <span className="text-red-500 flex-1 truncate">{e.error}</span>
                <span className="text-jolshaa-on-surface-variant">{new Date(e.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex gap-2">
        {['', 'sent', 'delivered', 'failed', 'bounced'].map(s => (
          <Button key={s} variant={filter === s ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter(s)}>
            {s || 'All'}
          </Button>
        ))}
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto max-h-[40vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-jolshaa-surface-container-lowest">
              <tr className="border-b border-jolshaa-outline-variant">
                <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Type</th>
                <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">To</th>
                <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Subject</th>
                <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Status</th>
                <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Template</th>
                <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-jolshaa-outline-variant">
              {logs.map(log => (
                <tr key={log._id} className="hover:bg-jolshaa-surface-container-low">
                  <td className="px-4 py-3"><Badge variant={log.type === 'email' ? 'primary' : log.type === 'sms' ? 'success' : 'neutral'} size="xs">{log.type}</Badge></td>
                  <td className="px-4 py-3 text-xs">{log.to}</td>
                  <td className="px-4 py-3 text-xs max-w-[200px] truncate">{log.subject || '-'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={log.status === 'delivered' ? 'success' : log.status === 'failed' ? 'danger' : log.status === 'bounced' ? 'warning' : 'neutral'} size="xs">{log.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-jolshaa-on-surface-variant">{log.template}</td>
                  <td className="px-4 py-3 text-xs text-jolshaa-on-surface-variant">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// --- FAQ Panel ---
const FAQPanel = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ question: '', answer: '', category: 'general', order: 0, isVisible: true });

  const fetchFAQs = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/support/faq');
      setFaqs(res.data.faqs);
    } catch (err) { console.error('Failed'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchFAQs(); }, []);

  const handleSave = async () => {
    try {
      if (editItem) {
        await API.put(`/admin/support/faq/${editItem._id}`, form);
      } else {
        await API.post('/admin/support/faq', form);
      }
      setShowCreate(false);
      setEditItem(null);
      setForm({ question: '', answer: '', category: 'general', order: 0, isVisible: true });
      fetchFAQs();
    } catch (err) { alert('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this FAQ?')) return;
    try {
      await API.delete(`/admin/support/faq/${id}`);
      fetchFAQs();
    } catch (err) { alert('Failed'); }
  };

  const handleToggle = async (id, isVisible) => {
    try {
      await API.put(`/admin/support/faq/${id}`, { isVisible: !isVisible });
      fetchFAQs();
    } catch (err) { alert('Failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">FAQ Management</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={fetchFAQs}>Refresh</Button>
          <Button size="sm" onClick={() => { setShowCreate(true); setEditItem(null); setForm({ question: '', answer: '', category: 'general', order: 0, isVisible: true }); }}>
            Add FAQ
          </Button>
        </div>
      </div>

      {loading ? <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div> : faqs.length === 0 ? (
        <div className="text-center py-12 text-jolshaa-on-surface-variant">No FAQs yet</div>
      ) : (
        <div className="space-y-2">
          {faqs.map(f => (
            <Card key={f._id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={f.isVisible ? 'success' : 'neutral'} size="xs">{f.isVisible ? 'Visible' : 'Hidden'}</Badge>
                    <Badge variant="neutral" size="xs">{f.category}</Badge>
                    <span className="text-xs text-jolshaa-on-surface-variant">Order: {f.order}</span>
                  </div>
                  <p className="text-sm font-medium text-jolshaa-on-surface">{f.question}</p>
                  <p className="text-xs text-jolshaa-on-surface-variant mt-1 line-clamp-2">{f.answer}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="xs" variant="ghost" onClick={() => { setEditItem(f); setForm({ question: f.question, answer: f.answer, category: f.category, order: f.order, isVisible: f.isVisible }); setShowCreate(true); }}>Edit</Button>
                  <Button size="xs" variant="ghost" onClick={() => handleToggle(f._id, f.isVisible)}>{f.isVisible ? 'Hide' : 'Show'}</Button>
                  <Button size="xs" variant="danger" onClick={() => handleDelete(f._id)}>Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setEditItem(null); }} title={editItem ? 'Edit FAQ' : 'Create FAQ'}>
          <div className="p-5 space-y-3">
            <Input label="Question" value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} />
            <div>
              <label className="block text-xs font-medium text-jolshaa-on-surface-variant mb-1">Answer</label>
              <textarea value={form.answer} onChange={e => setForm(p => ({ ...p, answer: e.target.value }))} rows={4} className="w-full border border-jolshaa-outline-variant rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest resize-none" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-jolshaa-on-surface-variant mb-1">Category</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full border border-jolshaa-outline-variant rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest">
                  <option value="general">General</option>
                  <option value="account">Account</option>
                  <option value="features">Features</option>
                  <option value="privacy">Privacy</option>
                  <option value="safety">Safety</option>
                  <option value="billing">Billing</option>
                  <option value="technical">Technical</option>
                </select>
              </div>
              <div className="w-24">
                <Input label="Order" type="number" value={form.order} onChange={e => setForm(p => ({ ...p, order: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.isVisible} onChange={e => setForm(p => ({ ...p, isVisible: e.target.checked }))} className="rounded" />
              <label className="text-xs text-jolshaa-on-surface-variant">Visible to users</label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => { setShowCreate(false); setEditItem(null); }}>Cancel</Button>
              <Button onClick={handleSave}>{editItem ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// --- Merge Users Panel ---
const MergeUsersPanel = () => {
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState('email');
  const [mergeModal, setMergeModal] = useState(null);

  const fetchDuplicates = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/admin/support/duplicates?method=${method}`);
      setDuplicates(res.data.duplicates);
    } catch (err) { console.error('Failed'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchDuplicates(); }, [method]);

  const handleMerge = async (primaryId, secondaryId) => {
    if (!window.confirm('Merge these accounts? This cannot be undone.')) return;
    try {
      await API.post('/admin/support/merge', { primaryUserId: primaryId, secondaryUserId: secondaryId });
      fetchDuplicates();
      setMergeModal(null);
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">Duplicate Account Detection</h3>
        <div className="flex gap-2">
          <select value={method} onChange={e => setMethod(e.target.value)} className="text-xs border border-jolshaa-outline-variant rounded px-2 py-1 bg-jolshaa-surface-container-lowest">
            <option value="email">Similar Email</option>
            <option value="name">Same Name</option>
          </select>
          <Button size="sm" variant="ghost" onClick={fetchDuplicates}>Scan</Button>
        </div>
      </div>

      <Card>
        <p className="text-xs text-jolshaa-on-surface-variant">Find and merge duplicate accounts. The primary account will keep all data from both accounts.</p>
      </Card>

      {loading ? <div className="text-center py-8 text-jolshaa-on-surface-variant">Scanning...</div> : duplicates.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-sm text-jolshaa-on-surface-variant">No duplicates found</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {duplicates.map((group, i) => (
            <Card key={i}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-jolshaa-on-surface-variant">Match: {group._id} ({group.count} accounts)</p>
              </div>
              <div className="space-y-2">
                {group.users.map(u => (
                  <div key={u._id} className="flex items-center gap-3 text-xs p-2 bg-jolshaa-surface-container-low rounded">
                    <div className="flex-1">
                      <p className="font-medium text-jolshaa-on-surface">{u.name}</p>
                      <p className="text-jolshaa-on-surface-variant">{u.email}</p>
                    </div>
                    <span className="text-jolshaa-on-surface-variant">Joined: {new Date(u.createdAt).toLocaleDateString()}</span>
                    {u.isAdmin && <Badge variant="danger" size="xs">Admin</Badge>}
                  </div>
                ))}
              </div>
              {group.users.length === 2 && !group.users.some(u => u.isAdmin) && (
                <div className="flex gap-2 mt-3">
                  <Button size="xs" variant="ghost" onClick={() => handleMerge(group.users[0]._id, group.users[1]._id)}>
                    Merge into {group.users[0].name}
                  </Button>
                  <Button size="xs" variant="ghost" onClick={() => handleMerge(group.users[1]._id, group.users[0]._id)}>
                    Merge into {group.users[1].name}
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// CONTENT TOOLS TAB
// ============================================================

const ContentToolsTab = () => {
  const [subTab, setSubTab] = useState('overview');

  const subTabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'trending', label: 'Trending' },
    { key: 'hashtags', label: 'Hashtags' },
    { key: 'topics', label: 'Topics' },
    { key: 'pinned', label: 'Pinned' },
    { key: 'sponsored', label: 'Sponsored' },
    { key: 'featured', label: 'Featured' },
    { key: 'approvals', label: 'Approvals' },
    { key: 'recommendations', label: 'Recommendations' },
  ];

  return (
    <div className="space-y-4">
      <Tabs tabs={subTabs} activeTab={subTab} onChange={setSubTab} className="mb-4" />
      {subTab === 'overview' && <ContentOverviewPanel />}
      {subTab === 'trending' && <TrendingPanel />}
      {subTab === 'hashtags' && <HashtagsPanel />}
      {subTab === 'topics' && <TopicsPanel />}
      {subTab === 'pinned' && <PinnedPanel />}
      {subTab === 'sponsored' && <SponsoredPanel />}
      {subTab === 'featured' && <FeaturedPanel />}
      {subTab === 'approvals' && <ApprovalsPanel />}
      {subTab === 'recommendations' && <RecommendationsPanel />}
    </div>
  );
};

// --- Content Overview ---
const ContentOverviewPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/content/dashboard').then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;
  if (!data) return null;

  const cards = [
    { label: 'Total Posts', value: data.totalPosts, color: 'text-jolshaa-on-surface-variant', bg: 'bg-jolshaa-surface-container-low' },
    { label: 'Active Hashtags', value: data.totalHashtags, color: 'text-jolshaa-teal', bg: 'bg-jolshaa-teal/10' },
    { label: 'Trending Topics', value: data.trendingTopics, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pinned Posts', value: data.pinnedPosts, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Featured', value: data.featuredContent, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Pending Approvals', value: data.pendingApprovals, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Active Boosts', value: data.activeBoosts, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Active Ads', value: data.activeAds, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map(c => (
          <Card key={c.label} className={c.bg}>
            <p className="text-xs font-medium text-jolshaa-on-surface-variant">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.recentHashtags?.length > 0 && (
          <Card>
            <h3 className="font-display text-sm font-semibold text-jolshaa-on-surface mb-3">Top Hashtags</h3>
            <div className="space-y-2">
              {data.recentHashtags.map(h => (
                <div key={h._id} className="flex items-center justify-between text-xs">
                  <span className="text-jolshaa-teal font-medium">#{h.name}</span>
                  <span className="text-jolshaa-on-surface-variant">{h.postCount} posts</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {data.recentTopics?.length > 0 && (
          <Card>
            <h3 className="font-display text-sm font-semibold text-jolshaa-on-surface mb-3">Top Topics</h3>
            <div className="space-y-2">
              {data.recentTopics.map(t => (
                <div key={t._id} className="flex items-center justify-between text-xs">
                  <span className="text-jolshaa-on-surface font-medium">{t.displayName}</span>
                  <span className="text-jolshaa-on-surface-variant">Score: {t.trendingScore}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

// --- Trending Panel ---
const TrendingPanel = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/content/trending');
      setTopics(res.data.topics);
    } catch (err) { console.error('Failed'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchTopics(); }, []);

  const handleRecalculate = async () => {
    try {
      await API.post('/admin/content/trending/recalculate');
      fetchTopics();
    } catch (err) { alert('Failed'); }
  };

  const handleToggleTrending = async (id, isTrending) => {
    try {
      await API.put(`/admin/content/trending/${id}`, { isTrending: !isTrending });
      fetchTopics();
    } catch (err) { alert('Failed'); }
  };

  const handleUpdateScore = async (id, score) => {
    try {
      await API.put(`/admin/content/trending/${id}`, { trendingScore: parseInt(score) || 0 });
      fetchTopics();
    } catch (err) { alert('Failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-jolshaa-on-surface">Trending Topics</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={fetchTopics}>Refresh</Button>
          <Button size="sm" onClick={handleRecalculate}>Recalculate</Button>
        </div>
      </div>

      {loading ? <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div> : topics.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-jolshaa-on-surface-variant">
            <p className="text-sm">No topics yet. Create topics in the Topics tab first.</p>
          </div>
        </Card>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-jolshaa-outline-variant">
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Topic</th>
                  <th className="text-right px-4 py-3 font-medium text-jolshaa-on-surface-variant">Posts</th>
                  <th className="text-right px-4 py-3 font-medium text-jolshaa-on-surface-variant">Score</th>
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-jolshaa-on-surface-variant">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-jolshaa-outline-variant">
                {topics.map(t => (
                  <tr key={t._id} className="hover:bg-jolshaa-surface-container-low">
                    <td className="px-4 py-3">
                      <p className="font-medium text-jolshaa-on-surface">{t.displayName || t.name}</p>
                      <p className="text-xs text-jolshaa-on-surface-variant">{t.name}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-xs">{t.postCount}</td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        value={t.trendingScore}
                        onChange={e => handleUpdateScore(t._id, e.target.value)}
                        className="w-16 text-right text-xs border border-jolshaa-outline-variant rounded px-1 py-0.5 bg-jolshaa-surface-container-lowest"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={t.isTrending ? 'success' : 'neutral'} size="xs">{t.isTrending ? 'Trending' : 'Normal'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="xs" variant="ghost" onClick={() => handleToggleTrending(t._id, t.isTrending)}>
                        {t.isTrending ? 'Unset' : 'Set Trending'}
                      </Button>
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

// --- Hashtags Panel ---
const HashtagsPanel = () => {
  const [hashtags, setHashtags] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHashtags = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/content/hashtags');
      setHashtags(res.data.hashtags);
    } catch (err) { console.error('Failed'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchHashtags(); }, []);

  const handleSync = async () => {
    try {
      await API.post('/admin/content/hashtags/sync');
      fetchHashtags();
    } catch (err) { alert('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this hashtag?')) return;
    try {
      await API.delete(`/admin/content/hashtags/${id}`);
      fetchHashtags();
    } catch (err) { alert('Failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-jolshaa-on-surface">Hashtag Management</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={fetchHashtags}>Refresh</Button>
          <Button size="sm" onClick={handleSync}>Sync Counts</Button>
        </div>
      </div>

      {loading ? <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div> : (
        <Card padding={false}>
          <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-jolshaa-surface-container-lowest">
                <tr className="border-b border-jolshaa-outline-variant">
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Hashtag</th>
                  <th className="text-right px-4 py-3 font-medium text-jolshaa-on-surface-variant">Posts</th>
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Description</th>
                  <th className="text-right px-4 py-3 font-medium text-jolshaa-on-surface-variant">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-jolshaa-outline-variant">
                {hashtags.map(h => (
                  <tr key={h._id} className="hover:bg-jolshaa-surface-container-low">
                    <td className="px-4 py-3 font-medium text-jolshaa-teal">#{h.name}</td>
                    <td className="px-4 py-3 text-right text-xs">{h.postCount}</td>
                    <td className="px-4 py-3 text-xs text-jolshaa-on-surface-variant max-w-[200px] truncate">{h.description || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="xs" variant="danger" onClick={() => handleDelete(h._id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hashtags.length === 0 && <p className="text-center py-6 text-jolshaa-on-surface-variant text-sm">No hashtags found. Run Sync Counts to populate.</p>}
        </Card>
      )}
    </div>
  );
};

// --- Topics Panel ---
const TopicsPanel = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', displayName: '', description: '', keywords: '', order: 0 });

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/content/topics');
      setTopics(res.data.topics);
    } catch (err) { console.error('Failed'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchTopics(); }, []);

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean),
      };
      if (editItem) {
        await API.put(`/admin/content/topics/${editItem._id}`, payload);
      } else {
        await API.post('/admin/content/topics', payload);
      }
      setShowCreate(false);
      setEditItem(null);
      setForm({ name: '', displayName: '', description: '', keywords: '', order: 0 });
      fetchTopics();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this topic?')) return;
    try {
      await API.delete(`/admin/content/topics/${id}`);
      fetchTopics();
    } catch (err) { alert('Failed'); }
  };

  const handleToggle = async (id, isActive) => {
    try {
      await API.put(`/admin/content/topics/${id}`, { isActive: !isActive });
      fetchTopics();
    } catch (err) { alert('Failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-jolshaa-on-surface">Topic / Category Management</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={fetchTopics}>Refresh</Button>
          <Button size="sm" onClick={() => { setShowCreate(true); setEditItem(null); setForm({ name: '', displayName: '', description: '', keywords: '', order: 0 }); }}>
            Add Topic
          </Button>
        </div>
      </div>

      {loading ? <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div> : topics.length === 0 ? (
        <div className="text-center py-12 text-jolshaa-on-surface-variant">No topics yet</div>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-jolshaa-outline-variant">
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Topic</th>
                  <th className="text-right px-4 py-3 font-medium text-jolshaa-on-surface-variant">Posts</th>
                  <th className="text-right px-4 py-3 font-medium text-jolshaa-on-surface-variant">Followers</th>
                  <th className="text-right px-4 py-3 font-medium text-jolshaa-on-surface-variant">Order</th>
                  <th className="text-left px-4 py-3 font-medium text-jolshaa-on-surface-variant">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-jolshaa-on-surface-variant">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-jolshaa-outline-variant">
                {topics.map(t => (
                  <tr key={t._id} className="hover:bg-jolshaa-surface-container-low">
                    <td className="px-4 py-3">
                      <p className="font-medium text-jolshaa-on-surface">{t.displayName}</p>
                      <p className="text-xs text-jolshaa-on-surface-variant">{t.name}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-xs">{t.postCount}</td>
                    <td className="px-4 py-3 text-right text-xs">{t.followerCount}</td>
                    <td className="px-4 py-3 text-right text-xs">{t.order}</td>
                    <td className="px-4 py-3">
                      <Badge variant={t.isActive ? 'success' : 'neutral'} size="xs">{t.isActive ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="xs" variant="ghost" onClick={() => { setEditItem(t); setForm({ name: t.name, displayName: t.displayName, description: t.description || '', keywords: (t.keywords || []).join(', '), order: t.order }); setShowCreate(true); }}>Edit</Button>
                        <Button size="xs" variant="ghost" onClick={() => handleToggle(t._id, t.isActive)}>{t.isActive ? 'Disable' : 'Enable'}</Button>
                        <Button size="xs" variant="danger" onClick={() => handleDelete(t._id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showCreate && (
        <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setEditItem(null); }} title={editItem ? 'Edit Topic' : 'Create Topic'}>
          <div className="p-5 space-y-3">
            <Input label="Name (slug)" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. technology" disabled={!!editItem} />
            <Input label="Display Name" value={form.displayName} onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))} placeholder="e.g. Technology" />
            <Input label="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description" />
            <Input label="Keywords (comma separated)" value={form.keywords} onChange={e => setForm(p => ({ ...p, keywords: e.target.value }))} placeholder="ai, coding, software" />
            <Input label="Order" type="number" value={form.order} onChange={e => setForm(p => ({ ...p, order: parseInt(e.target.value) || 0 }))} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => { setShowCreate(false); setEditItem(null); }}>Cancel</Button>
              <Button onClick={handleSave}>{editItem ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// --- Pinned Panel ---
const PinnedPanel = () => {
  const [pinned, setPinned] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPinned = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/content/pinned');
      setPinned(res.data.pinned);
    } catch (err) { console.error('Failed'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchPinned(); }, []);

  const handleUnpin = async (id) => {
    if (!window.confirm('Unpin this post?')) return;
    try {
      await API.delete(`/admin/content/pinned/${id}`);
      fetchPinned();
    } catch (err) { alert('Failed'); }
  };

  const scopeColors = { global: 'danger', profile: 'primary', group: 'success', page: 'warning' };
  const scopeIcons = { global: '🌐', profile: '👤', group: '👥', page: '📄' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-semibold text-jolshaa-on-surface">Pinned Posts</h3>
          <p className="text-[10px] text-jolshaa-on-surface-variant">{pinned.length} pinned items</p>
        </div>
        <Button size="sm" variant="ghost" onClick={fetchPinned}>Refresh</Button>
      </div>

      {loading ? <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div> : pinned.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-sm text-jolshaa-on-surface-variant">No pinned posts</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {pinned.map((p, i) => (
            <Card key={p._id} className="hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-3">
                {/* Position number */}
                <div className="w-6 h-6 rounded bg-jolshaa-surface-container-low flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-jolshaa-on-surface-variant">{i + 1}</span>
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{scopeIcons[p.scope] || '📌'}</span>
                    <Badge variant={scopeColors[p.scope]} size="xs">{p.scope}</Badge>
                    {p.expiresAt && <Badge variant="warning" size="xs">Expires {new Date(p.expiresAt).toLocaleDateString()}</Badge>}
                  </div>
                  <p className="text-sm text-jolshaa-on-surface line-clamp-2">{p.post?.text || 'Media post'}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-jolshaa-on-surface-variant">
                    <span>By {p.post?.author?.name}</span>
                    <span>Pinned by {p.pinnedBy?.name}</span>
                    <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                  {p.reason && <p className="text-[10px] text-jolshaa-on-surface-variant mt-1 italic">"{p.reason}"</p>}
                </div>
                {/* Actions */}
                <Button size="xs" variant="danger" onClick={() => handleUnpin(p._id)}>Unpin</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Sponsored Panel ---
const SponsoredPanel = () => {
  const [ads, setAds] = useState([]);
  const [boosted, setBoosted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ads');

  useEffect(() => {
    Promise.all([
      API.get('/admin/content/sponsored'),
      API.get('/admin/content/boosted'),
    ]).then(([a, b]) => { setAds(a.data.ads); setBoosted(b.data.boosted); }).finally(() => setLoading(false));
  }, []);

  const handleReviewAd = async (id, status) => {
    try {
      await API.put(`/admin/content/sponsored/${id}/review`, { status });
      setAds(prev => prev.map(a => a._id === id ? { ...a, status } : a));
    } catch (err) { alert('Failed'); }
  };

  const handleReviewBoost = async (id, action) => {
    try {
      await API.put(`/admin/content/boosted/${id}/review`, { action });
      if (action === 'reject') setBoosted(prev => prev.filter(b => b._id !== id));
    } catch (err) { alert('Failed'); }
  };

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={tab === 'ads' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('ads')}>Ads ({ads.length})</Button>
        <Button variant={tab === 'boosts' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('boosts')}>Boosted Posts ({boosted.length})</Button>
      </div>

      {tab === 'ads' && (
        <div className="space-y-2">
          {ads.length === 0 ? <div className="text-center py-12 text-jolshaa-on-surface-variant">No ads</div> : ads.map(ad => (
            <Card key={ad._id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={ad.status === 'active' ? 'success' : ad.status === 'rejected' ? 'danger' : 'warning'} size="xs">{ad.status}</Badge>
                    <span className="text-xs text-jolshaa-on-surface-variant">Budget: ${ad.budget} | Spent: ${ad.spent || 0}</span>
                  </div>
                  <p className="text-sm font-medium text-jolshaa-on-surface">{ad.title}</p>
                  <p className="text-xs text-jolshaa-on-surface-variant">{ad.advertiser?.name} - {new Date(ad.createdAt).toLocaleDateString()}</p>
                </div>
                {ad.status === 'pending' && (
                  <div className="flex gap-1">
                    <Button size="xs" variant="danger" onClick={() => handleReviewAd(ad._id, 'rejected')}>Reject</Button>
                    <Button size="xs" variant="success" onClick={() => handleReviewAd(ad._id, 'active')}>Approve</Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'boosts' && (
        <div className="space-y-2">
          {boosted.length === 0 ? <div className="text-center py-12 text-jolshaa-on-surface-variant">No boosted posts</div> : boosted.map(b => (
            <Card key={b._id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <Badge variant="success" size="xs">Boosted</Badge>
                  <p className="text-sm text-jolshaa-on-surface mt-1">{b.text?.substring(0, 100) || 'Media post'}</p>
                  <p className="text-xs text-jolshaa-on-surface-variant mt-1">By {b.author?.name} - Ends: {new Date(b.boostEndsAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="xs" variant="danger" onClick={() => handleReviewBoost(b._id, 'reject')}>Remove Boost</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Featured Panel ---
const FeaturedPanel = () => {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ postId: '', category: 'editor_pick', title: '', description: '', priority: 0 });

  const fetchFeatured = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/content/featured');
      setFeatured(res.data.featured);
    } catch (err) { console.error('Failed'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchFeatured(); }, []);

  const handleAdd = async () => {
    if (!form.postId.trim()) return alert('Enter a post ID');
    try {
      await API.post('/admin/content/featured', form);
      setShowCreate(false);
      setForm({ postId: '', category: 'editor_pick', title: '', description: '', priority: 0 });
      fetchFeatured();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleToggle = async (id, isActive) => {
    try {
      await API.put(`/admin/content/featured/${id}`, { isActive: !isActive });
      fetchFeatured();
    } catch (err) { alert('Failed'); }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Remove from featured?')) return;
    try {
      await API.delete(`/admin/content/featured/${id}`);
      fetchFeatured();
    } catch (err) { alert('Failed'); }
  };

  const categoryColors = { editor_pick: 'primary', trending: 'success', community: 'warning', breaking: 'danger', promoted: 'neutral', custom: 'neutral' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-jolshaa-on-surface">Featured Content Control</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={fetchFeatured}>Refresh</Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>Add Featured</Button>
        </div>
      </div>

      {loading ? <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div> : featured.length === 0 ? (
        <div className="text-center py-12 text-jolshaa-on-surface-variant">No featured content</div>
      ) : (
        <div className="space-y-2">
          {featured.map(f => (
            <Card key={f._id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={categoryColors[f.category]} size="xs">{f.category.replace(/_/g, ' ')}</Badge>
                    <Badge variant={f.isActive ? 'success' : 'neutral'} size="xs">{f.isActive ? 'Active' : 'Inactive'}</Badge>
                    <span className="text-xs text-jolshaa-on-surface-variant">Priority: {f.priority}</span>
                  </div>
                  {f.title && <p className="text-sm font-medium text-jolshaa-on-surface">{f.title}</p>}
                  <p className="text-xs text-jolshaa-on-surface-variant mt-1">{f.post?.text?.substring(0, 80) || 'Media post'} - By {f.post?.author?.name}</p>
                  <p className="text-xs text-jolshaa-on-surface-variant">Curated by {f.curatedBy?.name} - {new Date(f.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="xs" variant="ghost" onClick={() => handleToggle(f._id, f.isActive)}>{f.isActive ? 'Hide' : 'Show'}</Button>
                  <Button size="xs" variant="danger" onClick={() => handleRemove(f._id)}>Remove</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Featured Content">
          <div className="p-5 space-y-3">
            <Input label="Post ID" value={form.postId} onChange={e => setForm(p => ({ ...p, postId: e.target.value }))} placeholder="Enter post ID" />
            <div>
              <label className="block text-xs font-medium text-jolshaa-on-surface mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full border border-jolshaa-outline-variant rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest">
                <option value="editor_pick">Editor's Pick</option>
                <option value="trending">Trending</option>
                <option value="community">Community</option>
                <option value="breaking">Breaking</option>
                <option value="promoted">Promoted</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <Input label="Title (optional)" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            <Input label="Description (optional)" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            <Input label="Priority" type="number" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: parseInt(e.target.value) || 0 }))} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleAdd}>Add</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// --- Approvals Panel ---
const ApprovalsPanel = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [adminNotes, setAdminNotes] = useState({});
  const [actionLoading, setActionLoading] = useState(null);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const params = filter ? `?type=${filter}` : '';
      const res = await API.get(`/admin/content/approvals${params}`);
      setApprovals(res.data.approvals);
    } catch (err) { console.error('Failed'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchApprovals(); }, [filter]);

  const handleAction = async (id, status) => {
    setActionLoading(id);
    try {
      await API.put(`/admin/content/approvals/${id}`, { status, adminNote: adminNotes[id] || '' });
      setApprovals(prev => prev.map(a => a._id === id ? { ...a, status } : a));
      setAdminNotes(prev => { const n = { ...prev }; delete n[id]; return n; });
    } catch (err) { alert('Failed'); }
    setActionLoading(null);
  };

  const typeLabels = { ad: 'Ad Review', boost: 'Boost Review', page_verification: 'Page Verification', group_creation: 'Group Creation', sponsored_post: 'Sponsored Post' };
  const typeIcons = { ad: '📢', boost: '🚀', page_verification: '✓', group_creation: '👥', sponsored_post: '💰' };
  const statusColors = { pending: 'warning', approved: 'success', rejected: 'danger', needs_info: 'primary' };

  const pendingCount = approvals.filter(a => a.status === 'pending').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-semibold text-jolshaa-on-surface">Approval Queue</h3>
          <p className="text-[10px] text-jolshaa-on-surface-variant">{pendingCount} pending review</p>
        </div>
        <div className="flex gap-1 bg-jolshaa-surface-container-low rounded-lg p-0.5">
          {[
            { key: '', label: 'All' },
            { key: 'ad', label: 'Ads' },
            { key: 'boost', label: 'Boosts' },
            { key: 'page_verification', label: 'Pages' },
            { key: 'group_creation', label: 'Groups' },
          ].map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)} className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${filter === t.key ? 'bg-jolshaa-surface-container-lowest text-jolshaa-on-surface shadow-sm' : 'text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface'}`}>{t.label}</button>
          ))}
        </div>
      </div>

      {loading ? <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div> : approvals.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-sm font-medium text-jolshaa-on-surface">Queue clear</p>
            <p className="text-xs text-jolshaa-on-surface-variant">No pending approvals</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {approvals.map(a => (
            <Card key={a._id} className={a.status === 'pending' ? 'border-l-4 border-l-amber-400' : a.status === 'approved' ? 'border-l-4 border-l-green-400' : a.status === 'rejected' ? 'border-l-4 border-l-red-400' : ''}>
              <div className="flex items-start gap-3">
                {/* Type Icon */}
                <div className="w-8 h-8 rounded-lg bg-jolshaa-surface-container-low flex items-center justify-center flex-shrink-0 text-sm">{typeIcons[a.type] || '📄'}</div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={statusColors[a.status]} size="xs">{a.status}</Badge>
                    <Badge variant="neutral" size="xs">{typeLabels[a.type]}</Badge>
                    {a.target?.name && <span className="text-xs font-medium text-jolshaa-on-surface truncate">{a.target.name}</span>}
                  </div>
                  <p className="text-xs text-jolshaa-on-surface-variant">by {a.submittedBy?.name} &middot; {new Date(a.createdAt).toLocaleString()}</p>
                  {a.status === 'pending' && (
                    <div className="mt-2 space-y-2">
                      <input type="text" placeholder="Admin note (optional)" value={adminNotes[a._id] || ''} onChange={e => setAdminNotes(prev => ({ ...prev, [a._id]: e.target.value }))} className="w-full text-xs border border-jolshaa-outline-variant rounded px-2 py-1.5 bg-jolshaa-surface-container-lowest focus:ring-2 focus:ring-jolshaa-teal" />
                      <div className="flex gap-1.5">
                        <Button size="xs" variant="danger" onClick={() => handleAction(a._id, 'rejected')} disabled={actionLoading === a._id}>{actionLoading === a._id ? '...' : 'Reject'}</Button>
                        <Button size="xs" variant="success" onClick={() => handleAction(a._id, 'approved')} disabled={actionLoading === a._id}>{actionLoading === a._id ? '...' : 'Approve'}</Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Recommendations Panel ---
const RecommendationsPanel = () => {
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/admin/content/recommendations/config'),
      API.get('/admin/content/recommendations/stats'),
    ]).then(([c, s]) => { setConfig(c.data.config); setStats(s.data); }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      await API.put('/admin/content/recommendations/config', config);
      alert('Config saved');
    } catch (err) { alert('Failed'); }
  };

  const handleChange = (section, key, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: { ...prev[section], [key]: parseFloat(value) || 0 },
    }));
  };

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-jolshaa-on-surface">Recommendations Tuning</h3>
        <Button size="sm" onClick={handleSave}>Save Config</Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><p className="text-xs text-jolshaa-on-surface-variant">Total Posts</p><p className="text-xl font-bold text-jolshaa-on-surface">{stats.totalPosts}</p></Card>
          <Card><p className="text-xs text-jolshaa-on-surface-variant">Boosted</p><p className="text-xl font-bold text-green-600">{stats.boostedPosts}</p></Card>
          <Card><p className="text-xs text-jolshaa-on-surface-variant">Featured</p><p className="text-xl font-bold text-purple-600">{stats.featuredPosts}</p></Card>
          <Card><p className="text-xs text-jolshaa-on-surface-variant">Active Topics</p><p className="text-xl font-bold text-blue-600">{stats.activeTopics}</p></Card>
        </div>
      )}

      {config && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h4 className="font-display text-xs font-semibold text-jolshaa-on-surface mb-3">Feed Ranker Weights</h4>
            <div className="space-y-2">
              {Object.entries(config.feedRanker).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <label className="w-40 text-jolshaa-on-surface-variant truncate">{key.replace(/([A-Z])/g, ' $1')}</label>
                  <input
                    type="number"
                    value={value}
                    onChange={e => handleChange('feedRanker', key, e.target.value)}
                    className="flex-1 border border-jolshaa-outline-variant rounded px-2 py-1 bg-jolshaa-surface-container-lowest text-right"
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h4 className="font-display text-xs font-semibold text-jolshaa-on-surface mb-3">Content Preferences</h4>
            <div className="space-y-2">
              {Object.entries(config.contentPreferences).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <label className="w-40 text-jolshaa-on-surface-variant truncate">{key.replace(/([A-Z])/g, ' $1')}</label>
                  <input
                    type="number"
                    value={value}
                    onChange={e => handleChange('contentPreferences', key, e.target.value)}
                    className="flex-1 border border-jolshaa-outline-variant rounded px-2 py-1 bg-jolshaa-surface-container-lowest text-right"
                    step="0.1"
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {stats?.topTopics?.length > 0 && (
        <Card>
          <h4 className="font-display text-xs font-semibold text-jolshaa-on-surface mb-2">Top Topics by Trending Score</h4>
          <div className="space-y-1.5">
            {stats.topTopics.map(t => (
              <div key={t._id} className="flex items-center justify-between text-xs">
                <span className="text-jolshaa-on-surface">{t.displayName}</span>
                <div className="flex items-center gap-3">
                  <span className="text-jolshaa-on-surface-variant">{t.postCount} posts</span>
                  <Badge variant="primary" size="xs">Score: {t.trendingScore}</Badge>
                </div>
              </div>
            ))}
          </div>
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
        <h3 className="font-display text-sm font-semibold text-jolshaa-on-surface mb-4">Bulk Content Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-jolshaa-on-surface mb-1">Content Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full border border-jolshaa-outline-variant rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest">
              <option value="post">Posts</option>
              <option value="comment">Comments</option>
              <option value="story">Stories</option>
              <option value="reel">Reels</option>
              <option value="listing">Listings</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-jolshaa-on-surface mb-1">Action</label>
            <select value={action} onChange={e => setAction(e.target.value)} className="w-full border border-jolshaa-outline-variant rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest">
              <option value="remove">Remove</option>
              <option value="flag">Flag</option>
              <option value="unflag">Unflag</option>
              <option value="hide">Hide</option>
              <option value="unhide">Unhide</option>
              <option value="approve">Approve</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-jolshaa-on-surface mb-1">IDs (comma separated)</label>
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

      <ShadowModerationSection />
    </div>
  );
};

const ShadowModerationSection = () => {
  const [shadowType, setShadowType] = useState('post');
  const [shadowId, setShadowId] = useState('');

  const handleShadowHide = async () => {
    if (!shadowId.trim()) return alert('Enter a content ID');
    try {
      await API.put(`/admin/moderation/${shadowType}/${shadowId.trim()}/shadow-hide`);
      alert('Content shadow hidden successfully');
      setShadowId('');
    } catch (err) { alert('Failed'); }
  };

  return (
    <Card>
      <h3 className="font-display text-sm font-semibold text-jolshaa-on-surface mb-2">Shadow Moderation</h3>
      <p className="text-xs text-jolshaa-on-surface-variant mb-4">Shadow hidden content is invisible to everyone except the author. The author still sees their own content but nobody else does.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-jolshaa-on-surface mb-1">Content Type</label>
          <select value={shadowType} onChange={e => setShadowType(e.target.value)} className="w-full border border-jolshaa-outline-variant rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest">
            <option value="post">Post</option>
            <option value="comment">Comment</option>
            <option value="story">Story</option>
            <option value="reel">Reel</option>
            <option value="listing">Listing</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-jolshaa-on-surface mb-1">Content ID</label>
          <Input placeholder="Enter content ID..." value={shadowId} onChange={e => setShadowId(e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button onClick={handleShadowHide} variant="danger">Shadow Hide</Button>
        </div>
      </div>
    </Card>
  );
};

// MonetizationTab is imported from components/admin/MonetizationTab.js

// ============================================================
// COMMUNITY MANAGEMENT
// ============================================================

const CommunityTab = () => {
  const [subTab, setSubTab] = useState('groups');

  const subTabs = [
    { key: 'groups', label: 'Groups' },
    { key: 'pages', label: 'Pages' },
    { key: 'events', label: 'Events' },
    { key: 'violations', label: 'Violations' },
    { key: 'automod', label: 'Auto-Moderation' },
    { key: 'keywords', label: 'Keyword Blacklist' },
    { key: 'links', label: 'Link Blacklist' },
    { key: 'media', label: 'Media Restrictions' },
  ];

  return (
    <div className="space-y-4">
      <Tabs tabs={subTabs} activeTab={subTab} onChange={setSubTab} className="mb-4" />
      {subTab === 'groups' && <GroupsPanel />}
      {subTab === 'pages' && <PagesPanel />}
      {subTab === 'events' && <EventsPanel />}
      {subTab === 'violations' && <ViolationsPanel />}
      {subTab === 'automod' && <AutoModPanel />}
      {subTab === 'keywords' && <KeywordsPanel />}
      {subTab === 'links' && <LinksPanel />}
      {subTab === 'media' && <MediaRestrictionsPanel />}
    </div>
  );
};

// --- Groups ---
const GroupsPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    API.get('/admin/community/groups/dashboard').then(res => setData(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-blue-50">
          <p className="text-xs text-jolshaa-on-surface-variant">Total Groups</p>
          <p className="text-2xl font-bold text-blue-600">{data.totalGroups}</p>
        </Card>
        <Card className="bg-amber-50">
          <p className="text-xs text-jolshaa-on-surface-variant">Pending Approval</p>
          <p className="text-2xl font-bold text-amber-600">{data.pendingGroups}</p>
        </Card>
        <Card className="bg-green-50">
          <p className="text-xs text-jolshaa-on-surface-variant">Public</p>
          <p className="text-2xl font-bold text-green-600">{data.publicGroups}</p>
        </Card>
        <Card className="bg-purple-50">
          <p className="text-xs text-jolshaa-on-surface-variant">Private</p>
          <p className="text-2xl font-bold text-purple-600">{data.privateGroups}</p>
        </Card>
      </div>

      <Card>
        <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-4">Recent Groups</h3>
        <div className="space-y-3">
          {data.recentGroups.map(group => (
            <div key={group._id} className="flex items-center justify-between p-3 bg-jolshaa-surface-container-low rounded-lg">
              <div className="flex items-center gap-3">
                {group.coverPhoto && <img src={group.coverPhoto} className="w-10 h-10 rounded-lg object-cover" alt="" />}
                <div>
                  <p className="font-medium">{group.name}</p>
                  <p className="text-xs text-jolshaa-on-surface-variant">by {group.creator?.name} &middot; {group.privacy}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={group.privacy === 'public' ? 'success' : 'warning'}>{group.privacy}</Badge>
                <Button size="sm" variant="danger" onClick={async () => {
                  if (!confirm('Delete this group?')) return;
                  await API.delete(`/admin/community/groups/${group._id}`);
                  fetchData();
                }}>Remove</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// --- Pages ---
const PagesPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    API.get('/admin/community/pages/dashboard').then(res => setData(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="bg-blue-50">
          <p className="text-xs text-jolshaa-on-surface-variant">Total Pages</p>
          <p className="text-2xl font-bold text-blue-600">{data.totalPages}</p>
        </Card>
        <Card className="bg-green-50">
          <p className="text-xs text-jolshaa-on-surface-variant">Verified</p>
          <p className="text-2xl font-bold text-green-600">{data.verifiedPages}</p>
        </Card>
        <Card className="bg-amber-50">
          <p className="text-xs text-jolshaa-on-surface-variant">Pending Verification</p>
          <p className="text-2xl font-bold text-amber-600">{data.pendingVerification}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Categories</h3>
          <div className="space-y-2">
            {data.categories.map(c => (
              <div key={c._id} className="flex justify-between text-sm">
                <span>{c._id}</span>
                <span className="text-jolshaa-on-surface-variant">{c.count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Recent Pages</h3>
          <div className="space-y-2">
            {data.recentPages.map(page => (
              <div key={page._id} className="flex items-center justify-between p-2 bg-jolshaa-surface-container-low rounded">
                <div>
                  <p className="text-sm font-medium">{page.name}</p>
                  <p className="text-xs text-jolshaa-on-surface-variant">{page.category}</p>
                </div>
                <div className="flex gap-1">
                  {!page.isVerified && (
                    <Button size="sm" onClick={async () => {
                      await API.put(`/admin/community/pages/${page._id}/verify`);
                      fetchData();
                    }}>Verify</Button>
                  )}
                  <Button size="sm" variant="danger" onClick={async () => {
                    if (!confirm('Delete this page?')) return;
                    await API.delete(`/admin/community/pages/${page._id}`);
                    fetchData();
                  }}>Remove</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// --- Events ---
const EventsPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    API.get('/admin/community/events/dashboard').then(res => setData(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-blue-50">
          <p className="text-xs text-jolshaa-on-surface-variant">Total Events</p>
          <p className="text-2xl font-bold text-blue-600">{data.totalEvents}</p>
        </Card>
        <Card className="bg-green-50">
          <p className="text-xs text-jolshaa-on-surface-variant">Upcoming</p>
          <p className="text-2xl font-bold text-green-600">{data.upcomingEvents}</p>
        </Card>
        <Card className="bg-jolshaa-surface-container-low">
          <p className="text-xs text-jolshaa-on-surface-variant">Past</p>
          <p className="text-2xl font-bold text-jolshaa-on-surface-variant">{data.pastEvents}</p>
        </Card>
      </div>

      <Card>
        <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-4">Recent Events</h3>
        <div className="space-y-3">
          {data.recentEvents.map(event => (
            <div key={event._id} className="flex items-center justify-between p-3 bg-jolshaa-surface-container-low rounded-lg">
              <div className="flex items-center gap-3">
                {event.coverPhoto && <img src={event.coverPhoto} className="w-10 h-10 rounded-lg object-cover" alt="" />}
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-xs text-jolshaa-on-surface-variant">by {event.creator?.name} &middot; {new Date(event.startDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={new Date(event.startDate) > new Date() ? 'success' : 'neutral'}>
                  {new Date(event.startDate) > new Date() ? 'Upcoming' : 'Past'}
                </Badge>
                <Button size="sm" onClick={async () => {
                  await API.post(`/admin/community/events/${event._id}/flag`, { reason: 'other', description: 'Flagged by admin' });
                  fetchData();
                }}>Flag</Button>
                <Button size="sm" variant="danger" onClick={async () => {
                  if (!confirm('Delete this event?')) return;
                  await API.delete(`/admin/community/events/${event._id}`);
                  fetchData();
                }}>Remove</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// --- Violations ---
const ViolationsPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    API.get('/admin/community/violations/dashboard').then(res => setData(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;
  if (!data) return null;

  const actionColors = { warn: 'warning', mute: 'neutral', ban: 'danger', remove: 'danger', flag: 'info', restrict: 'warning' };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Total Violations</p>
          <p className="text-2xl font-bold text-jolshaa-on-surface mt-1">{data.totalViolations}</p>
        </Card>
        <Card className={data.activeViolations > 0 ? 'border-red-200' : ''}>
          <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Active</p>
          <p className={`text-2xl font-bold mt-1 ${data.activeViolations > 0 ? 'text-red-600' : 'text-green-600'}`}>{data.activeViolations}</p>
        </Card>
      </div>

      {/* By Guideline */}
      {data.byGuideline?.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">By Guideline</h3>
          <div className="space-y-2">
            {data.byGuideline.map(g => {
              const max = data.byGuideline[0]?.count || 1;
              return (
                <div key={g._id} className="flex items-center gap-2 text-xs">
                  <span className="w-28 capitalize truncate">{g._id?.replace(/_/g, ' ')}</span>
                  <div className="flex-1 h-3 bg-jolshaa-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${(g.count / max) * 100}%` }} />
                  </div>
                  <span className="w-8 text-right font-medium text-jolshaa-on-surface-variant">{g.count}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Violation Timeline */}
      <Card>
        <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Violation Timeline</h3>
        <div className="space-y-0">
          {data.recentViolations?.length === 0 ? (
            <div className="text-center py-8 text-jolshaa-on-surface-variant text-sm">No recent violations</div>
          ) : data.recentViolations?.map((v, i) => (
            <div key={v._id} className="flex items-start gap-3 py-2 relative">
              {/* Timeline dot */}
              <div className="flex flex-col items-center">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${v.status === 'active' ? 'bg-red-500' : 'bg-green-500'}`} />
                {i < (data.recentViolations.length - 1) && <div className="w-0.5 h-full bg-jolshaa-outline-variant absolute left-[5px] top-3" />}
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-jolshaa-on-surface">{v.user?.name}</span>
                  <Badge variant={actionColors[v.action] || 'neutral'} size="xs">{v.action}</Badge>
                  <Badge variant={v.status === 'active' ? 'danger' : 'success'} size="xs">{v.status}</Badge>
                </div>
                <p className="text-[10px] text-jolshaa-on-surface-variant mt-0.5 capitalize">{v.guideline?.replace(/_/g, ' ')}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// --- Auto-Moderation ---
const AutoModPanel = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [automodName, setAutomodName] = useState('');
  const [automodAction, setAutomodAction] = useState('flag');
  const [automodTarget, setAutomodTarget] = useState('all');

  const fetchData = () => {
    setLoading(true);
    API.get('/admin/community/automod').then(res => setRules(res.data.rules)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">Auto-Moderation Rules</h3>
          <Button size="sm" onClick={() => setShowCreate(!showCreate)}>{showCreate ? 'Cancel' : 'Add Rule'}</Button>
        </div>

        {showCreate && (
          <div className="p-4 bg-jolshaa-surface-container-low rounded-lg mb-4 space-y-3">
            <Input placeholder="Rule name" value={automodName} onChange={e => setAutomodName(e.target.value)} />
            <select value={automodAction} onChange={e => setAutomodAction(e.target.value)} className="w-full text-sm border rounded px-3 py-2">
              <option value="flag">Flag</option>
              <option value="hide">Hide</option>
              <option value="remove">Remove</option>
              <option value="warn">Warn</option>
              <option value="mute">Mute</option>
              <option value="ban">Ban</option>
            </select>
            <select value={automodTarget} onChange={e => setAutomodTarget(e.target.value)} className="w-full text-sm border rounded px-3 py-2">
              <option value="all">All Content</option>
              <option value="post">Posts</option>
              <option value="comment">Comments</option>
              <option value="message">Messages</option>
            </select>
            <Button onClick={async () => {
              if (!automodName.trim()) return alert('Enter rule name');
              await API.post('/admin/community/automod', { name: automodName.trim(), action: automodAction, targetType: automodTarget });
              setShowCreate(false);
              setAutomodName('');
              fetchData();
            }}>Create Rule</Button>
          </div>
        )}

        <div className="space-y-2">
          {rules.map(rule => (
            <div key={rule._id} className="flex items-center justify-between p-3 bg-jolshaa-surface-container-low rounded-lg">
              <div>
                <p className="font-medium text-sm">{rule.name}</p>
                <p className="text-xs text-jolshaa-on-surface-variant">Action: {rule.action} &middot; Target: {rule.targetType} &middot; Hits: {rule.hitCount}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={rule.isActive ? 'success' : 'danger'}>{rule.isActive ? 'Active' : 'Inactive'}</Badge>
                <Button size="sm" onClick={async () => {
                  await API.put(`/admin/community/automod/${rule._id}/toggle`);
                  fetchData();
                }}>Toggle</Button>
                <Button size="sm" variant="danger" onClick={async () => {
                  if (!confirm('Delete rule?')) return;
                  await API.delete(`/admin/community/automod/${rule._id}`);
                  fetchData();
                }}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// --- Keyword Blacklist ---
const KeywordsPanel = () => {
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [kwSingle, setKwSingle] = useState('');
  const [kwBulk, setKwBulk] = useState('');
  const [kwCategory, setKwCategory] = useState('custom');
  const [kwAction, setKwAction] = useState('flag');

  const fetchData = () => {
    setLoading(true);
    API.get('/admin/community/keywords').then(res => setKeywords(res.data.keywords)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">Keyword Blacklist ({keywords.length})</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setBulkMode(!bulkMode)}>{bulkMode ? 'Single' : 'Bulk'}</Button>
            <Button size="sm" onClick={() => setShowAdd(!showAdd)}>{showAdd ? 'Cancel' : 'Add'}</Button>
          </div>
        </div>

        {showAdd && (
          <div className="p-4 bg-jolshaa-surface-container-low rounded-lg mb-4 space-y-3">
            {bulkMode ? (
              <textarea value={kwBulk} onChange={e => setKwBulk(e.target.value)} className="w-full text-sm border rounded px-3 py-2 h-24" placeholder="One keyword per line" />
            ) : (
              <Input placeholder="Keyword" value={kwSingle} onChange={e => setKwSingle(e.target.value)} />
            )}
            <select value={kwCategory} onChange={e => setKwCategory(e.target.value)} className="w-full text-sm border rounded px-3 py-2">
              <option value="custom">Custom</option>
              <option value="profanity">Profanity</option>
              <option value="slur">Slur</option>
              <option value="spam">Spam</option>
              <option value="harassment">Harassment</option>
              <option value="hate">Hate</option>
            </select>
            <select value={kwAction} onChange={e => setKwAction(e.target.value)} className="w-full text-sm border rounded px-3 py-2">
              <option value="flag">Flag</option>
              <option value="block">Block</option>
              <option value="replace">Replace</option>
            </select>
            <Button onClick={async () => {
              if (bulkMode) {
                const lines = kwBulk.split('\n').filter(l => l.trim());
                await API.post('/admin/community/keywords/bulk', { keywords: lines, category: kwCategory, action: kwAction });
              } else {
                if (!kwSingle.trim()) return alert('Enter keyword');
                await API.post('/admin/community/keywords', { keyword: kwSingle.trim(), category: kwCategory, action: kwAction });
              }
              setShowAdd(false);
              setKwSingle('');
              setKwBulk('');
              fetchData();
            }}>Add</Button>
          </div>
        )}

        <div className="space-y-2">
          {keywords.map(kw => (
            <div key={kw._id} className="flex items-center justify-between p-3 bg-jolshaa-surface-container-low rounded-lg">
              <div>
                <p className="font-medium text-sm">"{kw.keyword}"</p>
                <p className="text-xs text-jolshaa-on-surface-variant">Category: {kw.category} &middot; Action: {kw.action} &middot; Hits: {kw.hitCount}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={kw.isActive ? 'success' : 'danger'}>{kw.isActive ? 'Active' : 'Off'}</Badge>
                <Button size="sm" onClick={async () => {
                  await API.put(`/admin/community/keywords/${kw._id}/toggle`);
                  fetchData();
                }}>Toggle</Button>
                <Button size="sm" variant="danger" onClick={async () => {
                  await API.delete(`/admin/community/keywords/${kw._id}`);
                  fetchData();
                }}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// --- Link Blacklist ---
const LinksPanel = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [linkSingle, setLinkSingle] = useState('');
  const [linkBulk, setLinkBulk] = useState('');
  const [linkReason, setLinkReason] = useState('');
  const [linkSeverity, setLinkSeverity] = useState('medium');

  const fetchData = () => {
    setLoading(true);
    API.get('/admin/community/links').then(res => setLinks(res.data.links)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">Link Blacklist ({links.length})</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setBulkMode(!bulkMode)}>{bulkMode ? 'Single' : 'Bulk'}</Button>
            <Button size="sm" onClick={() => setShowAdd(!showAdd)}>{showAdd ? 'Cancel' : 'Add'}</Button>
          </div>
        </div>

        {showAdd && (
          <div className="p-4 bg-jolshaa-surface-container-low rounded-lg mb-4 space-y-3">
            {bulkMode ? (
              <textarea value={linkBulk} onChange={e => setLinkBulk(e.target.value)} className="w-full text-sm border rounded px-3 py-2 h-24" placeholder="One domain per line (e.g. spam.com)" />
            ) : (
              <Input placeholder="Domain (e.g. spam.com)" value={linkSingle} onChange={e => setLinkSingle(e.target.value)} />
            )}
            <Input placeholder="Reason (optional)" value={linkReason} onChange={e => setLinkReason(e.target.value)} />
            <select value={linkSeverity} onChange={e => setLinkSeverity(e.target.value)} className="w-full text-sm border rounded px-3 py-2">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <Button onClick={async () => {
              if (bulkMode) {
                const lines = linkBulk.split('\n').filter(l => l.trim());
                await API.post('/admin/community/links/bulk', { domains: lines, reason: linkReason, severity: linkSeverity });
              } else {
                if (!linkSingle.trim()) return alert('Enter domain');
                await API.post('/admin/community/links', { domain: linkSingle.trim(), reason: linkReason, severity: linkSeverity });
              }
              setShowAdd(false);
              setLinkSingle('');
              setLinkBulk('');
              setLinkReason('');
              fetchData();
            }}>Add</Button>
          </div>
        )}

        <div className="space-y-2">
          {links.map(link => (
            <div key={link._id} className="flex items-center justify-between p-3 bg-jolshaa-surface-container-low rounded-lg">
              <div>
                <p className="font-medium text-sm">{link.domain}</p>
                <p className="text-xs text-jolshaa-on-surface-variant">Severity: {link.severity} &middot; Hits: {link.hitCount}{link.reason ? ` - ${link.reason}` : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={link.isActive ? 'success' : 'danger'}>{link.isActive ? 'Active' : 'Off'}</Badge>
                <Button size="sm" onClick={async () => {
                  await API.put(`/admin/community/links/${link._id}/toggle`);
                  fetchData();
                }}>Toggle</Button>
                <Button size="sm" variant="danger" onClick={async () => {
                  await API.delete(`/admin/community/links/${link._id}`);
                  fetchData();
                }}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// --- Media Restrictions ---
const MediaRestrictionsPanel = () => {
  const [restrictions, setRestrictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [mediaName, setMediaName] = useState('');
  const [mediaType, setMediaType] = useState('file_type');
  const [mediaApplies, setMediaApplies] = useState('all');
  const [mediaAction, setMediaAction] = useState('block');
  const [mediaSize, setMediaSize] = useState('');
  const [mediaDuration, setMediaDuration] = useState('');

  const fetchData = () => {
    setLoading(true);
    API.get('/admin/community/media').then(res => setRestrictions(res.data.restrictions)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">Media Upload Restrictions ({restrictions.length})</h3>
          <Button size="sm" onClick={() => setShowAdd(!showAdd)}>{showAdd ? 'Cancel' : 'Add Restriction'}</Button>
        </div>

        {showAdd && (
          <div className="p-4 bg-jolshaa-surface-container-low rounded-lg mb-4 space-y-3">
            <Input placeholder="Name" value={mediaName} onChange={e => setMediaName(e.target.value)} />
            <select value={mediaType} onChange={e => setMediaType(e.target.value)} className="w-full text-sm border rounded px-3 py-2">
              <option value="file_type">File Type</option>
              <option value="file_size">File Size</option>
              <option value="resolution">Resolution</option>
              <option value="duration">Duration</option>
            </select>
            <select value={mediaApplies} onChange={e => setMediaApplies(e.target.value)} className="w-full text-sm border rounded px-3 py-2">
              <option value="all">All</option>
              <option value="posts">Posts</option>
              <option value="stories">Stories</option>
              <option value="comments">Comments</option>
              <option value="messages">Messages</option>
            </select>
            <select value={mediaAction} onChange={e => setMediaAction(e.target.value)} className="w-full text-sm border rounded px-3 py-2">
              <option value="block">Block</option>
              <option value="flag">Flag</option>
              <option value="resize">Resize</option>
            </select>
            <Input placeholder="Max size MB (for file_size)" type="number" value={mediaSize} onChange={e => setMediaSize(e.target.value)} />
            <Input placeholder="Max duration sec (for duration)" type="number" value={mediaDuration} onChange={e => setMediaDuration(e.target.value)} />
            <Button onClick={async () => {
              const config = {};
              if (mediaSize) config.maxSizeMB = parseInt(mediaSize);
              if (mediaDuration) config.maxDurationSec = parseInt(mediaDuration);
              if (!mediaName.trim()) return alert('Enter name');
              await API.post('/admin/community/media', { name: mediaName.trim(), type: mediaType, appliesTo: mediaApplies, action: mediaAction, config });
              setShowAdd(false);
              setMediaName('');
              setMediaSize('');
              setMediaDuration('');
              fetchData();
            }}>Create</Button>
          </div>
        )}

        <div className="space-y-2">
          {restrictions.map(r => (
            <div key={r._id} className="flex items-center justify-between p-3 bg-jolshaa-surface-container-low rounded-lg">
              <div>
                <p className="font-medium text-sm">{r.name}</p>
                <p className="text-xs text-jolshaa-on-surface-variant">Type: {r.type} &middot; Applies: {r.appliesTo} &middot; Action: {r.action}</p>
                {r.config?.maxSizeMB && <p className="text-xs text-jolshaa-on-surface-variant">Max: {r.config.maxSizeMB}MB</p>}
                {r.config?.maxDurationSec && <p className="text-xs text-jolshaa-on-surface-variant">Max: {r.config.maxDurationSec}s</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={r.isActive ? 'success' : 'danger'}>{r.isActive ? 'Active' : 'Off'}</Badge>
                <Button size="sm" onClick={async () => {
                  await API.put(`/admin/community/media/${r._id}/toggle`);
                  fetchData();
                }}>Toggle</Button>
                <Button size="sm" variant="danger" onClick={async () => {
                  await API.delete(`/admin/community/media/${r._id}`);
                  fetchData();
                }}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ============================================================
// OPS / ADMIN QUALITY
// ============================================================

const OpsQualityTab = () => {
  const [subTab, setSubTab] = useState('dashboard');

  const subTabs = [
    { key: 'dashboard', label: 'Overview' },
    { key: 'search', label: 'Search' },
    { key: 'filters', label: 'Filters & Sorting' },
    { key: 'export', label: 'Export CSV' },
    { key: 'audit', label: 'Audit Trail' },
    { key: 'notes', label: 'Case Notes' },
    { key: 'bulk', label: 'Bulk Import' },
    { key: 'undo', label: 'Undo' },
  ];

  return (
    <div className="space-y-4">
      <Tabs tabs={subTabs} activeTab={subTab} onChange={setSubTab} className="mb-4" />
      {subTab === 'dashboard' && <OpsOverviewPanel />}
      {subTab === 'search' && <GlobalSearchPanel />}
      {subTab === 'filters' && <FiltersSortingPanel />}
      {subTab === 'export' && <ExportCSVPanel />}
      {subTab === 'audit' && <AuditTrailPanel />}
      {subTab === 'notes' && <CaseNotesPanel />}
      {subTab === 'bulk' && <BulkImportPanel />}
      {subTab === 'undo' && <UndoPanel />}
    </div>
  );
};

// --- Ops Overview ---
const OpsOverviewPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    API.get('/admin/ops/dashboard').then(res => setData(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">Operations Dashboard</h3>
          <p className="text-[10px] text-jolshaa-on-surface-variant">Platform health at a glance</p>
        </div>
        <Button size="sm" variant="ghost" onClick={fetchData}>Refresh</Button>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Total Users</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{data.totalUsers?.toLocaleString()}</p>
        </Card>
        <Card>
          <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Total Posts</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{data.totalPosts?.toLocaleString()}</p>
        </Card>
        <Card>
          <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Total Reports</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{data.totalReports?.toLocaleString()}</p>
        </Card>
        <Card className={data.pendingReports > 0 ? 'border-red-200' : ''}>
          <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Pending Reports</p>
          <p className={`text-2xl font-bold mt-1 ${data.pendingReports > 0 ? 'text-red-600' : 'text-green-600'}`}>{data.pendingReports}</p>
        </Card>
      </div>

      {/* Activity & Ops */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Actions Today</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{data.todayActions}</p>
        </Card>
        <Card>
          <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Actions This Week</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{data.weekActions}</p>
        </Card>
        <Card className={data.pendingUndos > 0 ? 'border-orange-200' : ''}>
          <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Pending Undos</p>
          <p className={`text-2xl font-bold mt-1 ${data.pendingUndos > 0 ? 'text-orange-600' : 'text-green-600'}`}>{data.pendingUndos}</p>
        </Card>
        <Card>
          <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Notes This Week</p>
          <p className="text-2xl font-bold text-teal-600 mt-1">{data.recentNotes}</p>
        </Card>
      </div>
    </div>
  );
};

// --- Global Search ---
const GlobalSearchPanel = () => {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const doSearch = () => {
    if (!query.trim()) return;
    setLoading(true);
    API.get(`/admin/ops/search?q=${encodeURIComponent(query)}&type=${type}`).then(res => setResults(res.data)).finally(() => setLoading(false));
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex gap-2">
          <Input placeholder="Search users, posts, reports..." value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch()} className="flex-1" />
          <select value={type} onChange={e => setType(e.target.value)} className="text-sm border rounded px-2 py-1">
            <option value="all">All</option>
            <option value="users">Users</option>
            <option value="posts">Posts</option>
            <option value="reports">Reports</option>
            <option value="comments">Comments</option>
          </select>
          <Button onClick={doSearch}>Search</Button>
        </div>
      </Card>

      {loading && <div className="text-center py-4 text-jolshaa-on-surface-variant">Searching...</div>}

      {results && (
        <div className="space-y-4">
          {results.users && results.users.data.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Users ({results.users.total})</h3>
              <div className="space-y-2">
                {results.users.data.map(u => (
                  <div key={u._id} className="flex items-center justify-between p-2 bg-jolshaa-surface-container-low rounded">
                    <div className="flex items-center gap-2">
                      {u.profilePhoto && <img src={u.profilePhoto} className="w-8 h-8 rounded-full" alt="" />}
                      <div>
                        <p className="text-sm font-medium">{u.name}</p>
                        <p className="text-xs text-jolshaa-on-surface-variant">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {u.isVerified && <Badge variant="success">Verified</Badge>}
                      {u.isAdmin && <Badge variant="primary">Admin</Badge>}
                      <Badge variant="neutral">{u.role}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {results.posts && results.posts.data.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Posts ({results.posts.total})</h3>
              <div className="space-y-2">
                {results.posts.data.map(p => (
                  <div key={p._id} className="p-2 bg-jolshaa-surface-container-low rounded">
                    <p className="text-sm">{p.text?.substring(0, 200)}</p>
                    <p className="text-xs text-jolshaa-on-surface-variant mt-1">by {p.author?.name} &middot; {new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {results.reports && results.reports.data.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-3">Reports ({results.reports.total})</h3>
              <div className="space-y-2">
                {results.reports.data.map(r => (
                  <div key={r._id} className="flex items-center justify-between p-2 bg-jolshaa-surface-container-low rounded">
                    <div>
                      <p className="text-sm">{r.reason} - {r.targetType}</p>
                      <p className="text-xs text-jolshaa-on-surface-variant">by {r.reporter?.name}</p>
                    </div>
                    <Badge variant={r.status === 'pending' ? 'warning' : 'success'}>{r.status}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {results.users?.total === 0 && results.posts?.total === 0 && results.reports?.total === 0 && results.comments?.total === 0 && (
            <Card>
              <p className="text-center text-jolshaa-on-surface-variant py-4">No results found</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

// --- Filters & Sorting ---
const FiltersSortingPanel = () => {
  const [entity, setEntity] = useState('users');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState('-createdAt');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams({ sort, page, limit: 20, ...filters });
    const endpoint = entity === 'reports' ? 'reports-filter' : entity;
    API.get(`/admin/ops/${endpoint}?${params}`).then(res => {
      const d = res.data;
      setData(d.users || d.posts || d.reports || []);
      setTotal(d.total || 0);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [entity, sort, page]);

  const userFilters = [
    { key: 'role', label: 'Role', options: ['', 'user', 'admin', 'superadmin'] },
    { key: 'isCreator', label: 'Creator', options: ['', 'true', 'false'] },
    { key: 'isVerified', label: 'Verified', options: ['', 'true', 'false'] },
  ];

  const postFilters = [
    { key: 'visibility', label: 'Visibility', options: ['', 'public', 'friends', 'private'] },
    { key: 'isBoosted', label: 'Boosted', options: ['', 'true', 'false'] },
  ];

  const reportFilters = [
    { key: 'status', label: 'Status', options: ['', 'pending', 'reviewed', 'resolved', 'dismissed', 'escalated'] },
    { key: 'reason', label: 'Reason', options: ['', 'spam', 'harassment', 'hate_speech', 'violence', 'nudity', 'other'] },
    { key: 'priority', label: 'Priority', options: ['', 'low', 'medium', 'high', 'critical'] },
  ];

  const activeFilters = entity === 'users' ? userFilters : entity === 'posts' ? postFilters : reportFilters;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-4 mb-4">
          <select value={entity} onChange={e => { setEntity(e.target.value); setFilters({}); setPage(1); }} className="text-sm border rounded px-2 py-1">
            <option value="users">Users</option>
            <option value="posts">Posts</option>
            <option value="reports">Reports</option>
          </select>

          <select value={sort} onChange={e => setSort(e.target.value)} className="text-sm border rounded px-2 py-1">
            <option value="-createdAt">Newest</option>
            <option value="createdAt">Oldest</option>
            {entity === 'users' && <option value="name">Name A-Z</option>}
            {entity === 'reports' && <option value="priority">Priority</option>}
          </select>

          <Button size="sm" onClick={fetchData}>Apply</Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {activeFilters.map(f => (
            <select key={f.key} value={filters[f.key] || ''} onChange={e => setFilters(prev => ({ ...prev, [f.key]: e.target.value }))} className="text-xs border rounded px-2 py-1">
              <option value="">{f.label}: All</option>
              {f.options.filter(Boolean).map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-4 text-jolshaa-on-surface-variant">Loading...</div>
        ) : (
          <>
            <p className="text-xs text-jolshaa-on-surface-variant mb-2">{total} results</p>
            <div className="space-y-2">
              {data.map(item => (
                <div key={item._id} className="p-2 bg-jolshaa-surface-container-low rounded text-sm">
                  {entity === 'users' && (
                    <div className="flex justify-between">
                      <span>{item.name} ({item.email})</span>
                      <Badge variant="neutral">{item.role}</Badge>
                    </div>
                  )}
                  {entity === 'posts' && (
                    <div>
                      <p>{item.text?.substring(0, 150)}</p>
                      <p className="text-xs text-jolshaa-on-surface-variant">by {item.author?.name}</p>
                    </div>
                  )}
                  {entity === 'reports' && (
                    <div className="flex justify-between">
                      <span>{item.reason} - {item.targetType}</span>
                      <Badge variant={item.status === 'pending' ? 'warning' : 'success'}>{item.status}</Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {total > 20 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <span className="text-sm text-jolshaa-on-surface-variant py-1">Page {page}</span>
                <Button size="sm" disabled={data.length < 20} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

// --- Export CSV ---
const ExportCSVPanel = () => {
  const [type, setType] = useState('users');
  const [filters, setFilters] = useState({});
  const [exporting, setExporting] = useState(false);

  const doExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ type, filters: JSON.stringify(filters) });
      const res = await API.get(`/admin/ops/export?${params}`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed');
    }
    setExporting(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-4">Export Data as CSV</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Export Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full text-sm border rounded px-3 py-2 mt-1">
              <option value="users">Users</option>
              <option value="posts">Posts</option>
              <option value="reports">Reports</option>
              <option value="transactions">Transactions</option>
            </select>
          </div>

          {type === 'users' && (
            <div className="grid grid-cols-3 gap-2">
              <select value={filters.role || ''} onChange={e => setFilters(p => ({ ...p, role: e.target.value }))} className="text-sm border rounded px-2 py-1">
                <option value="">All Roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
              </select>
              <select value={filters.isCreator || ''} onChange={e => setFilters(p => ({ ...p, isCreator: e.target.value }))} className="text-sm border rounded px-2 py-1">
                <option value="">All</option>
                <option value="true">Creators Only</option>
                <option value="false">Non-Creators</option>
              </select>
              <select value={filters.isVerified || ''} onChange={e => setFilters(p => ({ ...p, isVerified: e.target.value }))} className="text-sm border rounded px-2 py-1">
                <option value="">All</option>
                <option value="true">Verified</option>
                <option value="false">Unverified</option>
              </select>
            </div>
          )}

          {type === 'reports' && (
            <div className="grid grid-cols-2 gap-2">
              <select value={filters.status || ''} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))} className="text-sm border rounded px-2 py-1">
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
              <select value={filters.reason || ''} onChange={e => setFilters(p => ({ ...p, reason: e.target.value }))} className="text-sm border rounded px-2 py-1">
                <option value="">All Reasons</option>
                <option value="spam">Spam</option>
                <option value="harassment">Harassment</option>
                <option value="hate_speech">Hate Speech</option>
              </select>
            </div>
          )}

          <Button onClick={doExport} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Download CSV'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

// --- Audit Trail ---
const AuditTrailPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 50, ...filters });
    API.get(`/admin/ops/audit?${params}`).then(res => setData(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [page]);

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;
  if (!data) return null;

  const actionColors = {
    'user': 'info', 'content': 'warning', 'report': 'primary',
    'appeal': 'success', 'page': 'neutral', 'safety': 'danger',
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Input placeholder="Filter by action..." value={filters.action || ''} onChange={e => setFilters(p => ({ ...p, action: e.target.value }))} className="flex-1" />
          <select value={filters.targetType || ''} onChange={e => setFilters(p => ({ ...p, targetType: e.target.value }))} className="text-sm border rounded px-2 py-1">
            <option value="">All Types</option>
            <option value="User">User</option>
            <option value="Post">Post</option>
            <option value="Comment">Comment</option>
            <option value="Report">Report</option>
          </select>
          <Button size="sm" onClick={() => { setPage(1); fetchData(); }}>Filter</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-jolshaa-on-surface-variant">
                <th className="pb-2">Admin</th>
                <th className="pb-2">Action</th>
                <th className="pb-2">Target</th>
                <th className="pb-2">Details</th>
                <th className="pb-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {data.actions.map(a => (
                <tr key={a._id} className="border-b last:border-0">
                  <td className="py-2">{a.admin?.name}</td>
                  <td className="py-2">
                    <Badge variant={actionColors[a.action.split('.')[0]] || 'neutral'}>{a.action}</Badge>
                  </td>
                  <td className="py-2 text-xs">{a.targetType}: {a.targetName || a.targetId?.slice(-8)}</td>
                  <td className="py-2 text-xs text-jolshaa-on-surface-variant max-w-xs truncate">{JSON.stringify(a.details || {}).substring(0, 80)}</td>
                  <td className="py-2 text-xs text-jolshaa-on-surface-variant">{new Date(a.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.pages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <Button size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <span className="text-sm text-jolshaa-on-surface-variant py-1">Page {page} of {data.pages}</span>
            <Button size="sm" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </Card>
    </div>
  );
};

// --- Case Notes ---
const CaseNotesPanel = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [targetType, setTargetType] = useState('user');
  const [targetId, setTargetId] = useState('');
  const [noteText, setNoteText] = useState('');
  const [noteTag, setNoteTag] = useState('');

  const fetchData = () => {
    setLoading(true);
    API.get('/admin/ops/notes').then(res => setNotes(res.data.notes)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">Case Notes</h3>
          <Button size="sm" onClick={() => setShowAdd(!showAdd)}>{showAdd ? 'Cancel' : 'Add Note'}</Button>
        </div>

        {showAdd && (
          <div className="p-4 bg-jolshaa-surface-container-low rounded-lg mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <select value={targetType} onChange={e => setTargetType(e.target.value)} className="text-sm border rounded px-2 py-1">
                <option value="user">User</option>
                <option value="post">Post</option>
                <option value="report">Report</option>
                <option value="comment">Comment</option>
              </select>
              <Input placeholder="Target ID" value={targetId} onChange={e => setTargetId(e.target.value)} />
            </div>
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} className="w-full text-sm border rounded px-3 py-2 h-24" placeholder="Write your note..." />
            <select value={noteTag} onChange={e => setNoteTag(e.target.value)} className="text-sm border rounded px-2 py-1">
              <option value="">No tag</option>
              <option value="escalation">Escalation</option>
              <option value="investigation">Investigation</option>
              <option value="resolved">Resolved</option>
              <option value="follow_up">Follow Up</option>
              <option value="urgent">Urgent</option>
            </select>
            <Button onClick={async () => {
              if (!noteText.trim() || !targetId) return alert('Fill in all fields');
              await API.post('/admin/ops/notes', { targetType, targetId, note: noteText.trim(), tags: noteTag ? [noteTag] : [] });
              setShowAdd(false);
              setNoteText('');
              setNoteTag('');
              fetchData();
            }}>Save Note</Button>
          </div>
        )}

        <div className="space-y-2">
          {notes.map(n => (
            <div key={n._id} className="p-3 bg-jolshaa-surface-container-low rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Badge variant="neutral">{n.targetType}</Badge>
                  {n.tags?.map(t => <Badge key={t} variant="warning">{t}</Badge>)}
                </div>
                <span className="text-xs text-jolshaa-on-surface-variant">{new Date(n.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm">{n.note}</p>
              <p className="text-xs text-jolshaa-on-surface-variant mt-1">by {n.author?.name}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// --- Bulk Import ---
const BulkImportPanel = () => {
  const [type, setType] = useState('keywords');
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const doImport = async () => {
    if (!input.trim()) return alert('Enter data');
    setLoading(true);
    try {
      const lines = input.split('\n').filter(l => l.trim());
      let data;
      if (type === 'keywords') {
        data = lines.map(k => ({ keyword: k.trim(), category: 'custom', action: 'flag', severity: 'medium' }));
      } else if (type === 'links') {
        data = lines.map(l => ({ domain: l.trim(), severity: 'medium' }));
      } else {
        data = lines.map(l => {
          const [name, email] = l.split(',').map(s => s.trim());
          return { name, email };
        }).filter(d => d.email);
      }
      const res = await API.post('/admin/ops/bulk-import', { type, data });
      setResult(res.data);
      setInput('');
    } catch (err) {
      alert('Import failed');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-4">Bulk Import</h3>
        <div className="space-y-3">
          <select value={type} onChange={e => setType(e.target.value)} className="w-full text-sm border rounded px-3 py-2">
            <option value="keywords">Keywords (one per line)</option>
            <option value="links">Domains (one per line)</option>
            <option value="users">Users (name, email per line)</option>
          </select>
          <textarea value={input} onChange={e => setInput(e.target.value)} className="w-full text-sm border rounded px-3 py-2 h-40 font-mono"
            placeholder={type === 'keywords' ? 'spam\nscam\nfake' : type === 'links' ? 'spam.com\nscam.net' : 'John Doe, john@email.com'} />
          <Button onClick={doImport} disabled={loading}>{loading ? 'Importing...' : 'Import'}</Button>
        </div>

        {result && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm">Imported: {result.imported} / {result.total}</p>
            {result.failed > 0 && <p className="text-sm text-red-600">Failed: {result.failed}</p>}
          </div>
        )}
      </Card>
    </div>
  );
};

// --- Undo ---
const UndoPanel = () => {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [confirmModal, setConfirmModal] = useState(null);
  const [undoing, setUndoing] = useState(null);

  const fetchData = () => {
    setLoading(true);
    API.get(`/admin/ops/undo/history?page=${page}`).then(res => {
      setSnapshots(res.data.snapshots);
      setTotalPages(res.data.totalPages || 1);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [page]);

  const handleUndo = async (id) => {
    setUndoing(id);
    await API.put(`/admin/ops/undo/${id}`);
    setConfirmModal(null);
    setUndoing(null);
    fetchData();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-orange-200 bg-orange-50">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
          <div>
            <p className="text-xs font-medium text-orange-700">Undo History</p>
            <p className="text-[10px] text-orange-600">Snapshots of data before admin actions. Click Undo to restore.</p>
          </div>
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-jolshaa-on-surface-variant">Page {page} of {totalPages}</span>
        <div className="flex gap-1">
          <Button size="xs" variant="ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Prev</Button>
          <Button size="xs" variant="ghost" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
        </div>
      </div>

      {loading ? <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div> : (
        <div className="space-y-2">
          {snapshots.length === 0 ? (
            <Card>
              <div className="text-center py-8 text-jolshaa-on-surface-variant text-sm">No undo history</div>
            </Card>
          ) : snapshots.map(s => (
            <Card key={s._id} className={s.undone ? 'opacity-60' : ''}>
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.undone ? 'bg-green-500' : 'bg-orange-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-jolshaa-on-surface">{s.action} <span className="text-jolshaa-on-surface-variant">on</span> {s.targetType}</p>
                  <p className="text-[10px] text-jolshaa-on-surface-variant">by {s.admin?.name} &middot; {new Date(s.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex-shrink-0">
                  {s.undone ? (
                    <Badge variant="success" size="xs">Undone</Badge>
                  ) : (
                    <Button size="xs" variant="ghost" onClick={() => setConfirmModal(s)} disabled={undoing === s._id}>{undoing === s._id ? '...' : 'Undo'}</Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal isOpen={!!confirmModal} onClose={() => setConfirmModal(null)} title="Confirm Undo">
        <div className="p-5 space-y-4">
          <div className="p-3 bg-orange-50 rounded-lg">
            <p className="text-sm font-medium text-orange-800">{confirmModal?.action} on {confirmModal?.targetType}</p>
            <p className="text-xs text-orange-600 mt-0.5">by {confirmModal?.admin?.name}</p>
          </div>
          <p className="text-sm text-jolshaa-on-surface-variant">Are you sure you want to undo this action? This will restore the data to its previous state.</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => handleUndo(confirmModal._id)} disabled={undoing === confirmModal?._id}>{undoing === confirmModal?._id ? 'Undoing...' : 'Undo Action'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// --- Fact-Check Review ---
const FactCheckReviewTab = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [verdictModal, setVerdictModal] = useState(null);
  const [verdictType, setVerdictType] = useState('');
  const [verdictNote, setVerdictNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFlagged();
  }, [page]);

  const fetchFlagged = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/admin/factcheck/flagged?page=${page}&limit=10`);
      setPosts(res.data.posts);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error('Failed to fetch flagged posts');
    } finally {
      setLoading(false);
    }
  };

  const handleVerdict = async () => {
    if (!verdictModal || !verdictType) return;
    setSubmitting(true);
    try {
      await API.put(`/admin/posts/${verdictModal._id}/factcheck/verdict`, {
        verdict: verdictType,
        note: verdictNote,
      });
      setVerdictModal(null);
      setVerdictType('');
      setVerdictNote('');
      fetchFlagged();
    } catch (err) {
      console.error('Failed to submit verdict');
    } finally {
      setSubmitting(false);
    }
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading flagged posts...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold font-display text-jolshaa-on-surface">Fact Check Review</h2>
          <p className="text-sm text-jolshaa-on-surface-variant mt-1">
            Posts flagged by community votes for admin review
          </p>
        </div>
        <Badge variant="warning">{posts.length} pending</Badge>
      </div>

      {posts.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-jolshaa-on-surface-variant">No flagged posts to review. All clear!</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post._id} className="p-4">
              <div className="flex gap-4">
                <Avatar src={post.author?.profilePhoto} alt={post.author?.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-jolshaa-on-surface">
                      {post.author?.name}
                    </span>
                    <span className="text-xs text-jolshaa-on-surface-variant">{timeAgo(post.createdAt)}</span>
                    <Badge variant={
                      post.factCheck?.status === 'false' ? 'danger' :
                      post.factCheck?.status === 'misleading' ? 'warning' : 'neutral'
                    }>
                      {post.factCheck?.status}
                    </Badge>
                  </div>

                  {post.text && (
                    <p className="text-sm text-jolshaa-on-surface-variant line-clamp-2 mb-2">
                      {post.text}
                    </p>
                  )}

                  {/* Vote stats */}
                  <div className="flex items-center gap-4 text-xs text-jolshaa-on-surface-variant mb-2">
                    <span className="text-green-600">✓ {post.factCheck?.trueVotes?.length || 0} true</span>
                    <span className="text-red-600">✗ {post.factCheck?.falseVotes?.length || 0} false</span>
                    <span className="text-orange-600">~ {post.factCheck?.misleadingVotes?.length || 0} misleading</span>
                    <span>Total: {post.factCheck?.totalVotes || 0}</span>
                  </div>

                  {/* Reports */}
                  {post.reports?.length > 0 && (
                    <div className="space-y-1.5 mb-3">
                      <p className="text-xs font-medium text-jolshaa-on-surface-variant">
                        Reports ({post.reports.length}):
                      </p>
                      {post.reports.slice(0, 3).map((r, i) => (
                        <div key={i} className="text-xs bg-jolshaa-surface-container-low rounded-lg p-2">
                          <span className="font-medium text-jolshaa-on-surface-variant">
                            {r.reporter?.name}:
                          </span>{' '}
                          <span className="text-jolshaa-on-surface-variant">{r.reason}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Verdict buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="xs"
                      variant="success"
                      onClick={() => { setVerdictModal(post); setVerdictType('true'); }}
                    >
                      Confirm True
                    </Button>
                    <Button
                      size="xs"
                      variant="danger"
                      onClick={() => { setVerdictModal(post); setVerdictType('false'); }}
                    >
                      Confirm Fake
                    </Button>
                    <Button
                      size="xs"
                      variant="warning"
                      onClick={() => { setVerdictModal(post); setVerdictType('misleading'); }}
                    >
                      Misleading
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-jolshaa-on-surface-variant py-1">Page {page} of {totalPages}</span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Verdict Modal */}
      <Modal isOpen={!!verdictModal} onClose={() => setVerdictModal(null)} title="Admin Verdict">
        <div className="p-5 space-y-4">
          <div className="p-3 bg-jolshaa-surface-container-low rounded-lg">
            <p className="text-sm font-medium text-jolshaa-on-surface">
              {verdictModal?.author?.name}
            </p>
            <p className="text-xs text-jolshaa-on-surface-variant mt-0.5 line-clamp-2">
              {verdictModal?.text || 'No text'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-2">
              Verdict: <span className="font-bold">
                {verdictType === 'true' ? 'True' : verdictType === 'false' ? 'Fake' : 'Misleading'}
              </span>
            </label>
            <textarea
              value={verdictNote}
              onChange={(e) => setVerdictNote(e.target.value)}
              placeholder="Add a note explaining the verdict (optional)"
              className="w-full border border-jolshaa-outline-variant rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-jolshaa-teal/30 bg-jolshaa-surface-container-lowest resize-none"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setVerdictModal(null)}>Cancel</Button>
            <Button
              variant={verdictType === 'true' ? 'success' : verdictType === 'false' ? 'danger' : 'warning'}
              onClick={handleVerdict}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Verdict'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminPanel;
