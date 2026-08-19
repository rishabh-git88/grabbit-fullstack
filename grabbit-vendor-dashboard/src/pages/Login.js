import React, { useState, useEffect, useRef } from 'react';
import {
  auth,
  googleProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup
} from '../firebase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import { hasVendorAccess } from '../utils/access';
import toast from 'react-hot-toast';

export default function Login() {
  const [mode, setMode] = useState('google');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [confirmResult, setConfirmResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recaptchaSolved, setRecaptchaSolved] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const recaptchaRef = useRef(null);
  const portal = searchParams.get('portal') === 'vendor' ? 'vendor' : 'student';

  useEffect(() => {
    if (user) navigate(portal === 'vendor' && hasVendorAccess(user) ? '/vendor' : '/student', { replace: true });
  }, [user, navigate, portal]);

  const clearRecaptcha = () => {
    if (recaptchaRef.current) { recaptchaRef.current.clear(); recaptchaRef.current = null; }
    const el = document.getElementById('recaptcha-container');
    if (el) el.innerHTML = '';
    setRecaptchaSolved(false);
  };

  const handleModeSwitch = (m) => { clearRecaptcha(); setMode(m); setStep(1); setOtp(''); setPhone(''); };

  useEffect(() => {
    if (mode === 'phone' && step === 1) {
      setTimeout(() => {
        try {
          clearRecaptcha();
          recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'normal',
            callback: () => setRecaptchaSolved(true),
            'expired-callback': () => setRecaptchaSolved(false)
          });
          recaptchaRef.current.render();
        } catch (e) { console.log(e); }
      }, 500);
    }
    return () => {};
  }, [mode, step]);

  useEffect(() => { return () => clearRecaptcha(); }, []);

  const handleFirebaseLogin = async (firebaseToken) => {
    try {
      const res = await authAPI.firebaseLogin({ firebaseToken });
      if (res.data.success) {
        if (portal === 'vendor' && !hasVendorAccess(res.data.user)) {
          toast.error('This account is not registered as a vendor. Use the student dashboard or sign in with your vendor account.');
          return;
        }
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
    } catch (err) { toast.error('Google login failed'); }
    setLoading(false);
  };

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) { toast.error('Enter valid 10-digit number'); return; }
    if (!recaptchaSolved) { toast.error('Complete reCAPTCHA first'); return; }
    setLoading(true);
    try {
      const result = await signInWithPhoneNumber(auth, `+91${phone}`, recaptchaRef.current);
      setConfirmResult(result); setStep(2);
      toast.success(`OTP sent to +91 ${phone}`);
    } catch (err) { toast.error(err.message || 'Failed to send OTP'); clearRecaptcha(); }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) { toast.error('Enter 6-digit OTP'); return; }
    setLoading(true);
    try {
      const result = await confirmResult.confirm(otp);
      const firebaseToken = await result.user.getIdToken();
      await handleFirebaseLogin(firebaseToken);
    } catch (err) { toast.error('Invalid OTP'); }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f1117 0%, #1a1d2e 100%)',
      display: 'flex',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      {/* Left side - Food Image */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #1a0a00 0%, #2d1200 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 60,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background circles */}
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, #f9731620 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />

        {/* Food illustration */}
        <div style={{ fontSize: 120, marginBottom: 24, filter: 'drop-shadow(0 20px 40px rgba(249,115,22,0.4))' }}>🍽️</div>

        <div style={{ textAlign: 'center', zIndex: 1 }}>
          <h1 style={{ color: '#fff', fontSize: 48, fontWeight: 800, margin: '0 0 16px', lineHeight: 1.1 }}>
            Grab your<br />
            <span style={{ color: '#f97316' }}>food fast</span>
          </h1>
          <p style={{ color: '#9ca3af', fontSize: 18, margin: '0 0 40px', lineHeight: 1.6 }}>
            Order campus food, manage your cafe,<br />and serve your community
          </p>

          {/* Food items floating */}
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', fontSize: 40 }}>
            {['🍱', '☕', '🍔', '🥗', '🍜'].map((emoji, i) => (
              <div key={i} style={{
                background: '#ffffff10',
                borderRadius: 16,
                width: 64,
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #ffffff15',
                animation: `float ${2 + i * 0.3}s ease-in-out infinite alternate`
              }}>{emoji}</div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 32, marginTop: 48, zIndex: 1 }}>
          {[{ label: 'Campus Cafes', value: '3+' }, { label: 'Daily Orders', value: '100+' }, { label: 'Happy Students', value: '500+' }].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ color: '#f97316', fontSize: 28, fontWeight: 800 }}>{stat.value}</div>
              <div style={{ color: '#6b7280', fontSize: 13 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right side - Login Form */}
      <div style={{
        width: 460,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        background: '#1a1d2e'
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          {/* Logo */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, boxShadow: '0 4px 16px rgba(249,115,22,0.4)'
              }}>🤌</div>
              <span style={{ color: '#fff', fontSize: 24, fontWeight: 800 }}>grabbit</span>
            </div>
            <h2 style={{ color: '#fff', margin: '0 0 4px', fontSize: 22, fontWeight: 700 }}>{portal === 'vendor' ? 'Vendor Dashboard' : 'Student Dashboard'}</h2>
            <p style={{ color: '#6b7280', margin: 0, fontSize: 14 }}>{portal === 'vendor' ? 'Sign in to manage your cafe' : 'Sign in to order food'}</p>
          </div>

          {/* Tab Toggle */}
          <div style={{ display: 'flex', background: '#0f1117', borderRadius: 12, padding: 4, marginBottom: 28, border: '1px solid #2d3148' }}>
            {[{ key: 'google', label: '📧 Google' }, { key: 'phone', label: '📱 Mobile OTP' }].map((tab) => (
              <button key={tab.key} onClick={() => handleModeSwitch(tab.key)}
                style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 14, background: mode === tab.key ? 'linear-gradient(135deg, #f97316, #ea580c)' : 'transparent', color: mode === tab.key ? '#fff' : '#6b7280', fontWeight: mode === tab.key ? 600 : 400, transition: 'all 0.2s' }}>{tab.label}</button>
            ))}
          </div>

          {/* Google Login */}
          {mode === 'google' && (
            <div>
              <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 20 }}>Sign in with your registered Google account</p>
              <button onClick={handleGoogleLogin} disabled={loading}
                style={{ width: '100%', padding: '14px', borderRadius: 12, background: loading ? '#374151' : '#fff', border: 'none', color: '#1a1a1a', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                {loading ? <span style={{ color: '#6b7280' }}>Signing in...</span> : (
                  <><svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>Continue with Google</>
                )}
              </button>
            </div>
          )}

          {/* Phone Login */}
          {mode === 'phone' && (
            <div>
              {step === 1 && (
                <>
                  <label style={{ color: '#9ca3af', fontSize: 12, display: 'block', marginBottom: 8 }}>MOBILE NUMBER</label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <div style={{ padding: '12px 16px', background: '#0f1117', border: '1px solid #374151', borderRadius: 10, color: '#fff', fontSize: 15 }}>+91</div>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="98765 43210"
                      style={{ flex: 1, padding: '12px 16px', borderRadius: 10, background: '#0f1117', border: '1px solid #374151', color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}><div id="recaptcha-container"></div></div>
                  <button onClick={handleSendOTP} disabled={loading || !recaptchaSolved}
                    style={{ width: '100%', padding: '14px', borderRadius: 12, background: (!recaptchaSolved || loading) ? '#374151' : 'linear-gradient(135deg, #f97316, #ea580c)', border: 'none', color: '#fff', fontSize: 15, fontWeight: 600, cursor: (!recaptchaSolved || loading) ? 'not-allowed' : 'pointer' }}>
                    {loading ? 'Sending...' : recaptchaSolved ? 'Send OTP →' : 'Complete reCAPTCHA first'}
                  </button>
                </>
              )}
              {step === 2 && (
                <>
                  <p style={{ color: '#10b981', fontSize: 14, textAlign: 'center', marginBottom: 20 }}>✓ OTP sent to +91 {phone}</p>
                  <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="• • • • • •" maxLength={6}
                    style={{ width: '100%', padding: '16px', borderRadius: 10, background: '#0f1117', border: '1px solid #374151', color: '#fff', fontSize: 24, textAlign: 'center', letterSpacing: 12, outline: 'none', boxSizing: 'border-box', marginBottom: 16 }} />
                  <button onClick={handleVerifyOTP} disabled={loading}
                    style={{ width: '100%', padding: '14px', borderRadius: 12, background: loading ? '#374151' : 'linear-gradient(135deg, #f97316, #ea580c)', border: 'none', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 10 }}>
                    {loading ? 'Verifying...' : 'Verify OTP ✓'}
                  </button>
                  <button onClick={() => { setStep(1); setOtp(''); clearRecaptcha(); }}
                    style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'transparent', border: '1px solid #374151', color: '#6b7280', fontSize: 14, cursor: 'pointer' }}>← Change Number</button>
                </>
              )}
            </div>
          )}

          <button onClick={() => navigate('/')} style={{ width: '100%', background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 12, marginTop: 24 }}>← Choose a different dashboard</button>
        </div>
      </div>

      <style>{`
        @keyframes float {
          from { transform: translateY(0px); }
          to { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
