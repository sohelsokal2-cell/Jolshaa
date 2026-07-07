import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/axios';
import Avatar from './ui/Avatar';
import Layout from './layout/Layout';

const CheckinsListPage = () => {
  const { id } = useParams();
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCheckins();
  }, [id]);

  const fetchCheckins = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get(`/hashtags/checkins/user/${id}`);
      setCheckins(res.data.checkins || []);
    } catch (err) {
      console.error('Failed to fetch check-ins');
      setError('Failed to load check-ins.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (checkinId) => {
    if (!window.confirm('Delete this check-in?')) return;
    try {
      await API.delete(`/hashtags/checkins/${checkinId}`);
      setCheckins(prev => prev.filter(c => c._id !== checkinId));
    } catch (err) {
      console.error('Failed to delete check-in');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Group checkins by location
  const groupedCheckins = checkins.reduce((acc, checkin) => {
    const name = checkin.location?.name || 'Unknown';
    if (!acc[name]) acc[name] = [];
    acc[name].push(checkin);
    return acc;
  }, {});

  if (loading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-8 px-4">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-jolshaa-surface-container rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-8 px-4 text-center">
          <p className="text-sm text-jolshaa-on-surface-variant mb-3">{error}</p>
          <button
            onClick={fetchCheckins}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-jolshaa-surface-container-low text-jolshaa-on-surface hover:bg-jolshaa-surface-container transition-colors"
          >
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-xl font-semibold text-jolshaa-on-surface mb-6">Check-ins</h1>

        {checkins.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-jolshaa-surface-container rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-jolshaa-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-sm text-jolshaa-on-surface-variant">No check-ins yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedCheckins).map(([locationName, locationCheckins]) => (
              <div key={locationName} className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
                <div className="p-4 border-b border-jolshaa-outline-variant">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-jolshaa-teal/15 flex items-center justify-center">
                      <svg className="w-5 h-5 text-jolshaa-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-jolshaa-on-surface">{locationName}</h3>
                      <p className="text-xs text-jolshaa-on-surface-variant">
                        Visited {locationCheckins.length} time{locationCheckins.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-jolshaa-outline-variant">
                  {locationCheckins.map((checkin) => (
                    <div key={checkin._id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Link to={`/profile/${checkin.user?._id}`}>
                            <Avatar src={checkin.user?.profilePhoto} alt={checkin.user?.name} size="sm" />
                          </Link>
                          <div>
                            <div className="flex items-center gap-2">
                              <Link to={`/profile/${checkin.user?._id}`} className="text-sm font-medium text-jolshaa-on-surface hover:underline">
                                {checkin.user?.name}
                              </Link>
                              <span className="text-xs text-jolshaa-on-surface-variant">{formatDate(checkin.createdAt)}</span>
                            </div>
                            {checkin.location?.address && (
                              <p className="text-xs text-jolshaa-on-surface-variant mt-0.5">{checkin.location.address}</p>
                            )}
                            {checkin.message && (
                              <p className="text-sm text-jolshaa-on-surface mt-1">{checkin.message}</p>
                            )}
                            {checkin.taggedUsers?.length > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-xs text-jolshaa-on-surface-variant">with</span>
                                {checkin.taggedUsers.map((u, i) => (
                                  <Link key={u._id} to={`/profile/${u._id}`} className="text-xs text-jolshaa-teal hover:underline">
                                    {u.name}{i < checkin.taggedUsers.length - 1 ? ', ' : ''}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        {checkin.user?._id === JSON.parse(localStorage.getItem('user') || '{}')._id && (
                          <button
                            onClick={() => handleDelete(checkin._id)}
                            className="p-1.5 rounded-full hover:bg-red-500/10 text-jolshaa-on-surface-variant hover:text-red-500 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CheckinsListPage;
