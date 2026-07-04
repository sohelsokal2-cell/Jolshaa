import { useEffect, useRef } from 'react';
import API from '../api/axios';

// Dynamically inject ad scripts from Adsterra
const injectScript = (script, id) => {
  if (!script) return;
  // Check if already injected
  if (document.getElementById(id)) return;
  const div = document.createElement('div');
  div.id = id;
  div.innerHTML = script;
  document.body.appendChild(div);
};

// Popunder Ad - shows on first click
export const PopunderAd = () => {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    API.get('/adsterra/config').then(res => {
      if (res.data.enabled && res.data.popunder?.script) {
        injectScript(res.data.popunder.script, 'adsterra-popunder');
      }
    }).catch(() => {});
  }, []);

  return null; // Popunder is invisible, script handles display
};

// Social Bar Ad - floating bar at bottom
export const SocialBarAd = () => {
  const containerRef = useRef(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    API.get('/adsterra/config').then(res => {
      if (res.data.enabled && res.data.socialBar?.script && containerRef.current) {
        const div = document.createElement('div');
        div.innerHTML = res.data.socialBar.script;
        containerRef.current.appendChild(div);
      }
    }).catch(() => {});
  }, []);

  return <div ref={containerRef} className="adsterra-social-bar" />;
};

// Native Banner Ad - content-style ad
export const NativeBannerAd = ({ className = '' }) => {
  const containerRef = useRef(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    API.get('/adsterra/config').then(res => {
      if (res.data.enabled && res.data.nativeBanner?.script && containerRef.current) {
        const div = document.createElement('div');
        div.innerHTML = res.data.nativeBanner.script;
        containerRef.current.appendChild(div);
      }
    }).catch(() => {});
  }, []);

  return (
    <div
      ref={containerRef}
      className={`adsterra-native-banner ${className}`}
      style={{ minHeight: 250 }}
    />
  );
};

// Video Ad - pre-roll or mid-roll video ad
export const VideoAd = ({ onAdComplete }) => {
  const containerRef = useRef(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    API.get('/adsterra/config').then(res => {
      if (res.data.enabled && res.data.video?.script && containerRef.current) {
        const div = document.createElement('div');
        div.innerHTML = res.data.video.script;
        containerRef.current.appendChild(div);
        // Notify parent when ad completes (after 30s timeout)
        setTimeout(() => {
          if (onAdComplete) onAdComplete();
        }, 30000);
      } else {
        // No ad available, skip immediately
        if (onAdComplete) onAdComplete();
      }
    }).catch(() => {
      if (onAdComplete) onAdComplete();
    });
  }, [onAdComplete]);

  return (
    <div
      ref={containerRef}
      className="adsterra-video-ad absolute inset-0 flex items-center justify-center bg-black/80 z-50"
    />
  );
};

// Master component that loads all enabled ads
export const AdsterraAds = () => {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    // Load all enabled ad formats
    API.get('/adsterra/config').then(res => {
      if (!res.data.enabled) return;

      if (res.data.popunder?.script) {
        injectScript(res.data.popunder.script, 'adsterra-popunder');
      }
      if (res.data.socialBar?.script) {
        injectScript(res.data.socialBar.script, 'adsterra-social-bar');
      }
      if (res.data.nativeBanner?.script) {
        injectScript(res.data.nativeBanner.script, 'adsterra-native-banner');
      }
    }).catch(() => {});
  }, []);

  return null;
};

export default AdsterraAds;
