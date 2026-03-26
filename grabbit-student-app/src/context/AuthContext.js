import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        const [token, userStr] = await AsyncStorage.multiGet(['grabbit_token', 'grabbit_user']);
        if (token[1] && userStr[1]) setUser(JSON.parse(userStr[1]));
      } catch {}
      setLoading(false);
    };
    restore();
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user } = res.data;
    if (user.role !== 'student') throw new Error('Please use the vendor dashboard.');
    await AsyncStorage.multiSet([['grabbit_token', token], ['grabbit_user', JSON.stringify(user)]]);
    setUser(user);
    return user;
  };

  const register = async (name, email, password) => {
    const res = await authAPI.register({ name, email, password, role: 'student' });
    const { token, user } = res.data;
    await AsyncStorage.multiSet([['grabbit_token', token], ['grabbit_user', JSON.stringify(user)]]);
    setUser(user);
    return user;
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['grabbit_token', 'grabbit_user']);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
