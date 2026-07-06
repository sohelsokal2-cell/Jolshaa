import { useEffect, useRef, useState } from 'react';

const TurnstileCaptcha = ({ onTokenChange, onErrorChange, theme = 'auto' }) => {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [error, setError] = useState('');

  const siteKey = process.env.REACT_APP_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) {
      setError('');
      return undefined;
    }

    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile) {
        return;
      }

      if (widgetIdRef.current !== null) {
        return;
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        callback: (token) => {
          onTokenChange?.(token);
          setError('');
        },
        'expired-callback': () => {
          onTokenChange?.('');
          setError('Captcha expired. Please verify again.');
        },
        'error-callback': () => {
          onTokenChange?.('');
          setError('Captcha failed to load. Please try again.');
        },
      });
    };

    if (window.turnstile) {
      renderWidget();
      return undefined;
    }

    const scriptId = 'turnstile-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      script.onload = renderWidget;
      script.onerror = () => {
        const message = 'Captcha script failed to load.';
        setError(message);
        onErrorChange?.(message);
      };
      document.body.appendChild(script);
    } else {
      renderWidget();
    }

    return () => {
      if (widgetIdRef.current !== null && window.turnstile?.remove) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, theme, onTokenChange, onErrorChange]);

  if (!siteKey) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="flex justify-center" />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default TurnstileCaptcha;
