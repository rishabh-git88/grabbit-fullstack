import React, { createContext, useContext, useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { authAPI } from '../api';
import { auth } from '../firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const readStoredSession = () => {
      const storedUser = localStorage.getItem('grabbit_user');
      const token = localStorage.getItem('grabbit_token');
      if (!storedUser || !token) return null;
      try {
        return JSON.parse(storedUser);
      } catch {
        localStorage.removeItem('grabbit_user');
        localStorage.removeItem('grabbit_token');
        return null;
      }
    };

    const storedUser = readStoredSession();
    if (storedUser) {
      setUser(storedUser);
      // Refresh permissions in the background. This makes newly granted vendor
      // access visible after a reload without delaying the dashboard itself.
      authAPI.me().then((res) => {
        if (!active || !res.data?.user) return;
        localStorage.setItem('grabbit_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
      }).catch(() => {
        // The shared axios interceptor handles expired credentials. Keep a
        // usable locally stored session during temporary network failures.
      });
    }

    const handleStorageChange = (event) => {
      if (event.key === 'grabbit_user' || event.key === 'grabbit_token') {
        setUser(readStoredSession());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    setLoading(false);
    return () => {
      active = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Traditional email/password login
  const login = async (emailOrUser, passwordOrToken) => {
    // Firebase login — user object and token passed directly
    if (typeof emailOrUser === 'object') {
      const user = emailOrUser;
      const token = passwordOrToken;
      localStorage.setItem('grabbit_token', token);
      localStorage.setItem('grabbit_user', JSON.stringify(user));
      setUser(user);
      return user;
    }

    // Traditional login — email and password
    const res = await authAPI.login({ email: emailOrUser, password: passwordOrToken });
    const { token, user } = res.data;
    localStorage.setItem('grabbit_token', token);
    localStorage.setItem('grabbit_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('grabbit_token');
    localStorage.removeItem('grabbit_user');
    setUser(null);
    signOut(auth).catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
