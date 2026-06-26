import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Layout from '../components/layout/Layout';

const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [reportFilter, setReportFilter] = useState('pending');

  useEffect(() => {
    if (activeTab === 'stats') fetchStats();
    else if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'reports') fetchReports();
  }, [activeTab, reportFilter]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/admin/users?q=${searchQuery}`);
      setUsers(res.data.users);
    } catch (err) {
      console.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/admin/reports?status=${reportFilter}`);
      setReports(res.data.reports);
    } catch (err) {
      console.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async (userId) => {
    try {
      const res = await API.put(`/admin/users/${userId}/suspend`);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId
            ? { ...u, isSuspended: res.data.user.isSuspended }
            : u
        )
      );
    } catch (err) {
      console.error('Failed to suspend user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await API.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      console.error('Failed to delete user');
    }
  };

  const handleUpdateReport = async (reportId, status) => {
    try {
      const res = await API.put(`/admin/reports/${reportId}`, { status });
      setReports((prev) =>
        prev.map((r) => (r._id === reportId ? res.data.report : r))
      );
    } catch (err) {
      console.error('Failed to update report');
    }
  };

  const handleRemoveContent = async (report) => {
    if (!window.confirm(`Remove this ${report.targetType}?`)) return;
    try {
      if (report.targetType === 'post') {
        await API.delete(`/admin/posts/${report.targetId}`);
      } else if (report.targetType === 'comment') {
        await API.delete(`/admin/comments/${report.targetId}`);
      } else if (report.targetType === 'story') {
        await API.delete(`/admin/stories/${report.targetId}`);
      }
      await handleUpdateReport(report._id, 'resolved');
    } catch (err) {
      console.error('Failed to remove content');
    }
  };

  const handleSuspendFromReport = async (report) => {
    if (report.targetType === 'user') {
      try {
        const res = await API.put(`/admin/users/${report.targetId}/suspend`);
        setUsers((prev) =>
          prev.map((u) =>
            u._id === report.targetId
              ? { ...u, isSuspended: res.data.user.isSuspended }
              : u
          )
        );
      } catch (err) {
        console.error('Failed to suspend user');
      }
    }
  };

  if (!user?.isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-500">You don't have admin privileges.</p>
            <Link to="/feed" className="text-blue-600 hover:underline mt-4 block">Go to Feed</Link>
          </div>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { key: 'stats', label: 'Dashboard' },
    { key: 'users', label: 'Users' },
    { key: 'reports', label: 'Reports' },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto mt-4 px-4 pb-8">
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

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : (
          <>
            {/* Stats Dashboard */}
            {activeTab === 'stats' && stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <p className="text-gray-500 text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalUsers}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <p className="text-gray-500 text-sm">Total Posts</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalPosts}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <p className="text-gray-500 text-sm">Groups</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalGroups}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <p className="text-gray-500 text-sm">Pages</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalPages}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <p className="text-gray-500 text-sm">Active Today</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeToday}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <p className="text-gray-500 text-sm">Pending Reports</p>
                  <p className="text-2xl font-bold text-red-600">{stats.pendingReports}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <p className="text-gray-500 text-sm">Suspended Users</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.suspendedUsers}</p>
                </div>
              </div>
            )}

            {/* Users Management */}
            {activeTab === 'users' && (
              <div>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                    className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button onClick={fetchUsers} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Search</button>
                </div>

                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">User</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Email</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Joined</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {users.map((u) => (
                        <tr key={u._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img src={u.profilePhoto || 'https://res.cloudinary.com/demo/image/upload/v1556418119/default-avatar.png'} alt="" className="w-8 h-8 rounded-full object-cover" />
                              <span className="font-medium text-sm">{u.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {u.isAdmin && <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Admin</span>}
                              {u.isSuspended && <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Suspended</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {!u.isAdmin && (
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => handleSuspendUser(u._id)} className={`text-xs px-3 py-1 rounded ${u.isSuspended ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}>
                                  {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                                </button>
                                <button onClick={() => handleDeleteUser(u._id)} className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">Delete</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length === 0 && <p className="text-center py-4 text-gray-500 text-sm">No users found</p>}
                </div>
              </div>
            )}

            {/* Reports Management */}
            {activeTab === 'reports' && (
              <div>
                <div className="flex gap-2 mb-4">
                  {['pending', 'reviewed', 'resolved', 'dismissed', 'all'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setReportFilter(status)}
                      className={`px-3 py-1 rounded-full text-sm capitalize ${reportFilter === status ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {reports.map((report) => (
                    <div key={report._id} className="bg-white rounded-lg shadow-sm p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${report.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : report.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                              {report.status}
                            </span>
                            <span className="text-xs text-gray-500 capitalize font-medium">{report.targetType}</span>
                            <span className="text-xs text-gray-400">{report.reason.replace('_', ' ')}</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">{report.reporter?.name}</span> reported this {report.targetType}
                          </p>
                          {report.description && <p className="text-sm text-gray-500 mt-1 italic">"{report.description}"</p>}
                          <p className="text-xs text-gray-400 mt-1">{new Date(report.createdAt).toLocaleString()}</p>
                        </div>
                        {report.status === 'pending' && (
                          <div className="flex gap-2 flex-shrink-0 ml-4">
                            {(report.targetType === 'post' || report.targetType === 'comment' || report.targetType === 'story') && (
                              <button onClick={() => handleRemoveContent(report)} className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 font-medium">
                                Remove Content
                              </button>
                            )}
                            {report.targetType === 'user' && (
                              <button onClick={() => handleSuspendFromReport(report)} className="text-xs px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 font-medium">
                                Suspend User
                              </button>
                            )}
                            <button onClick={() => handleUpdateReport(report._id, 'resolved')} className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">Resolve</button>
                            <button onClick={() => handleUpdateReport(report._id, 'dismissed')} className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Dismiss</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {reports.length === 0 && <p className="text-center py-4 text-gray-500 text-sm">No reports found</p>}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default AdminPanel;
