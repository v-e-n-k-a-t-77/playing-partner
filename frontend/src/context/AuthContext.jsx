import { createContext, useContext, useState, useEffect } from 'react';
//import axios from 'axios';
import api, { setAccessToken as setAxiosToken, setOnTokenRefreshed } from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [accessToken, setAccessTokenState] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setOnTokenRefreshed((newToken) => {
      setAccessTokenState(newToken);
    });

    const restoreSession = async () => {
      try {
     const refreshRes = await api.post('/auth/refresh');
        const newToken = refreshRes.data.accessToken;

        setAxiosToken(newToken);
        setAccessTokenState(newToken);

        const meRes = await api.get('/auth/me');
        setUser(meRes.data.user);
      } catch (err) {
        setAccessTokenState(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setAccessTokenState(res.data.accessToken);
    setAxiosToken(res.data.accessToken);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    return res.data;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setAccessTokenState(null);
    setAxiosToken(null);
    setUser(null);
  };

  const value = {
    accessToken,
    user,
    login,
    register,
    logout,
    isAuthenticated: !!accessToken,
  };

  if (loading) {
    return <div style={{ padding: 40 }}>Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}