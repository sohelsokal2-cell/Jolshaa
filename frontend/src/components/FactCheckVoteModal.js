import { useState, useEffect } from 'react';
import API from '../api/axios';

const FactCheckVoteModal = ({ postId, factCheck: initialFc, onClose, onUpdate }) => {
  const [stats, setStats] = useState(null);
  const [userVote, setUserVote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [postId]);

  const fetchStats = async () => {
    try {
      const res = await API.get(`/posts/${postId}/factcheck/stats`);
      setStats(res.data);
      setUserVote(res.data.userVote);
    } catch (err) {
      console.error('Failed to fetch fact-check stats');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (voteType) => {
    if (voting) return;
    setVoting(true);
    try {
      const res = await API.post(`/posts/${postId}/factcheck/vote`, { vote: voteType });
      setUserVote(res.data.userVote);
      // Refresh stats
      const statsRes = await API.get(`/posts/${postId}/factcheck/stats`);
      setStats(statsRes.data);
      if (onUpdate) {
        onUpdate({
          status: statsRes.data.status,
          totalVotes: statsRes.data.totalVotes,
          adminVerdict: statsRes.data.adminVerdict,
          verifiedByAdmin: statsRes.data.verifiedByAdmin,
          flaggedForReview: statsRes.data.flaggedForReview,
        });
      }
    } catch (err) {
      console.error('Failed to vote');
    } finally {
      setVoting(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    try {
      await API.post(`/posts/${postId}/factcheck/report`, { reason: reportReason });
      setReportSubmitted(true);
      setReportReason('');
    } catch (err) {
      console.error('Failed to submit report');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
          <div className="text-center text-neutral-500">Loading...</div>
        </div>
      </div>
    );
  }

  const dist = stats?.distribution || { true: 0, false: 0, misleading: 0 };
  const counts = stats?.counts || { true: 0, false: 0, misleading: 0 };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              Fact Check?
            </h3>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Admin verdict banner */}
        {stats?.adminVerdict && (
          <div className="px-5 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Verified: {stats.adminVerdict === 'true' ? 'True' : stats.adminVerdict === 'false' ? 'Fake' : 'Misleading'}
                </p>
                {stats.adminNote && (
                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70">{stats.adminNote}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Vote buttons */}
        <div className="p-5">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            Share your opinion on this post:
          </p>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
            <button
              onClick={() => handleVote('true')}
              disabled={voting}
              className={`flex flex-col items-center gap-1 sm:gap-1.5 p-2 sm:p-3 rounded-xl border-2 transition-all ${
                userVote === 'true'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : 'border-neutral-200 dark:border-neutral-700 hover:border-green-300 dark:hover:border-green-700 text-neutral-600 dark:text-neutral-400'
              } ${voting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className="text-xl sm:text-2xl">✓</span>
                <span className="text-[10px] sm:text-xs font-medium leading-tight">True</span>
            </button>

            <button
              onClick={() => handleVote('false')}
              disabled={voting}
              className={`flex flex-col items-center gap-1 sm:gap-1.5 p-2 sm:p-3 rounded-xl border-2 transition-all ${
                userVote === 'false'
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                  : 'border-neutral-200 dark:border-neutral-700 hover:border-red-300 dark:hover:border-red-700 text-neutral-600 dark:text-neutral-400'
              } ${voting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className="text-xl sm:text-2xl">✗</span>
                <span className="text-[10px] sm:text-xs font-medium leading-tight">Fake</span>
            </button>

            <button
              onClick={() => handleVote('misleading')}
              disabled={voting}
              className={`flex flex-col items-center gap-1 sm:gap-1.5 p-2 sm:p-3 rounded-xl border-2 transition-all ${
                userVote === 'misleading'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                  : 'border-neutral-200 dark:border-neutral-700 hover:border-orange-300 dark:hover:border-orange-700 text-neutral-600 dark:text-neutral-400'
              } ${voting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className="text-xl sm:text-2xl">~</span>
                <span className="text-[10px] sm:text-xs font-medium leading-tight">Misleading</span>
            </button>
          </div>

          {/* Vote distribution bar */}
          {stats?.totalVotes > 0 && (
            <div className="mb-5">
              <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">
                <span>Vote Distribution</span>
                <span>{stats.totalVotes} people voted</span>
              </div>
              <div className="h-3 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden flex">
                {dist.true > 0 && (
                  <div
                    className="bg-green-500 transition-all duration-500"
                    style={{ width: `${dist.true}%` }}
                    title={`True: ${dist.true}%`}
                  />
                )}
                {dist.false > 0 && (
                  <div
                    className="bg-red-500 transition-all duration-500"
                    style={{ width: `${dist.false}%` }}
                    title={`Fake: ${dist.false}%`}
                  />
                )}
                {dist.misleading > 0 && (
                  <div
                    className="bg-orange-500 transition-all duration-500"
                    style={{ width: `${dist.misleading}%` }}
                    title={`Misleading: ${dist.misleading}%`}
                  />
                )}
              </div>
              <div className="flex justify-between mt-1.5 text-xs">
                <span className="text-green-600 dark:text-green-400">✓ {dist.true}%</span>
                <span className="text-red-600 dark:text-red-400">✗ {dist.false}%</span>
                <span className="text-orange-600 dark:text-orange-400">~ {dist.misleading}%</span>
              </div>
            </div>
          )}

          {/* Report section */}
          <div className="border-t border-neutral-100 dark:border-neutral-700 pt-4">
            {!showReportForm ? (
              <button
                onClick={() => setShowReportForm(true)}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                Want to report?
              </button>
            ) : (
              <div className="space-y-3">
                {reportSubmitted ? (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Your report has been submitted. Thank you!
                  </p>
                ) : (
                  <>
                    <textarea
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="Why do you think this is false information..."
                      className="w-full border border-neutral-300 dark:border-neutral-600 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 bg-white dark:bg-neutral-700 resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleReport}
                        disabled={!reportReason.trim()}
                        className="px-4 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                      >
                        Submit
                      </button>
                      <button
                        onClick={() => { setShowReportForm(false); setReportReason(''); }}
                        className="px-4 py-1.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-lg text-sm font-medium hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FactCheckVoteModal;
