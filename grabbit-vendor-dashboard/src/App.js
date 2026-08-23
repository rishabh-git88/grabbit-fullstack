import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { cafeAPI, warmUpAPI } from './api';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import VendorRegister from './pages/VendorRegister';
import Orders from './pages/Orders';
import Menu from './pages/Menu';
import Settings from './pages/Settings';
import PortalHome from './pages/PortalHome';
import StudentHome from './student/pages/Home';
import StudentMenu from './student/pages/Menu';
import StudentCart from './student/pages/Cart';
import StudentOrderTracking from './student/pages/OrderTracking';
import StudentOrders from './student/pages/Orders';
import { CartProvider } from './student/context/CartContext';
import { hasVendorAccess } from './utils/access';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

const VendorLayout = () => {
  const { user, loading } = useAuth();
  const [cafe, setCafe] = useState(null);
  const [cafes, setCafes] = useState([]);
  const [cafeOpen, setCafeOpen] = useState(false);

  useEffect(() => {
    if (user && hasVendorAccess(user)) {
      cafeAPI.getManaged().then((res) => {
        const managed = res.data.cafes || [];
        const storedId = localStorage.getItem('grabbit_vendor_cafe_id');
        const selected = managed.find((item) => item._id === storedId) || managed[0] || null;
        setCafes(managed);
        setCafe(selected);
        setCafeOpen(Boolean(selected?.isOpen));
      }).catch(() => {});
    }
  }, [user]);

  const handleCafeChange = (cafeId) => {
    const selected = cafes.find((item) => item._id === cafeId) || null;
    localStorage.setItem('grabbit_vendor_cafe_id', cafeId);
    setCafe(selected);
    setCafeOpen(Boolean(selected?.isOpen));
  };

  const handleToggleOpen = async () => {
    try {
      await cafeAPI.updateStatus(cafe._id, !cafeOpen);
      setCafeOpen(v => !v);
      setCafe((current) => current ? { ...current, isOpen: !cafeOpen } : current);
    } catch {}
  };

  if (loading) return (
    <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center">
      <div className="text-[#FF6B2C] font-display text-xl animate-pulse">Loading…</div>
    </div>
  );

  if (!user) return <Navigate to="/login?portal=vendor" replace />;
  if (!hasVendorAccess(user)) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen bg-[#1A1A2E]">
      <Sidebar cafe={cafe} cafes={cafes} onCafeChange={handleCafeChange} isOpen={cafeOpen} onToggleOpen={handleToggleOpen} />
      <main className="flex-1 ml-64 p-8 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <Routes>
            <Route index element={<Orders cafe={cafe} />} />
            <Route path="menu" element={<Menu cafe={cafe} />} />
            <Route path="settings" element={<Settings cafe={cafe} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

function App() {
  useEffect(() => {
    warmUpAPI();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
          <Toaster position="top-right" toastOptions={{
            style: { background: '#16213E', color: '#F0F0F0', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' },
          }} />
          <Routes>
            <Route path="/login" element={<LoginGuard />} />
            <Route path="/vendor/register" element={<VendorRegister />} />
            <Route path="/vendor/*" element={<VendorLayout />} />
            <Route path="/" element={<PortalHome />} />
            <Route path="/student" element={<StudentRoute><StudentHome /></StudentRoute>} />
            <Route path="/student/menu/:cafeId" element={<StudentRoute><StudentMenu /></StudentRoute>} />
            <Route path="/student/cart" element={<StudentRoute><StudentCart /></StudentRoute>} />
            <Route path="/student/track/:orderId" element={<StudentRoute><StudentOrderTracking /></StudentRoute>} />
            <Route path="/student/orders" element={<StudentRoute><StudentOrders /></StudentRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const StudentRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login?portal=student" replace />;
  return children;
};

const LoginGuard = () => {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  if (loading) return null;
  if (user) return <Navigate to={searchParams.get('portal') === 'vendor' && hasVendorAccess(user) ? '/vendor' : '/student'} replace />;
  return <Login />;
};

export default App;
