import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';

const SharedInCommonCard = ({ profileUserId }) => {
  const [shared, setShared] = useState({ sharedGroups: [], sharedPages: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileUserId) return;
    fetchShared();
  }, [profileUserId]);

  const fetchShared = async () => {
    try {
      const res = await API.get(`/users/shared/${profileUserId}`);
      setShared(res.data);
    } catch (_) {
      // Non-critical
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-jolshaa-surface-container-lowest rounded-xl p-4">
        <div className="space-y-3">
          <div className="h-4 bg-jolshaa-surface-container rounded w-1/2" />
          <div className="h-3 bg-jolshaa-surface-container rounded w-3/4" />
          <div className="h-3 bg-jolshaa-surface-container rounded w-2/3" />
        </div>
      </div>
    );
  }

  const total = shared.sharedGroups.length + shared.sharedPages.length;
  if (total === 0) return null;

  return (
    <div className="bg-jolshaa-surface-container-lowest rounded-xl p-4">
      <h3 className="text-sm font-semibold text-jolshaa-on-surface mb-3">
        Shared in common
      </h3>

      <div className="space-y-2">
        {shared.sharedGroups.map((group) => (
          <Link
            key={group._id}
            to={`/groups/${group._id}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-jolshaa-surface-container transition-colors"
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-jolshaa-surface-container flex-shrink-0">
              {group.avatar ? (
                <img src={group.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-jolshaa-on-surface-variant">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-jolshaa-on-surface truncate">{group.name}</p>
              <p className="text-xs text-jolshaa-on-surface-variant">{group.members?.length || 0} members</p>
            </div>
          </Link>
        ))}

        {shared.sharedPages.map((page) => (
          <Link
            key={page._id}
            to={`/pages/${page._id}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-jolshaa-surface-container transition-colors"
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-jolshaa-surface-container flex-shrink-0">
              {page.avatar ? (
                <img src={page.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-jolshaa-on-surface-variant">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-jolshaa-on-surface truncate">{page.name}</p>
              <p className="text-xs text-jolshaa-on-surface-variant">{page.followers?.length || 0} followers</p>
            </div>
          </Link>
        ))}
      </div>

      {total > 5 && (
        <p className="text-xs text-jolshaa-on-surface-variant mt-2 text-center">
          And {total - 5} more...
        </p>
      )}
    </div>
  );
};

export default SharedInCommonCard;
