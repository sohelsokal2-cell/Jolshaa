import { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import Avatar from './ui/Avatar';

const HELP_TYPE_ICONS = {
  medical: '🏥', flood: '🌊', fire: '🔥', lost_person: '🔍',
  food: '🍲', shelter: '🏠', financial: '💰', other: '🆘',
};

const URGENCY_COLORS = {
  immediate: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
  within_hours: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  within_days: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
};

const URGENCY_LABELS = {
  immediate: '🔴 Immediate',
  within_hours: '🟡 Within hours',
  within_days: '🟢 Within days',
};

const HelpRequestCard = ({ request, onOfferSubmitted }) => {
  const [expanded, setExpanded] = useState(false);
  const [offerMessage, setOfferMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [offered, setOffered] = useState(false);
  const [helperCount, setHelperCount] = useState(request.helpers?.length || 0);

  const timeLeft = () => {
    const diff = new Date(request.expiresAt) - new Date();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleOffer = async () => {
    if (!offerMessage.trim() || submitting) return;
    setSubmitting(true);
    try {
      await API.post(`/help/${request._id}/offer`, { message: offerMessage });
      setOffered(true);
      setHelperCount(prev => prev + 1);
      setOfferMessage('');
      if (onOfferSubmitted) onOfferSubmitted(request._id);
    } catch (err) {
      console.error('Failed to offer help');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-card overflow-hidden">
      {/* Urgency banner */}
      <div className={`px-4 py-2 border-b ${URGENCY_COLORS[request.urgency] || URGENCY_COLORS.immediate}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">{URGENCY_LABELS[request.urgency]}</span>
          <span className="text-xs opacity-70">⏳ {timeLeft()} left</span>
        </div>
      </div>

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl">{HELP_TYPE_ICONS[request.helpType] || '🆘'}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm leading-snug">
              {request.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Link to={`/profile/${request.requester?._id}`} className="flex items-center gap-1.5 hover:underline">
                <Avatar src={request.requester?.profilePhoto} alt={request.requester?.name} size="xs" />
                <span className="text-xs text-neutral-600 dark:text-neutral-400">{request.requester?.name}</span>
              </Link>
              <span className="text-xs text-neutral-400">·</span>
              <span className="text-xs text-neutral-500">{request.location?.district}, {request.location?.division}</span>
            </div>
          </div>
        </div>

        {/* Description preview */}
        <p className={`text-sm text-neutral-600 dark:text-neutral-400 mb-3 ${expanded ? '' : 'line-clamp-2'}`}>
          {request.description}
        </p>
        {request.description.length > 100 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-primary-600 dark:text-primary-400 hover:underline mb-3"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}

        {/* Helper count */}
        <div className="flex items-center gap-2 text-xs text-neutral-500 mb-3">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {helperCount} people want to help
          </span>
          <span className="text-neutral-300 dark:text-neutral-600">·</span>
          <span>{request.viewCount || 0} views</span>
        </div>

        {/* Offer section */}
        {offered ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 text-center">
            <p className="text-sm font-medium text-green-700 dark:text-green-300">
              ✅ Offer sent!
            </p>
            <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-0.5">
              The requester will contact you
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              value={offerMessage}
              onChange={(e) => setOfferMessage(e.target.value)}
              placeholder="Describe how you can help..."
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 bg-white dark:bg-neutral-700 resize-none"
              rows={2}
            />
            <button
              onClick={handleOffer}
              disabled={!offerMessage.trim() || submitting}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>🤝</span>
                  I can help
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpRequestCard;
