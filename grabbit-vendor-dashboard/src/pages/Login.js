import React, { useState, useEffect, useRef } from 'react';
import {
  auth,
  googleProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup
} from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

export default function Login() {
  const [mode, setMode] = useState('google');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [confirmResult, setConfirmResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const clearRecaptcha = () => {
    if (recaptchaRef.current) {
      recaptchaRef.current.clear();
      recaptchaRef.current = null;
    }
    // Clear the DOM element
    const container = document.getElementById('recaptcha-container');
    if (container) container.innerHTML = '';
  };

  const handleModeSwitch = (newMode) => {
    clearRecaptcha();
    setMode(newMode);
    setStep(1);
    setOtp('');
    setPhone('');
  };

  useEffect(() => {
    return () => clearRecaptcha();
  }, []);

  const handleFirebaseLogin = async (firebaseToken) => {
    try {
      const res = await authAPI.firebaseLogin({ firebaseToken });
      if (res.data.success) {
        await login(res.data.user, res.data.token);
        toast.success(`Welcome ${res.data.user.name}!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Contact admin.');
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseToken = await result.user.getIdToken();
      await handleFirebaseLogin(firebaseToken);
    } catch (err) {
      toast.error('Google login failed');
    }
    setLoading(false);
  };

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      clearRecaptcha();
      recaptchaRef.current = new RecaptchaVerifier(
        auth, 'recaptcha-container',
        { size: 'invisible', callback: () => {} }
      );
      const phoneNumber = `+91${phone}`;
      const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaRef.current);
      setConfirmResult(result);
      setStep(2);
      toast.success(`OTP sent to +91 ${phone}`);
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP');
      clearRecaptcha();
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const result = await confirmResult.confirm(otp);
      const firebaseToken = await result.user.getIdToken();
      await handleFirebaseLogin(firebaseToken);
    } catch (err) {
      toast.error('Invalid OTP. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f1117 0%, #1a1d2e 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <div style={{
        background: '#1a1d2e', borderRadius: 20, padding: '40px 36px',
        width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        border: '1px solid #2d3148'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            display: 'inline-flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 32, marginBottom: 16,
            boxShadow: '0 8px 24px rgba(249,115,22,0.3)'
          }}>🐇</div>
          <h1 style={{ color: '#fff', margin: 0, fontSize: 28, fontWeight: 700 }}>grabbit</h1>
          <p style={{ color: '#6b7280', margin: '8px 0 0', fontSize: 14 }}>Vendor Dashboard</p>
        </div>

        {/* Tab Toggle */}
        <div style={{
          display: 'flex', background: '#0f1117',
          borderRadius: 12, padding: 4, marginBottom: 28,
          border: '1px solid #2d3148'
        }}>
          {[{ key: 'google', label: '📧 Gmail OTP' }, { key: 'phone', label: '📱 Mobile OTP' }].map((tab) => (
            <button key={tab.key}
              onClick={() => handleModeSwitch(tab.key)}
              style={{
                flex: 1, padding: '10px 0', border: 'none', borderRadius: 9,
                cursor: 'pointer', fontSize: 14,
                background: mode === tab.key ? 'linear-gradient(135deg, #f97316, #ea580c)' : 'transparent',
                color: mode === tab.key ? '#fff' : '#6b7280',
                fontWeight: mode === tab.key ? 600 : 400, transition: 'all 0.2s'
              }}>{tab.label}</button>
          ))}
        </div>

        {/* Google Login */}
        {mode === 'google' && (
          <div>
            <p style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
              Sign in with your registered Google account to access the vendor dashboard.
            </p>
            <button onClick={handleGoogleLogin} disabled={loading}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 12,
                background: loading ? '#374151' : '#fff',
                border: 'none', color: '#1a1a1a', fontSize: 16, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)', transition: 'all 0.2s'
              }}>
              {loading ? (
                <span style={{ color: '#6b7280' }}>Signing in...</span>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
          </div>
        )}

        {/* Phone Login */}
        {mode === 'phone' && (
          <div>
            {step === 1 && (
              <>
                <label style={{ color: '#9ca3af', fontSize: 12, display: 'block', marginBottom: 8 }}>
                  MOBILE NUMBER
                </label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  <div style={{
                    padding: '12px 16px', background: '#0f1117',
                    border: '1px solid #374151', borderRadius: 10,
                    color: '#fff', fontSize: 15
                  }}>+91</div>
                  <input type="tel" value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="98765 43210"
                    style={{
                      flex: 1, padding: '12px 16px', borderRadius: 10,
                      background: '#0f1117', border: '1px solid #374151',
                      color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box'
                    }} />
                </div>
                <div id="recaptcha-container"></div>
                <button onClick={handleSendOTP} disabled={loading}
                  style={{
                    width: '100%', padding: '14px 0', borderRadius: 12,
                    background: loading ? '#374151' : 'linear-gradient(135deg, #f97316, #ea580c)',
                    border: 'none', color: '#fff', fontSize: 16, fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(249,115,22,0.3)'
                  }}>
                  {loading ? 'Sending OTP...' : 'Send OTP →'}
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <p style={{ color: '#10b981', fontSize: 14, textAlign: 'center', marginBottom: 20 }}>
                  ✓ OTP sent to +91 {phone}
                </p>
                <label style={{ color: '#9ca3af', fontSize: 12, display: 'block', marginBottom: 8 }}>
                  ENTER 6-DIGIT OTP
                </label>
                <input type="text" value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •" maxLength={6}
                  style={{
                    width: '100%', padding: '16px', borderRadius: 10,
                    background: '#0f1117', border: '1px solid #374151',
                    color: '#fff', fontSize: 24, textAlign: 'center',
                    letterSpacing: 12, outline: 'none',
                    boxSizing: 'border-box', marginBottom: 20
                  }} />
                <button onClick={handleVerifyOTP} disabled={loading}
                  style={{
                    width: '100%', padding: '14px 0', borderRadius: 12,
                    background: loading ? '#374151' : 'linear-gradient(135deg, #f97316, #ea580c)',
                    border: 'none', color: '#fff', fontSize: 16, fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(249,115,22,0.3)', marginBottom: 12
                  }}>
                  {loading ? 'Verifying...' : 'Verify OTP ✓'}
                </button>
                <button onClick={() => { setStep(1); setOtp(''); clearRecaptcha(); }}
                  style={{
                    width: '100%', padding: '12px 0', borderRadius: 12,
                    background: 'transparent', border: '1px solid #374151',
                    color: '#6b7280', fontSize: 14, cursor: 'pointer'
                  }}>← Change Number</button>
              </>
            )}
          </div>
        )}

        <p style={{ color: '#374151', fontSize: 12, textAlign: 'center', marginTop: 24 }}>
          Only registered vendors can access this dashboard
        </p>
      </div>
    </div>
  );
}
