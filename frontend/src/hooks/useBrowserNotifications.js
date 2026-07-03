import { useState, useEffect, useCallback } from 'react';

const useBrowserNotifications = () => {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'denied';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const showNotification = useCallback((title, options = {}) => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return null;

    const notification = new Notification(title, {
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: options.tag || 'jolshaa-notification',
      renotify: true,
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      if (options.onClick) options.onClick();
      notification.close();
    };

    return notification;
  }, []);

  return { permission, requestPermission, showNotification };
};

export default useBrowserNotifications;
