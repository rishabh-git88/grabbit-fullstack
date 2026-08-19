import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasVendorAccess } from '../utils/access';
import ThemeToggle from '../components/ThemeToggle';

export default function PortalHome() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;

  const canManageCafes = hasVendorAccess(user);

  return (
    <main className="portal-shell">
      <header className="portal-nav"><div className="brand"><span className="brand-mark">🐇</span><span>grabbit</span></div><ThemeToggle /></header>
      <div className="portal-content">
        <div className="portal-hero">
          <div className="hero-eyebrow">CAMPUS FOOD, MADE SIMPLE</div>
          <h1>Skip the queue.<br /><em>Eat what you love.</em></h1>
          <p>One delightful place to order food, follow your order, and run your café.</p>
          <div className="hero-foods"><span>🍜</span><span>🥗</span><span>🍔</span><span>☕</span></div>
        </div>

        {user ? (
          <section className="account-card">
            <div className="account-avatar">{user.name?.[0]}</div>
            <p>Welcome back</p><h2>{user.name}</h2>
            <span className="access-pill">{canManageCafes ? 'Student + vendor access' : 'Student account'}</span>
            <div className="portal-actions">
              <button onClick={() => navigate('/student')} className="button button-primary">Order food <span>→</span></button>
              {canManageCafes && <button onClick={() => navigate('/vendor')} className="button button-secondary">Open vendor dashboard</button>}
              <button onClick={() => logout()} className="button button-quiet">Sign out</button>
            </div>
          </section>
        ) : (
          <section className="portal-card-grid">
            <PortalCard icon="🍽️" label="FOR HUNGRY STUDENTS" title="Find your next favourite meal." description="Browse open cafés, pay in seconds, and know exactly when your order is ready." action="Start ordering" onClick={() => navigate('/login?portal=student')} />
            <PortalCard icon="🏪" label="FOR CAFÉ TEAMS" title="Run a calmer, faster counter." description="Manage menus, availability, and every incoming order from one dashboard." action="Manage cafés" onClick={() => navigate('/login?portal=vendor')} />
          </section>
        )}
      </div>
    </main>
  );
}

const PortalCard = ({ icon, label, title, description, action, onClick }) => (
  <article className="portal-card">
    <div className="portal-card-icon">{icon}</div><span>{label}</span>
    <h2>{title}</h2><p>{description}</p>
    <button onClick={onClick} className="button button-primary">{action} <b>→</b></button>
  </article>
);
