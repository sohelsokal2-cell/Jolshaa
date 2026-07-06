import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import GroupCard from '../components/GroupCard';
import Toast from '../components/Toast';
import Layout from '../components/layout/Layout';

const Groups = () => {
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
    <Layout>
      <div className="mt-2">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-display text-jolshaa-on-surface">Groups</h1>
          <Link
            to="/groups/create"
            className="bg-jolshaa-teal text-jolshaa-on-teal px-4 py-2 rounded-lg text-sm font-medium hover:bg-jolshaa-teal-container transition-colors shadow-ambient"
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
            className="flex-1 px-4 py-2 bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-lg text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
          />
          <button
            type="submit"
            className="bg-jolshaa-teal text-jolshaa-on-teal px-4 py-2 rounded-lg text-sm font-medium hover:bg-jolshaa-teal-container transition-colors"
          >
            Search
          </button>
        </form>

        {loading ? (
          <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading groups...</div>
        ) : groups.length === 0 ? (
          <div className="text-center py-8 text-jolshaa-on-surface-variant">
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
                  className="px-3 py-1 rounded-lg border border-jolshaa-outline-variant text-jolshaa-on-surface hover:bg-jolshaa-surface-container-low disabled:opacity-50 transition-colors"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-jolshaa-on-surface-variant">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded-lg border border-jolshaa-outline-variant text-jolshaa-on-surface hover:bg-jolshaa-surface-container-low disabled:opacity-50 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Toast />
    </Layout>
  );
};

export default Groups;
