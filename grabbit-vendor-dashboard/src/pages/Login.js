import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A1A2E]">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FF6B2C] flex items-center justify-center text-2xl font-display font-bold text-white">G</div>
            <span className="font-display text-3xl font-bold text-white tracking-tight">grabbit</span>
          </div>
          <p className="text-[#8892A4] text-sm">Vendor Dashboard — Sign in to manage your cafe</p>
        </div>

        {/* Card */}
        <div className="bg-[#16213E] rounded-3xl p-8 border border-white/5 shadow-2xl">
          <h2 className="font-display text-xl font-semibold text-white mb-6">Welcome back</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-[#8892A4] mb-2 uppercase tracking-wider">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="vendor@cafe.com"
                className="w-full bg-[#0F3460] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#FF6B2C] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8892A4] mb-2 uppercase tracking-wider">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                className="w-full bg-[#0F3460] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#FF6B2C] transition-colors"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-[#FF6B2C] hover:bg-[#e55a1f] disabled:opacity-50 text-white font-display font-semibold py-3 rounded-xl transition-all duration-200 active:scale-95 mt-2"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/5">
            <p className="text-xs text-[#8892A4] text-center">Demo: mayuri@grabbit.com / password123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
