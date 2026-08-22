import React, { useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI, warmUpAPI } from '../api';
import toast from 'react-hot-toast';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (user) navigate('/', { replace: true }); }, [user, navigate]);

  useEffect(() => {
    warmUpAPI();
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseToken = await result.user.getIdToken();
      const res = await authAPI.firebaseLogin({ firebaseToken });
      if (res.data.success) {
        await login(res.data.user, res.data.token);
        toast.success(`Welcome ${res.data.user.name}!`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f1117 0%, #1a1d2e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div style={{ background: '#1a1d2e', borderRadius: 20, padding: '40px 36px', width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', border: '1px solid #2d3148' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: 16, boxShadow: '0 8px 24px rgba(249,115,22,0.3)' }}>🐇</div>
          <h1 style={{ color: '#fff', margin: 0, fontSize: 28, fontWeight: 700 }}>grabbit</h1>
          <p style={{ color: '#6b7280', margin: '8px 0 0', fontSize: 14 }}>Student Portal — Order from your campus cafes</p>
        </div>

        <p style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>Sign in with your Google account</p>
        <button onClick={handleGoogleLogin} disabled={loading} style={{ width: '100%', padding: '14px 0', borderRadius: 12, background: loading ? '#374151' : '#fff', border: 'none', color: '#1a1a1a', fontSize: 16, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          {loading ? <span style={{ color: '#6b7280' }}>Signing in...</span> : 'Continue with Google'}
        </button>
        <p style={{ color: '#374151', fontSize: 12, textAlign: 'center', marginTop: 24 }}>Student portal — order food from your campus cafes</p>
      </div>
    </div>
  );
}
