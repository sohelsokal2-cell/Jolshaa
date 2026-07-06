import { useState, useEffect } from 'react';
import API from '../api/axios';

const formatDuration = (seconds) => {
  if (!seconds || seconds === 0) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
};

const VideoAnalyticsDashboard = ({ postId, onClose }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await API.get(`/videos/${postId}/analytics`);
        setAnalytics(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [postId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <div className="bg-jolshaa-surface-container-lowest rounded-2xl p-6 w-96">
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <div className="bg-jolshaa-surface-container-lowest rounded-2xl p-6 w-96">
          <p className="text-red-500 text-sm text-center">{error}</p>
          <button onClick={onClose} className="w-full mt-4 py-2 bg-jolshaa-surface-container rounded-lg text-sm font-medium hover:bg-jolshaa-surface-container-high transition-colors">
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const {
    totalViews,
    uniqueViewers,
    avgWatchTime,
    avgWatchPercentage,
    completionRate,
    totalWatchTime,
    deviceBreakdown,
    viewsOverTime,
  } = analytics;

  // Find max views for chart scaling
  const maxViews = viewsOverTime.length > 0
    ? Math.max(...viewsOverTime.map(d => d.views))
    : 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-jolshaa-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-jolshaa-surface-container-lowest px-5 py-4 border-b border-jolshaa-outline-variant/30 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="font-display text-lg font-bold text-jolshaa-on-surface">Video Analytics</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-jolshaa-surface-container transition-colors text-jolshaa-on-surface-variant/60"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Total Views"
              value={totalViews.toLocaleString()}
              icon={
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              }
            />
            <StatCard
              label="Unique Viewers"
              value={uniqueViewers.toLocaleString()}
              icon={
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              }
            />
            <StatCard
              label="Avg Watch Time"
              value={formatDuration(avgWatchTime)}
              icon={
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              label="Completion Rate"
              value={`${completionRate.toFixed(1)}%`}
              icon={
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>

          {/* Avg watch percentage bar */}
          <div className="bg-jolshaa-surface-container-low rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-jolshaa-on-surface">Average Watch %</span>
              <span className="text-sm font-bold text-jolshaa-on-surface">{avgWatchPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full h-2.5 bg-jolshaa-surface-container rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(avgWatchPercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Views over time chart */}
          {viewsOverTime.length > 0 && (
            <div className="bg-jolshaa-surface-container-low rounded-xl p-4">
              <h3 className="font-display text-sm font-medium text-jolshaa-on-surface mb-3">Views (Last 30 Days)</h3>
              <div className="flex items-end gap-1 h-32">
                {viewsOverTime.slice(-30).map((day, i) => {
                  const height = maxViews > 0 ? (day.views / maxViews) * 100 : 0;
                  return (
                    <div
                      key={day._id}
                      className="flex-1 min-w-0 group relative"
                      style={{ height: '100%' }}
                    >
                      <div
                        className="absolute bottom-0 w-full bg-blue-500 rounded-t hover:bg-blue-400 transition-colors"
                        style={{ height: `${Math.max(height, 2)}%` }}
                      />
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-jolshaa-surface-container-high text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {day._id.slice(5)}: {day.views}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-jolshaa-on-surface-variant/60">
                <span>{viewsOverTime[0]?._id?.slice(5)}</span>
                <span>{viewsOverTime[viewsOverTime.length - 1]?._id?.slice(5)}</span>
              </div>
            </div>
          )}

          {/* Device breakdown */}
          <div className="bg-jolshaa-surface-container-low rounded-xl p-4">
            <h3 className="font-display text-sm font-medium text-jolshaa-on-surface mb-3">Device Breakdown</h3>
            <div className="space-y-3">
              <DeviceBar label="Mobile" percentage={deviceBreakdown.mobile} icon="📱" color="bg-blue-500" />
              <DeviceBar label="Desktop" percentage={deviceBreakdown.desktop} icon="🖥" color="bg-green-500" />
              <DeviceBar label="Tablet" percentage={deviceBreakdown.tablet} icon="📟" color="bg-purple-500" />
            </div>
          </div>

          {/* Total watch time */}
          <div className="text-center text-xs text-jolshaa-on-surface-variant/60">
            Total watch time: {formatDuration(totalWatchTime)}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon }) => (
  <div className="bg-jolshaa-surface-container-low rounded-xl p-3.5">
    <div className="flex items-center gap-2 mb-1.5">
      {icon}
      <span className="text-xs text-jolshaa-on-surface-variant">{label}</span>
    </div>
    <p className="text-xl font-bold text-jolshaa-on-surface">{value}</p>
  </div>
);

const DeviceBar = ({ label, percentage, icon, color }) => (
  <div className="flex items-center gap-3">
    <span className="text-sm w-5 text-center">{icon}</span>
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-jolshaa-on-surface-variant">{label}</span>
        <span className="text-xs font-medium text-jolshaa-on-surface">{percentage.toFixed(1)}%</span>
      </div>
      <div className="w-full h-1.5 bg-jolshaa-surface-container rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  </div>
);

export default VideoAnalyticsDashboard;
