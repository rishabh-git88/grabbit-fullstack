import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cafeAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

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
    <div style={{ minHeight: '100vh', background: '#0f1117', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* Navbar */}
      <div style={{ background: '#1a1d2e', borderBottom: '1px solid #2d3148', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🐇</div>
          <span style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>grabbit</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate('/orders')} style={{ background: 'transparent', border: '1px solid #374151', color: '#9ca3af', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>📋 My Orders</button>
          <button onClick={() => navigate('/cart')} style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, position: 'relative' }}>
            🛒 Cart {itemCount > 0 && <span style={{ background: '#ef4444', borderRadius: '50%', padding: '2px 6px', fontSize: 11, marginLeft: 4 }}>{itemCount}</span>}
          </button>
          <button onClick={() => { logout(); navigate('/login'); }} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 14 }}>Logout</button>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: 0 }}>Hey {user?.name?.split(' ')[0]} 👋</h1>
          <p style={{ color: '#6b7280', margin: '8px 0 0' }}>What are you craving today?</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#f97316', padding: 60, fontSize: 18 }}>Loading cafes...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {cafes.map(cafe => (
              <div key={cafe._id} onClick={() => cafe.isOpen && navigate(`/menu/${cafe._id}`)}
                style={{ background: '#1a1d2e', borderRadius: 16, padding: 24, border: '1px solid #2d3148', cursor: cafe.isOpen ? 'pointer' : 'not-allowed', opacity: cafe.isOpen ? 1 : 0.6, transition: 'transform 0.2s', position: 'relative' }}
                onMouseEnter={e => cafe.isOpen && (e.currentTarget.style.transform = 'translateY(-4px)')}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ fontSize: 40, marginBottom: 16, textAlign: 'center' }}>🍽️</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h3 style={{ color: '#fff', margin: 0, fontSize: 18, fontWeight: 600 }}>{cafe.name}</h3>
                  <span style={{ background: cafe.isOpen ? '#10b98120' : '#ef444420', color: cafe.isOpen ? '#10b981' : '#ef4444', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{cafe.isOpen ? '● Open' : '● Closed'}</span>
                </div>
                <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 16px' }}>{cafe.description || 'Delicious campus food'}</p>
                <p style={{ color: '#9ca3af', fontSize: 12, margin: 0 }}>📍 {cafe.location || 'Campus'}</p>
                {cafe.isOpen && <div style={{ marginTop: 16, background: 'linear-gradient(135deg, #f97316, #ea580c)', borderRadius: 8, padding: '10px', textAlign: 'center', color: '#fff', fontSize: 14, fontWeight: 600 }}>View Menu →</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
