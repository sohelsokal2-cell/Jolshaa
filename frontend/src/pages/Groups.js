import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import GroupCard from '../components/GroupCard';
import NotificationBell from '../components/NotificationBell';
import Toast from '../components/Toast';

const Groups = () => {
  const { user, logout } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchGroups();
  }, [page]);

  const fetchGroups = async () => {
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (search) params.append('search', search);
      const res = await API.get(`/groups?${params}`);
      setGroups(res.data.groups);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error('Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchGroups();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md px-6 py-3 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link to="/feed" className="text-xl font-bold text-blue-600">Jolshaa</Link>
          <div className="flex items-center gap-4">
            <Link to="/feed" className="text-sm text-gray-600 hover:text-blue-600">Feed</Link>
            <Link to="/pages" className="text-sm text-gray-600 hover:text-blue-600">Pages</Link>
            <NotificationBell />
            <button onClick={logout} className="text-sm text-red-600 hover:underline">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto mt-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Groups</h1>
          <Link
            to="/groups/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
          >
            Create Group
          </Link>
        </div>

        <form onSubmit={handleSearch} className="mb-6 flex gap-2">
          <input
            type="text"
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Search
          </button>
        </form>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading groups...</div>
        ) : groups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No groups found. Create the first one!
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map(group => (
                <GroupCard key={group._id} group={group} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded border disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded border disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Toast />
    </div>
  );
};

export default Groups;
