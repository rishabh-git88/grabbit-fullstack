import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('grabbit_student_user');
    const token = localStorage.getItem('grabbit_student_token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (userOrEmail, tokenOrPassword) => {
    if (typeof userOrEmail === 'object') {
      const user = userOrEmail;
      const token = tokenOrPassword;
      localStorage.setItem('grabbit_student_token', token);
      localStorage.setItem('grabbit_student_user', JSON.stringify(user));
      setUser(user);
      return user;
    }
  };

  const logout = () => {
    localStorage.removeItem('grabbit_student_token');
    localStorage.removeItem('grabbit_student_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
