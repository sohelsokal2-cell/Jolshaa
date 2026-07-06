import { createContext, useContext, useState, useEffect } from 'react';

const FestivalThemeContext = createContext(null);

export const FESTIVAL_THEMES = [
  { value: 'none', label: 'Default' },
  { value: 'pohela-boishakh', label: '🌸 Pohela Boishakh' },
  { value: 'eid', label: '🌙 Eid' },
];

export const FestivalThemeProvider = ({ children }) => {
  const [festival, setFestival] = useState(() => localStorage.getItem('festivalTheme') || 'none');

  useEffect(() => {
    localStorage.setItem('festivalTheme', festival);
    if (festival === 'none') {
      document.documentElement.removeAttribute('data-festival');
    } else {
      document.documentElement.setAttribute('data-festival', festival);
    }
  }, [festival]);

  return (
    <FestivalThemeContext.Provider value={{ festival, setFestival }}>
      {children}
    </FestivalThemeContext.Provider>
  );
};

export const useFestivalTheme = () => useContext(FestivalThemeContext);
