import { useState } from 'react';
import API from '../api/axios';

const SponsoredPostLabel = ({ campaignId, impressionId, className = '' }) => {
  const [showInfo, setShowInfo] = useState(false);

  const handleLearnMore = async () => {
    if (impressionId && campaignId) {
      try {
        await API.post(`/ads/${campaignId}/track-click`, { impressionId });
      } catch (e) { /* ignore */ }
    }
    setShowInfo(false);
  };

  return (
    <div className={`relative inline-flex items-center gap-1 ${className}`}>
      <span className="text-xs text-jolshaa-on-surface-variant font-medium">Sponsored</span>
      <button
        onClick={() => setShowInfo(!showInfo)}
        className="w-4 h-4 rounded-full border border-jolshaa-outline-variant flex items-center justify-center text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface transition-colors"
      >
        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
        </svg>
      </button>

      {showInfo && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowInfo(false)} />
          <div className="absolute top-full left-0 mt-1 bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-lg shadow-lg p-3 z-50 w-64">
            <p className="text-sm font-medium text-jolshaa-on-surface mb-1">
              Why am I seeing this ad?
            </p>
            <p className="text-xs text-jolshaa-on-surface-variant">
              This is a sponsored post from a verified advertiser. The advertiser chose
              to show this content to you based on your profile information and interests.
            </p>
            <button
              onClick={handleLearnMore}
              className="text-xs text-jolshaa-teal mt-2 font-medium"
            >
              Learn More
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default SponsoredPostLabel;
