import { useEffect } from 'react';

const Drawer = ({ isOpen, onClose, title, children, width = 'max-w-lg' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className={`fixed top-0 right-0 h-full w-full ${width} bg-jolshaa-surface-container-lowest shadow-ambient-hover z-50 transform transition-transform duration-200 ease-in-out`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-jolshaa-outline-variant">
          <h2 className="text-lg font-semibold font-display text-jolshaa-on-surface">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-jolshaa-surface-container-low transition-colors"
          >
            <svg className="w-5 h-5 text-jolshaa-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100vh-65px)]">
          {children}
        </div>
      </div>
    </>
  );
};

export default Drawer;
