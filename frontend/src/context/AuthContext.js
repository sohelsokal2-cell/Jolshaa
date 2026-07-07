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

  const login = async (email, password, turnstileToken = '') => {
    const res = await API.post('/auth/login', { email, password, turnstileToken });
    if (res.data.requires2FA) {
      return res.data;
    }
    setUser(res.data.user);
    // Fetch socket token separately (stored in memory only)
    try {
      const tokenRes = await API.get('/auth/socket-token');
      tokenRef.current = tokenRes.data.token;
    } catch (_) { /* socket token fetch failed, will retry on next action */ }
    return res.data;
  };

  const verifyLogin2FA = async (userId, code) => {
    const res = await API.post('/auth/login/2fa', { userId, code });
    setUser(res.data.user);
    try {
      const tokenRes = await API.get('/auth/socket-token');
      tokenRef.current = tokenRes.data.token;
    } catch (_) { /* socket token fetch failed */ }
    return res.data;
  };

  const signup = async (name, email, password, turnstileToken = '') => {
    const res = await API.post('/auth/signup', { name, email, password, turnstileToken });
    setUser(res.data.user);
    try {
      const tokenRes = await API.get('/auth/socket-token');
      tokenRef.current = tokenRes.data.token;
    } catch (_) { /* socket token fetch failed */ }
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
    setUser(prev => ({ ...prev, ...updatedUser }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyLogin2FA, signup, logout, updateUser, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
