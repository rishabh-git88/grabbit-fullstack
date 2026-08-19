import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasVendorAccess } from '../utils/access';

export default function PortalHome() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;

  const canManageCafes = hasVendorAccess(user);

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f1117, #1a1d2e)', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', padding: '32px 24px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', paddingTop: '8vh' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 54, marginBottom: 12 }}>🐇</div>
          <h1 style={{ margin: 0, fontSize: 42, letterSpacing: -1 }}>grabbit</h1>
          <p style={{ color: '#9ca3af', fontSize: 18, margin: '12px 0 0' }}>Choose how you want to use the campus food portal.</p>
        </div>

        {user ? (
          <section style={{ maxWidth: 540, margin: '0 auto', background: '#1a1d2e', border: '1px solid #374151', borderRadius: 20, padding: 32, textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', margin: 0 }}>Signed in as</p>
            <h2 style={{ margin: '8px 0', fontSize: 24 }}>{user.name}</h2>
            <p style={{ color: '#f97316', margin: '0 0 24px', fontWeight: 700 }}>{canManageCafes ? 'Student and vendor access' : 'Student account'}</p>
            <button onClick={() => navigate('/student')} style={primaryButton}>Open Student Dashboard</button>
            {canManageCafes && <button onClick={() => navigate('/vendor')} style={{ ...primaryButton, marginTop: 12 }}>Open Vendor Dashboard</button>}
            <button onClick={() => logout()} style={secondaryButton}>Sign out to use another account</button>
          </section>
        ) : (
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            <PortalCard icon="🍽️" title="Student Dashboard" description="Browse open cafes, place food orders, pay online, and track your order." action="Order food" onClick={() => navigate('/login?portal=student')} />
            <PortalCard icon="🏪" title="Vendor Dashboard" description="Manage your cafe menu, toggle availability, and process incoming orders." action="Manage cafe" onClick={() => navigate('/login?portal=vendor')} />
          </section>
        )}
      </div>
    </main>
  );
}

const PortalCard = ({ icon, title, description, action, onClick }) => (
  <article style={{ background: '#1a1d2e', border: '1px solid #374151', borderRadius: 20, padding: 32, textAlign: 'center' }}>
    <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
    <h2 style={{ margin: '0 0 12px', fontSize: 24 }}>{title}</h2>
    <p style={{ color: '#9ca3af', lineHeight: 1.6, minHeight: 76 }}>{description}</p>
    <button onClick={onClick} style={primaryButton}>{action} →</button>
  </article>
);

const primaryButton = { width: '100%', padding: '14px 18px', border: 'none', borderRadius: 12, cursor: 'pointer', background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#fff', fontSize: 15, fontWeight: 700 };
const secondaryButton = { ...primaryButton, marginTop: 12, background: 'transparent', border: '1px solid #4b5563', color: '#d1d5db' };
