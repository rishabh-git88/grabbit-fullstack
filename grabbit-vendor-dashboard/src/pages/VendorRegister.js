import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { auth, googleProvider, signInWithPopup } from '../firebase';
import { authAPI, warmUpAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { hasVendorAccess } from '../utils/access';

const fieldStyle = {
  width: '100%', boxSizing: 'border-box', borderRadius: 10, border: '1px solid #374151',
  background: '#111827', color: '#fff', padding: '12px 14px', fontSize: 14, marginTop: 6,
};

export default function VendorRegister() {
  const [cafeName, setCafeName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { warmUpAPI(); }, []);
  useEffect(() => {
    if (user && hasVendorAccess(user)) navigate('/vendor', { replace: true });
  }, [user, navigate]);

  const register = async (event) => {
    event.preventDefault();
    if (!cafeName.trim()) return toast.error('Enter your cafe name first.');

    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseToken = await result.user.getIdToken();
      const res = await authAPI.vendorRegister({
        firebaseToken,
        cafeName: cafeName.trim(),
        description: description.trim(),
        location: location.trim(),
      });
      await login(res.data.user, res.data.token);
      toast.success('Your vendor account is ready.');
      navigate('/vendor', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Vendor registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f1117, #1a1d2e)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <form onSubmit={register} style={{ width: '100%', maxWidth: 440, background: '#1a1d2e', border: '1px solid #2d3148', borderRadius: 20, padding: '36px', boxShadow: '0 20px 60px rgba(0,0,0,0.45)' }}>
        <div style={{ color: '#fb923c', fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>GRABBIT VENDOR</div>
        <h1 style={{ color: '#fff', fontSize: 28, margin: '10px 0 8px' }}>Register your cafe</h1>
        <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.5, margin: '0 0 26px' }}>Set up your cafe, then continue with Google to create your vendor dashboard.</p>

        <label style={{ color: '#d1d5db', fontSize: 14, fontWeight: 600 }}>Cafe name<input value={cafeName} onChange={(event) => setCafeName(event.target.value)} maxLength="80" required placeholder="e.g. Campus Coffee House" style={fieldStyle} /></label>
        <label style={{ display: 'block', color: '#d1d5db', fontSize: 14, fontWeight: 600, marginTop: 18 }}>Location (optional)<input value={location} onChange={(event) => setLocation(event.target.value)} maxLength="160" placeholder="e.g. Academic Block A" style={fieldStyle} /></label>
        <label style={{ display: 'block', color: '#d1d5db', fontSize: 14, fontWeight: 600, marginTop: 18 }}>About your cafe (optional)<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength="500" rows="3" placeholder="Tell students what you serve" style={{ ...fieldStyle, resize: 'vertical' }} /></label>

        <button disabled={loading} type="submit" style={{ width: '100%', marginTop: 26, padding: '14px', border: 0, borderRadius: 12, background: loading ? '#374151' : '#fff', color: '#111827', fontSize: 15, fontWeight: 700, cursor: loading ? 'wait' : 'pointer' }}>{loading ? 'Creating your vendor account…' : 'Continue with Google'}</button>
        <button type="button" onClick={() => navigate('/login?portal=vendor')} style={{ width: '100%', marginTop: 16, background: 'transparent', border: 0, color: '#9ca3af', fontSize: 13, cursor: 'pointer' }}>← Already a vendor? Sign in</button>
      </form>
    </main>
  );
}
