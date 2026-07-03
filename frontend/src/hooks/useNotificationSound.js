import { useCallback, useRef } from 'react';

const NOTIFICATION_SOUNDS = {
  message: 'data:audio/wav;base64,UklGRl9vT19teleXAVlbm5ZUmFtZQ==',
};

const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    // Silently fail if audio context not available
  }
};

const useNotificationSound = () => {
  const enabledRef = useRef(true);

  const play = useCallback(() => {
    if (enabledRef.current) {
      playNotificationSound();
    }
  }, []);

  const setEnabled = useCallback((enabled) => {
    enabledRef.current = enabled;
  }, []);

  return { play, setEnabled };
};

export default useNotificationSound;
