import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/',       icon: '⚡', label: 'Orders'   },
  { to: '/menu',   icon: '🍽️', label: 'Menu'     },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
];

const Sidebar = ({ cafe, isOpen, onToggleOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#16213E] border-r border-white/5 flex flex-col z-20">
      {/* Brand */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF6B2C] flex items-center justify-center font-display font-bold text-white text-lg">G</div>
          <div>
            <div className="font-display font-bold text-white text-lg leading-none">grabbit</div>
            <div className="text-[10px] text-[#8892A4] uppercase tracking-widest mt-0.5">Vendor</div>
          </div>
        </div>
      </div>

      {/* Cafe info */}
      {cafe && (
        <div className="px-6 py-4 border-b border-white/5">
          <p className="text-xs text-[#8892A4] mb-1 uppercase tracking-wider">Your Cafe</p>
          <p className="font-display font-semibold text-white text-sm">{cafe.name}</p>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={onToggleOpen}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                isOpen ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse-dot ${isOpen ? 'bg-green-400' : 'bg-red-400'}`} />
              {isOpen ? 'Open' : 'Closed'}
            </button>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.to} to={item.to} end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#FF6B2C]/15 text-[#FF6B2C]'
                  : 'text-[#8892A4] hover:text-white hover:bg-white/5'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#FF6B2C]/20 flex items-center justify-center text-[#FF6B2C] font-bold text-sm">
            {user?.name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-[#8892A4] truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-[#8892A4] hover:text-[#E94560] hover:bg-[#E94560]/10 transition-all"
        >
          ↩ Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
