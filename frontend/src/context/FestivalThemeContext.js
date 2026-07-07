import { createContext, useContext, useState, useEffect } from 'react';

const FestivalThemeContext = createContext(null);

export const FESTIVAL_THEMES = [
  { value: 'none', label: 'Default' },
  { value: 'pohela-boishakh', label: '🌸 Pohela Boishakh' },
  { value: 'victory-day', label: ' Victory Day' },
  { value: 'eid', label: '🌙 Eid' },
];

const detectFestival = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  if (month === 4 && day >= 12 && day <= 16) return 'pohela-boishakh';
  if (month === 12 && day >= 14 && day <= 18) return 'victory-day';

  return null;
};

export const FestivalThemeProvider = ({ children }) => {
  const [festival, setFestival] = useState(() => {
    const saved = localStorage.getItem('festivalTheme');
    if (saved && saved !== 'none') return saved;
    return detectFestival() || 'none';
  });

  useEffect(() => {
    localStorage.setItem('festivalTheme', festival);
    if (festival === 'none') {
      document.documentElement.removeAttribute('data-festival');
    } else {
      document.documentElement.setAttribute('data-festival', festival);
    }
  }, [festival]);

  useEffect(() => {
    const detected = detectFestival();
    if (detected && !localStorage.getItem('festivalTheme')) {
      setFestival(detected);
    }
  }, []);

  return (
    <FestivalThemeContext.Provider value={{ festival, setFestival }}>
      {children}
    </FestivalThemeContext.Provider>
  );
};

export const useFestivalTheme = () => useContext(FestivalThemeContext);
