import React from 'react';
import { useAuth } from '../context/AuthContext';

const Settings = ({ cafe }) => {
  const { user } = useAuth();
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white mb-6">Settings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        <div className="bg-[#16213E] rounded-2xl border border-white/5 p-6">
          <h2 className="font-display font-semibold text-white mb-4">Account</h2>
          <div className="space-y-3">
            {[['Name', user?.name], ['Email', user?.email], ['Role', 'Vendor']].map(([label, val]) => (
              <div key={label}>
                <p className="text-xs text-[#8892A4] uppercase tracking-wider mb-1">{label}</p>
                <p className="text-white text-sm">{val}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#16213E] rounded-2xl border border-white/5 p-6">
          <h2 className="font-display font-semibold text-white mb-4">Cafe</h2>
          <div className="space-y-3">
            {[['Name', cafe?.name], ['Location', cafe?.location || '—'], ['Status', cafe?.isOpen ? 'Open' : 'Closed']].map(([label, val]) => (
              <div key={label}>
                <p className="text-xs text-[#8892A4] uppercase tracking-wider mb-1">{label}</p>
                <p className="text-white text-sm">{val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
