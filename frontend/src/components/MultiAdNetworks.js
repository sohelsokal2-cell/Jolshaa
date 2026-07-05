import { useEffect, useRef, useState } from 'react';
import API from '../api/axios';
import { validateAdScript, safeSetInnerHTML } from '../utils/domPurify';

// Inject ad script dynamically
const injectScript = (script, id) => {
  if (!script) return;
  if (document.getElementById(id)) return;
  
  const validatedScript = validateAdScript(script);
  if (!validatedScript) return;
  
  const div = document.createElement('div');
  div.id = id;
  safeSetInnerHTML(div, validatedScript);
  document.body.appendChild(div);
};

// Popunder Ad - shows on first click
export const PopunderAd = () => {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    API.get('/ad-networks/config').then(res => {
      if (!res.data.enabled) return;
      for (const [name, network] of Object.entries(res.data.networks || {})) {
        if (network.adFormats?.popunder?.script) {
          injectScript(network.adFormats.popunder.script, `popunder-${name}`);
          break; // Load only highest priority network's popunder
        }
      }
    }).catch(() => {});
  }, []);

  return null;
};

// Social Bar Ad - floating bottom bar
export const SocialBarAd = () => {
  const containerRef = useRef(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    API.get('/ad-networks/config').then(res => {
      if (!res.data.enabled || !containerRef.current) return;
      for (const [name, network] of Object.entries(res.data.networks || {})) {
        if (network.adFormats?.socialBar?.script) {
          const validatedScript = validateAdScript(network.adFormats.socialBar.script);
          if (validatedScript) {
            const div = document.createElement('div');
            safeSetInnerHTML(div, validatedScript);
            containerRef.current.appendChild(div);
          }
          break;
        }
      }
    }).catch(() => {});
  }, []);

  return <div ref={containerRef} className="ad-network-social-bar" />;
};

// Native Banner Ad - content-style ad
export const NativeBannerAd = ({ className = '', networkName = null }) => {
  const containerRef = useRef(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    API.get('/ad-networks/config').then(res => {
      if (!res.data.enabled || !containerRef.current) return;
      for (const [name, network] of Object.entries(res.data.networks || {})) {
        if (networkName && name !== networkName) continue;
        if (network.adFormats?.nativeBanner?.script) {
          const validatedScript = validateAdScript(network.adFormats.nativeBanner.script);
          if (validatedScript) {
            const div = document.createElement('div');
            safeSetInnerHTML(div, validatedScript);
            containerRef.current.appendChild(div);
          }
          if (!networkName) break;
        }
      }
    }).catch(() => {});
  }, [networkName]);

  return (
    <div
      ref={containerRef}
      className={`ad-network-native-banner ${className}`}
      style={{ minHeight: 250 }}
    />
  );
};

// Video Ad - pre-roll or mid-roll
export const VideoAd = ({ onAdComplete, networkName = null }) => {
  const containerRef = useRef(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    API.get('/ad-networks/config').then(res => {
      if (!res.data.enabled || !containerRef.current) {
        if (onAdComplete) onAdComplete();
        return;
      }
      for (const [name, network] of Object.entries(res.data.networks || {})) {
        if (networkName && name !== networkName) continue;
        if (network.adFormats?.video?.script) {
          const validatedScript = validateAdScript(network.adFormats.video.script);
          if (validatedScript) {
            const div = document.createElement('div');
            safeSetInnerHTML(div, validatedScript);
            containerRef.current.appendChild(div);
          }
          setTimeout(() => {
            if (onAdComplete) onAdComplete();
          }, 30000);
          return;
        }
      }
      if (onAdComplete) onAdComplete();
    }).catch(() => {
      if (onAdComplete) onAdComplete();
    });
  }, [onAdComplete, networkName]);

  return (
    <div
      ref={containerRef}
      className="ad-network-video-ad absolute inset-0 flex items-center justify-center bg-black/80 z-50"
    />
  );
};

