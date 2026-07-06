import { createContext, useContext, useState, useEffect } from 'react';

const DataSaverContext = createContext(null);

export const DataSaverProvider = ({ children }) => {
  const [dataSaver, setDataSaver] = useState(() => {
    const saved = localStorage.getItem('dataSaver');
    return saved ? JSON.parse(saved) : false;
  });
  const [mbSaved, setMbSaved] = useState(() => {
    const saved = localStorage.getItem('dataSaverMbSaved');
    return saved ? JSON.parse(saved) : 0;
  });

  useEffect(() => {
    localStorage.setItem('dataSaver', JSON.stringify(dataSaver));
  }, [dataSaver]);

  useEffect(() => {
    localStorage.setItem('dataSaverMbSaved', JSON.stringify(mbSaved));
  }, [mbSaved]);

  const toggleDataSaver = () => setDataSaver((prev) => !prev);
  const setDataSaverEnabled = (value) => setDataSaver(value);
  const addSavedMB = (mb) => setMbSaved((prev) => Math.round((prev + mb) * 100) / 100);

  return (
    <DataSaverContext.Provider value={{ dataSaver, toggleDataSaver, setDataSaverEnabled, mbSaved, addSavedMB }}>
      {children}
    </DataSaverContext.Provider>
  );
};

export const useDataSaver = () => useContext(DataSaverContext);
