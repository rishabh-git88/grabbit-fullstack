import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('grabbit_user');
    const token = localStorage.getItem('grabbit_token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Traditional email/password login
  const login = async (emailOrUser, passwordOrToken) => {
    // Firebase login — user object and token passed directly
    if (typeof emailOrUser === 'object') {
      const user = emailOrUser;
      const token = passwordOrToken;
      if (user.role !== 'vendor') throw new Error('Access denied. Vendor account required.');
      localStorage.setItem('grabbit_token', token);
      localStorage.setItem('grabbit_user', JSON.stringify(user));
      setUser(user);
      return user;
    }

    // Traditional login — email and password
    const res = await authAPI.login({ email: emailOrUser, password: passwordOrToken });
    const { token, user } = res.data;
    if (user.role !== 'vendor') throw new Error('Access denied. Vendor account required.');
    localStorage.setItem('grabbit_token', token);
    localStorage.setItem('grabbit_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('grabbit_token');
    localStorage.removeItem('grabbit_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
