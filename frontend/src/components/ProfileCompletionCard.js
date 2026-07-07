import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const DISMISS_KEY = 'jolshaa_profile_completion_dismissed';
const DISMISS_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

const ProfileCompletionCard = () => {
  const [completion, setCompletion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt && Date.now() - Number(dismissedAt) < DISMISS_TTL) {
      setDismissed(true);
      setLoading(false);
      return;
    }
    fetchCompletion();
  }, []);

  const fetchCompletion = async () => {
    try {
      const res = await API.get('/users/profile-completion');
      setCompletion(res.data);
    } catch (_) {
      // Non-critical
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  const getMissingPath = useCallback((key) => {
    switch (key) {
      case 'profilePhoto':
      case 'coverPhoto':
        return null; // handled in modal
      case 'bio':
        return null; // handled in modal
      case 'workHistory':
        return null; // handled in modal
      case 'educationHistory':
        return null; // handled in modal
      case 'dateOfBirth':
      case 'gender':
        return null; // handled in modal
      case 'post':
        return null; // handled in modal
      default:
        return null;
    }
  }, []);

  if (loading || dismissed || !completion || completion.percentage === 100) return null;

  return (
    <div className="bg-jolshaa-surface-container-lowest rounded-xl p-4 border border-jolshaa-outline-variant relative">
      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-jolshaa-teal/15 flex items-center justify-center">
          <svg className="w-5 h-5 text-jolshaa-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-jolshaa-on-surface">
            Profile {completion.percentage}% Complete
          </p>
          <p className="text-xs text-jolshaa-on-surface-variant">
            Complete your profile to get the most out of Jolshaa
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-jolshaa-surface-container rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-jolshaa-teal rounded-full transition-all duration-500"
          style={{ width: `${completion.percentage}%` }}
        />
      </div>

      {/* Missing Items */}
      {completion.missingLabels && completion.missingLabels.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {completion.missingLabels.map((item) => (
            <button
              key={item.key}
              onClick={() => navigate('/edit-profile')}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-jolshaa-surface-container text-jolshaa-on-surface-variant rounded-full border border-jolshaa-outline-variant hover:bg-jolshaa-surface-container-low hover:border-jolshaa-teal hover:text-jolshaa-teal transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileCompletionCard;
