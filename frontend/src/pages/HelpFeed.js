import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/LanguageContext';
import API from '../api/axios';
import Layout from '../components/layout/Layout';
import HelpRequestCard from '../components/HelpRequestCard';
import CreateHelpRequestModal from '../components/CreateHelpRequestModal';
import { PostSkeleton } from '../components/ui/Skeleton';

const FILTER_OPTIONS = [
  { value: 'all', label: 'All', icon: '📋' },
  { value: 'blood', label: 'Blood', icon: '🩸' },
  { value: 'medical', label: 'Medical', icon: '🏥' },
  { value: 'flood', label: 'Flood', icon: '🌊' },
  { value: 'fire', label: 'Fire', icon: '🔥' },
  { value: 'lost_person', label: 'Lost Person', icon: '🔍' },
  { value: 'lost_item', label: 'Lost & Found', icon: '🎒' },
  { value: 'giveaway', label: 'Giveaway', icon: '🎁' },
  { value: 'food', label: 'Food', icon: '🍲' },
  { value: 'shelter', label: 'Shelter', icon: '🏠' },
  { value: 'financial', label: 'Financial', icon: '💰' },
  { value: 'other', label: 'Other', icon: '🆘' },
];

const SORT_OPTIONS = [
  { value: 'urgent', label: 'Most Urgent' },
  { value: 'newest', label: 'Newest' },
];

const HelpFeed = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { t } = useLanguage();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('urgent');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [newRequestAlert, setNewRequestAlert] = useState(null);

  const district = user?.location?.district;

  useEffect(() => {
    if (district && socket) {
      socket.emit('joinDistrictRoom', { district });

      const handleNewRequest = (data) => {
        setNewRequestAlert(data.title);
        setTimeout(() => setNewRequestAlert(null), 5000);
        fetchRequests(1, filter, sort);
      };

      const handleUrgentAlert = (data) => {
        setNewRequestAlert(`🚨 Urgent: ${data.title}`);
        setTimeout(() => setNewRequestAlert(null), 8000);
      };

      socket.on('newHelpRequest', handleNewRequest);
      socket.on('urgentHelpAlert', handleUrgentAlert);

      return () => {
        socket.off('newHelpRequest', handleNewRequest);
        socket.off('urgentHelpAlert', handleUrgentAlert);
      };
    }
  }, [socket, district]);

  useEffect(() => {
    setPage(1);
    fetchRequests(1, filter, sort);
  }, [filter, sort]);

  const fetchRequests = async (pageNum, filterType, sortType) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum,
        limit: 10,
        sort: sortType,
      });
      if (district) params.append('district', district);
      if (filterType && filterType !== 'all') params.append('helpType', filterType);

      const res = await API.get(`/help/nearby?${params}`);
      if (pageNum === 1) setRequests(res.data.requests);
      else setRequests(prev => [...prev, ...res.data.requests]);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error('Failed to fetch help requests');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchRequests(nextPage, filter, sort);
  };

  if (!district) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="text-6xl mb-4">🆘</div>
          <h2 className="font-display text-xl font-bold text-jolshaa-on-surface mb-2">
            {t('help.request')}
          </h2>
          <p className="text-sm text-jolshaa-on-surface-variant mb-4">
            Set your location to see help requests in your area.
          </p>
          <a href="/profile/edit" className="text-sm text-jolshaa-teal hover:underline">
            Edit profile →
          </a>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h1 className="font-display text-lg sm:text-xl font-bold text-jolshaa-on-surface">
              🆘 {t('help.title')}
            </h1>
            <p className="text-xs text-jolshaa-on-surface-variant mt-0.5 truncate">{district} — Active help requests</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs sm:text-sm font-medium transition-colors shadow-lg shadow-red-500/25 flex-shrink-0"
          >
            + New
          </button>
        </div>

        {/* New request alert */}
        {newRequestAlert && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 animate-slide-down">
            <p className="text-sm font-medium text-red-700">{newRequestAlert}</p>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filter === opt.value
                  ? 'bg-red-500 text-white'
                  : 'bg-jolshaa-surface-container-high text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container-highest'
              }`}
            >
              <span>{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 mb-4">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                sort === opt.value
                  ? 'bg-jolshaa-on-surface text-jolshaa-surface'
                  : 'text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container-high'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Requests list */}
        {loading && page === 1 ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">✨</div>
            <p className="text-jolshaa-on-surface-variant text-sm">
              {filter === 'all'
                ? 'No help requests in this area yet'
                : 'No help requests of this type'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => (
              <HelpRequestCard key={req._id} request={req} />
            ))}
          </div>
        )}

        {/* Load more */}
        {page < totalPages && (
          <button
            onClick={loadMore}
            disabled={loading}
            className="w-full mt-4 py-2.5 text-sm text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface transition-colors"
          >
            {loading ? 'Loading...' : 'Load more'}
          </button>
        )}
      </div>

      {showCreate && <CreateHelpRequestModal onClose={() => setShowCreate(false)} />}
    </Layout>
  );
};

export default HelpFeed;
