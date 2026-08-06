import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { cafeAPI } from './api';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Orders from './pages/Orders';
import Menu from './pages/Menu';
import Settings from './pages/Settings';
import './index.css';

const ProtectedLayout = () => {
  const { user, loading } = useAuth();
  const [cafe, setCafe] = useState(null);
  const [cafeOpen, setCafeOpen] = useState(false);

  useEffect(() => {
    if (user?.cafeId) {
      cafeAPI.getMenu(user.cafeId).then(res => {
        setCafe(res.data.cafe);
        setCafeOpen(res.data.cafe.isOpen);
      }).catch(() => {});
    }
  }, [user]);

  const handleToggleOpen = async () => {
    try {
      await cafeAPI.updateStatus(cafe._id, !cafeOpen);
      setCafeOpen(v => !v);
    } catch {}
  };

  if (loading) return (
    <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center">
      <div className="text-[#FF6B2C] font-display text-xl animate-pulse">Loading…</div>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-[#1A1A2E]">
      <Sidebar cafe={cafe} isOpen={cafeOpen} onToggleOpen={handleToggleOpen} />
      <main className="flex-1 ml-64 p-8 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <Routes>
            <Route path="/" element={<Orders cafe={cafe} />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/settings" element={<Settings cafe={cafe} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { background: '#16213E', color: '#F0F0F0', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' },
        }} />
        <Routes>
          <Route path="/login" element={<LoginGuard />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

const LoginGuard = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Login />;
};

export default App;
