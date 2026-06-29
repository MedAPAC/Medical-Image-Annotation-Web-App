import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

import { apiUrl } from './config/api';

const AuthContext = createContext();
const AUTH_HEADER = 'Authorization';

const readStoredUser = () => {
  try {
    const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user');
    if (storedUser && !sessionStorage.getItem('user')) {
      sessionStorage.setItem('user', storedUser);
      localStorage.removeItem('user');
    }
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error('Failed to read stored user:', error);
    sessionStorage.removeItem('user');
    localStorage.removeItem('user');
    return null;
  }
};

const setAxiosToken = (nextToken) => {
  if (nextToken) {
    axios.defaults.headers.common[AUTH_HEADER] = `Bearer ${nextToken}`;
  } else {
    delete axios.defaults.headers.common[AUTH_HEADER];
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => {
    const storedToken = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (storedToken && !sessionStorage.getItem('token')) {
      sessionStorage.setItem('token', storedToken);
      localStorage.removeItem('token');
    }
    setAxiosToken(storedToken);
    return storedToken;
  });

  const clearSession = useCallback(() => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAxiosToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const applySession = useCallback((nextToken, nextUser) => {
    if (nextToken) {
      sessionStorage.setItem('token', nextToken);
      setAxiosToken(nextToken);
      setToken(nextToken);
    }

    if (nextUser) {
      sessionStorage.setItem('user', JSON.stringify(nextUser));
      setUser(nextUser);
    }
  }, []);

  const updateUser = useCallback((nextUser, nextToken) => {
    if (nextToken) {
      sessionStorage.setItem('token', nextToken);
      setAxiosToken(nextToken);
      setToken(nextToken);
    }

    if (!nextUser) return;

    setUser((currentUser) => {
      const mergedUser = {
        ...(currentUser || {}),
        ...nextUser,
      };
      sessionStorage.setItem('user', JSON.stringify(mergedUser));
      return mergedUser;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const verifyToken = async () => {
      if (!token) {
        setAxiosToken(null);
        setUser(null);
        if (!cancelled) setLoading(false);
        return;
      }

      setAxiosToken(token);
      setLoading(true);

      try {
        const response = await axios.get(apiUrl('/api/auth/verify'));
        if (!cancelled) {
          updateUser(response.data.user);
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        if (!cancelled) {
          clearSession();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    verifyToken();

    return () => {
      cancelled = true;
    };
  }, [token, clearSession, updateUser]);

  const login = useCallback(async (email, password) => {
    try {
      const response = await axios.post(apiUrl('/api/auth/login'), {
        email,
        password
      });

      const { token: newToken, user: userData } = response.data;
      applySession(newToken, userData);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  }, [applySession]);

  const signup = useCallback(async (name, email, password) => {
    try {
      const response = await axios.post(apiUrl('/api/auth/signup'), {
        name,
        email,
        password
      });

      const { token: newToken, user: userData } = response.data;
      applySession(newToken, userData);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Signup failed'
      };
    }
  }, [applySession]);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo(() => ({
    user,
    token,
    loading,
    login,
    signup,
    logout,
    updateUser,
    isAuthenticated: Boolean(token && user)
  }), [user, token, loading, login, signup, logout, updateUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
