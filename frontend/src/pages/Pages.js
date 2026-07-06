import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import PageCard from '../components/PageCard';
import Toast from '../components/Toast';
import Layout from '../components/layout/Layout';

const CATEGORIES = [
  'Business', 'Entertainment', 'Health', 'Education', 'Technology',
  'Sports', 'Music', 'Art', 'Food', 'Travel', 'Other'
];

const Pages = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchPages();
  }, [page, category]);

  const fetchPages = async () => {
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      const res = await API.get(`/pages?${params}`);
      setPages(res.data.pages);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error('Failed to fetch pages');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPages();
  };

  return (
    <Layout>
      <div className="mt-2">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-display text-jolshaa-on-surface">Pages</h1>
          <Link
            to="/pages/create"
            className="bg-jolshaa-indigo text-jolshaa-on-indigo-fixed px-4 py-2 rounded-lg text-sm font-medium hover:bg-jolshaa-indigo-container transition-colors shadow-ambient"
          >
            Create Page
          </Link>
        </div>

        <form onSubmit={handleSearch} className="mb-6 flex gap-2">
          <input
            type="text"
            placeholder="Search pages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-lg text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-indigo"
          />
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="px-4 py-2 bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-lg text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-indigo"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-jolshaa-indigo text-jolshaa-on-indigo-fixed px-4 py-2 rounded-lg text-sm font-medium hover:bg-jolshaa-indigo-container transition-colors"
          >
            Search
          </button>
        </form>

        {loading ? (
          <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading pages...</div>
        ) : pages.length === 0 ? (
          <div className="text-center py-8 text-jolshaa-on-surface-variant">
            No pages found. Create the first one!
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pages.map(pg => (
                <PageCard key={pg._id} page={pg} />
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

export default Pages;
