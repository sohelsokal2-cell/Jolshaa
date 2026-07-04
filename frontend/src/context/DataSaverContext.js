import { createContext, useContext, useState, useEffect } from 'react';

const DataSaverContext = createContext(null);

export const DataSaverProvider = ({ children }) => {
  const [dataSaver, setDataSaver] = useState(() => {
    const saved = localStorage.getItem('dataSaver');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('dataSaver', JSON.stringify(dataSaver));
  }, [dataSaver]);

  const toggleDataSaver = () => setDataSaver((prev) => !prev);

  return (
    <DataSaverContext.Provider value={{ dataSaver, toggleDataSaver }}>
      {children}
    </DataSaverContext.Provider>
  );
};

export const useDataSaver = () => useContext(DataSaverContext);
