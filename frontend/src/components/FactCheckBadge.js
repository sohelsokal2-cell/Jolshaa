import { useState } from 'react';
import API from '../api/axios';
import FactCheckVoteModal from './FactCheckVoteModal';
import WarningOverlay from './WarningOverlay';

const FactCheckBadge = ({ post, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [factCheck, setFactCheck] = useState(post.factCheck || null);

  const handleVoteUpdate = (updatedFc) => {
    setFactCheck(updatedFc);
    if (onUpdate) onUpdate(updatedFc);
  };

  // No factCheck yet — show vote button to initiate
  if (!factCheck) {
    return (
      <>
        <div className="ml-[52px] mt-1">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
            Fact Check?
          </button>
        </div>
        {showModal && (
          <FactCheckVoteModal
            postId={post._id}
            factCheck={factCheck}
            onClose={() => setShowModal(false)}
            onUpdate={handleVoteUpdate}
          />
        )}
      </>
    );
  }

  const { status, adminVerdict, adminNote, verifiedByAdmin, totalVotes } = factCheck;

  const effectiveStatus = adminVerdict || status;

  // Admin verdict badge - overrides everything
  if (verifiedByAdmin && adminVerdict) {
    return (
      <>
        <div className="ml-[52px] mt-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Verified
            {adminNote && (
              <span className="text-blue-600 font-normal">— {adminNote}</span>
            )}
          </div>
        </div>
        {effectiveStatus === 'false' && (
          <WarningOverlay
            post={post}
            factCheck={factCheck}
            isCommunity={false}
          />
        )}
      </>
    );
  }

  // Community-based badges
  const badgeConfig = {
    unverified: null,
    true: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      label: 'Seems true',
    },
    false: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      label: 'This post may be fake — stay alert',
    },
    misleading: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Misleading',
    },
  };

  const config = badgeConfig[effectiveStatus];

  if (effectiveStatus === 'false') {
    return (
      <>
        <div className="px-4 py-3 bg-red-50 border-y border-red-200">
          <div className="flex items-center gap-2">
            <span className="text-red-500 text-lg">⚠</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700">
                This post may be fake — stay alert
              </p>
              {totalVotes > 0 && (
                <p className="text-xs text-red-600/70 mt-0.5">
                  {totalVotes} people voted
                </p>
              )}
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="text-xs text-red-600 underline hover:no-underline whitespace-nowrap"
            >
              Details
            </button>
          </div>
        </div>
        <WarningOverlay
          post={post}
          factCheck={factCheck}
          isCommunity={true}
        />
        {showModal && (
          <FactCheckVoteModal
            postId={post._id}
            factCheck={factCheck}
            onClose={() => setShowModal(false)}
            onUpdate={handleVoteUpdate}
          />
        )}
      </>
    );
  }

  if (!config) {
    // unverified — show small vote button
    return (
      <>
        <div className="ml-[52px] mt-1">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
            Vote
            {totalVotes > 0 && <span className="text-jolshaa-on-surface-variant/60">({totalVotes})</span>}
          </button>
        </div>
        {showModal && (
          <FactCheckVoteModal
            postId={post._id}
            factCheck={factCheck}
            onClose={() => setShowModal(false)}
            onUpdate={handleVoteUpdate}
          />
        )}
      </>
    );
  }

  // true or misleading
  return (
    <>
      <div className="ml-[52px] mt-1">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}>
          {config.icon}
          {config.label}
          {totalVotes > 0 && (
            <span className="font-normal opacity-70">            ({totalVotes} votes)</span>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="ml-1 underline hover:no-underline opacity-70 hover:opacity-100"
          >
            Details
          </button>
        </div>
      </div>
      {showModal && (
        <FactCheckVoteModal
          postId={post._id}
          factCheck={factCheck}
          onClose={() => setShowModal(false)}
          onUpdate={handleVoteUpdate}
        />
      )}
    </>
  );
};

export default FactCheckBadge;