// Interstitial Ad - full page ad
export const InterstitialAd = ({ onClose }) => {
  const containerRef = useRef(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    API.get('/ad-networks/config').then(res => {
      if (!res.data.enabled || !containerRef.current) return;
      for (const [name, network] of Object.entries(res.data.networks || {})) {
        if (network.adFormats?.interstitial?.script) {
          const validatedScript = validateAdScript(network.adFormats.interstitial.script);
          if (validatedScript) {
            const div = document.createElement('div');
            safeSetInnerHTML(div, validatedScript);
            containerRef.current.appendChild(div);
          }
          break;
        }
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div ref={containerRef} className="relative max-w-lg w-full mx-4" />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-3xl font-bold hover:text-gray-300 z-50"
      >
        ×
      </button>
    </div>
  );
};

// Banner Ad - standard banner
export const BannerAd = ({ size = '728x90', className = '' }) => {
  const containerRef = useRef(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    API.get('/ad-networks/config').then(res => {
      if (!res.data.enabled || !containerRef.current) return;
      for (const [name, network] of Object.entries(res.data.networks || {})) {
        if (network.adFormats?.banner?.script) {
          const validatedScript = validateAdScript(network.adFormats.banner.script);
          if (validatedScript) {
            const div = document.createElement('div');
            safeSetInnerHTML(div, validatedScript);
            containerRef.current.appendChild(div);
          }
          break;
        }
      }
    }).catch(() => {});
  }, []);

  const [width, height] = size.split('x');

  return (
    <div
      ref={containerRef}
      className={`ad-network-banner ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
};

// Master component that loads all enabled ads globally
export const MultiAdNetworks = () => {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    API.get('/ad-networks/config').then(res => {
      if (!res.data.enabled) return;

      // Load ads from all enabled networks by priority
      for (const [name, network] of Object.entries(res.data.networks || {})) {
        if (network.adFormats?.popunder?.script) {
          injectScript(network.adFormats.popunder.script, `popunder-${name}`);
        }
        if (network.adFormats?.socialBar?.script) {
          injectScript(network.adFormats.socialBar.script, `social-bar-${name}`);
        }
        if (network.adFormats?.nativeBanner?.script) {
          injectScript(network.adFormats.nativeBanner.script, `native-banner-${name}`);
        }
        if (network.adFormats?.video?.script) {
          injectScript(network.adFormats.video.script, `video-${name}`);
        }
        if (network.adFormats?.interstitial?.script) {
          injectScript(network.adFormats.interstitial.script, `interstitial-${name}`);
        }
        if (network.adFormats?.banner?.script) {
          injectScript(network.adFormats.banner.script, `banner-${name}`);
        }
        if (network.adFormats?.directLink?.script) {
          injectScript(network.adFormats.directLink.script, `direct-link-${name}`);
        }
      }
    }).catch(() => {});
  }, []);

  return null;
};

// Feed Ad - insert ad between posts
export const FeedAd = ({ position = 0, frequency = 3 }) => {
  const containerRef = useRef(null);
  const [hasAd, setHasAd] = useState(false);

  useEffect(() => {
    if ((position + 1) % frequency !== 0) return;

    API.get('/ad-networks/config').then(res => {
      if (!res.data.enabled || !containerRef.current) return;
      for (const [name, network] of Object.entries(res.data.networks || {})) {
        if (network.adFormats?.nativeBanner?.script) {
          const validatedScript = validateAdScript(network.adFormats.nativeBanner.script);
          if (validatedScript) {
            const div = document.createElement('div');
            safeSetInnerHTML(div, validatedScript);
            containerRef.current.appendChild(div);
            setHasAd(true);
          }
          break;
        }
      }
    }).catch(() => {});
  }, [position, frequency]);

  if (!hasAd) return null;

  return (
    <div className="my-4 p-3 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
      <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
        <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
        Sponsored
      </div>
      <div ref={containerRef} />
    </div>
  );
};

export default MultiAdNetworks;
