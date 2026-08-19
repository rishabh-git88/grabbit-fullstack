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
import StudentHome from './student/pages/Home';
import StudentMenu from './student/pages/Menu';
import StudentCart from './student/pages/Cart';
import StudentOrderTracking from './student/pages/OrderTracking';
import StudentOrders from './student/pages/Orders';
import { CartProvider } from './student/context/CartContext';
import './index.css';

const VendorLayout = () => {
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
  if (user.role !== 'vendor') return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen bg-[#1A1A2E]">
      <Sidebar cafe={cafe} isOpen={cafeOpen} onToggleOpen={handleToggleOpen} />
      <main className="flex-1 ml-64 p-8 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <Routes>
            <Route index element={<Orders cafe={cafe} />} />
            <Route path="menu" element={<Menu />} />
            <Route path="settings" element={<Settings cafe={cafe} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{
            style: { background: '#16213E', color: '#F0F0F0', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' },
          }} />
          <Routes>
            <Route path="/login" element={<LoginGuard />} />
            <Route path="/vendor/*" element={<VendorLayout />} />
            <Route path="/" element={<StudentRoute><StudentHome /></StudentRoute>} />
            <Route path="/menu/:cafeId" element={<StudentRoute><StudentMenu /></StudentRoute>} />
            <Route path="/cart" element={<StudentRoute><StudentCart /></StudentRoute>} />
            <Route path="/track/:orderId" element={<StudentRoute><StudentOrderTracking /></StudentRoute>} />
            <Route path="/orders" element={<StudentRoute><StudentOrders /></StudentRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

const StudentRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'vendor') return <Navigate to="/vendor" replace />;
  return children;
};

const LoginGuard = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={user.role === 'vendor' ? '/vendor' : '/'} replace />;
  return <Login />;
};

export default App;
