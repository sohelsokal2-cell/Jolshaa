import { createContext, useContext, useState, useEffect, useRef } from 'react';
import API from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef(null); // In-memory token for socket.io

  useEffect(() => {
    // With httpOnly cookies, we try to fetch the user profile
    // The cookie is sent automatically with the request
    API.get('/auth/me')
      .then(res => {
        setUser(res.data);
        // Fetch a fresh token for socket.io auth
        return API.get('/auth/socket-token');
      })
      .then(res => {
        tokenRef.current = res.data.token;
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    tokenRef.current = res.data.token; // Store in memory for socket.io
    setUser(res.data.user);
    return res.data;
  };

  const signup = async (name, email, password) => {
    const res = await API.post('/auth/signup', { name, email, password });
    tokenRef.current = res.data.token; // Store in memory for socket.io
    setUser(res.data.user);
    return res.data;
  };

  const logout = async () => {
    try {
      await API.post('/auth/logout');
    } catch (_) {
      // ignore errors — still clear local state
    } finally {
      tokenRef.current = null;
      setUser(null);
    }
  };

  const getToken = () => tokenRef.current;

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
