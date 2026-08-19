import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cafeAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import ThemeToggle from '../../components/ThemeToggle';
import { hasVendorAccess } from '../../utils/access';

export default function Home() {
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    cafeAPI.getAll().then(res => { setCafes(res.data.cafes || res.data); setLoading(false); })
      .catch(() => { toast.error('Failed to load cafes'); setLoading(false); });
  }, []);

  return (
    <div className="food-shell">
      <header className="food-nav">
        <button className="brand brand-button" onClick={() => navigate('/')}><span className="brand-mark">🐇</span><span>grabbit</span></button>
        <div className="food-nav-actions">
          <ThemeToggle />
          <button onClick={() => navigate('/student/orders')} className="nav-action">Orders</button>
          <button onClick={() => navigate('/student/cart')} className="cart-action">🛒 <span>Cart</span>{itemCount > 0 && <b>{itemCount}</b>}</button>
          {hasVendorAccess(user) && <button onClick={() => navigate('/vendor')} className="nav-action">Vendor dashboard</button>}
          <button onClick={() => { logout(); navigate('/'); }} className="nav-action nav-logout">Sign out</button>
        </div>
      </header>

      <main className="food-content">
        <section className="food-hero">
          <div><p className="hero-eyebrow">TODAY’S PICKUP, ZERO QUEUE</p><h1>Hey {user?.name?.split(' ')[0]}<span> 👋</span></h1><p>Choose a café, order ahead, and collect when it’s ready.</p></div>
          <div className="hero-badge"><span>⚡</span><div><b>Fast pickup</b><small>Pay now · collect later</small></div></div>
        </section>

        {loading ? (
          <div className="food-loading">Finding the best food around campus…</div>
        ) : (
          <section className="cafe-section"><div className="section-heading"><div><p>OPEN NEAR YOU</p><h2>Choose your café</h2></div><span>{cafes.filter((cafe) => cafe.isOpen).length} open now</span></div><div className="cafe-grid">
            {cafes.map(cafe => (
              <button key={cafe._id} disabled={!cafe.isOpen} onClick={() => navigate(`/student/menu/${cafe._id}`)} className={`cafe-card ${cafe.isOpen ? '' : 'is-closed'}`}>
                <div className="cafe-visual"><span>{cafe.name === 'Bistro' ? '🍔' : cafe.name === 'Mayuri' ? '🍛' : '🥘'}</span><i>{cafe.isOpen ? 'OPEN' : 'CLOSED'}</i></div>
                <div className="cafe-card-body"><div><h3>{cafe.name}</h3><p>{cafe.description || 'Delicious campus food'}</p></div><div className="cafe-meta"><span>📍 {cafe.location || 'Campus'}</span>{cafe.isOpen && <b>View menu →</b>}</div></div>
              </button>
            ))}
          </div></section>
        )}
      </main>
    </div>
  );
}
