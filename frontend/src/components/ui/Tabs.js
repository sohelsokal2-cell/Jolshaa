import { useState, useRef, useEffect } from 'react';

const Tabs = ({ tabs, activeTab, onChange, className = '' }) => {
  const scrollRef = useRef(null);
  const [showRightFade, setShowRightFade] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const checkScroll = () => {
      setShowRightFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
    };

    checkScroll();
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [tabs]);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={scrollRef}
        className="flex overflow-x-auto border-b border-jolshaa-outline-variant scrollbar-hide"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.key
                ? 'border-jolshaa-teal text-jolshaa-teal'
                : 'border-transparent text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface hover:border-jolshaa-outline-variant'
            }`}
          >
            {tab.icon && tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-2xs ${
                activeTab === tab.key
                  ? 'bg-jolshaa-teal/10 text-jolshaa-teal'
                  : 'bg-jolshaa-surface-container-low text-jolshaa-on-surface-variant'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
      {showRightFade && (
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-jolshaa-surface-container-lowest to-transparent pointer-events-none" />
      )}
    </div>
  );
};

export default Tabs;
