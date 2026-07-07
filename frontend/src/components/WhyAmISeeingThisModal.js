const WhyAmISeeingThisModal = ({ reasons, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div
        className="bg-jolshaa-surface-container-lowest rounded-2xl shadow-ambient-hover max-w-sm w-full p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-base font-bold text-jolshaa-on-surface mb-3">
          Why am I seeing this?
        </h3>
        <ul className="space-y-2 mb-4">
          {(reasons && reasons.length > 0 ? reasons : ['Based on your activity on Jolshaa']).map((reason, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-jolshaa-on-surface-variant">
              <span className="text-jolshaa-teal mt-0.5">•</span>
              {reason}
            </li>
          ))}
        </ul>
        <p className="text-xs text-jolshaa-on-surface-variant/70 mb-4">
          Jolshaa ranks your feed using signals like your friends, follows, engagement and recency — not paid placement, unless a post is marked "Boosted".
        </p>
        <button
          onClick={onClose}
          className="w-full py-2 rounded-xl bg-jolshaa-surface-container-high text-sm font-medium text-jolshaa-on-surface hover:bg-jolshaa-surface-container-highest transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default WhyAmISeeingThisModal;
