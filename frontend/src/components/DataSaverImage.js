import { useState, useRef, useEffect } from 'react';
import { useDataSaver } from '../context/DataSaverContext';

const ESTIMATED_MB = 0.2;

const DataSaverImage = ({ src, alt, className, loading }) => {
  const { dataSaver, addSavedMB } = useDataSaver();
  const [tapped, setTapped] = useState(false);
  const countedRef = useRef(false);

  useEffect(() => {
    if (dataSaver && !tapped && !countedRef.current) {
      countedRef.current = true;
      addSavedMB(ESTIMATED_MB);
    }
  }, [dataSaver, tapped, addSavedMB]);

  if (!dataSaver || tapped) {
    return <img src={src} alt={alt} className={className} loading={loading} />;
  }

  return (
    <button
      type="button"
      onClick={() => setTapped(true)}
      className={`${className} flex flex-col items-center justify-center gap-1.5 bg-jolshaa-surface-container-high text-jolshaa-on-surface-variant min-h-[160px]`}
    >
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 8h.01M20 20H4a2 2 0 01-2-2V6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2z" />
      </svg>
      <span className="text-xs font-medium">Tap to load image</span>
    </button>
  );
};

export default DataSaverImage;
