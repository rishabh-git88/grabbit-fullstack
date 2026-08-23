import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cafeAPI } from '../../api';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

export default function Menu() {
  const { cafeId } = useParams();
  const [cafe, setCafe] = useState(null);
  const [menu, setMenu] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const { addItem, removeItem, items, itemCount } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    cafeAPI.getMenu(cafeId).then(res => {
      setCafe(res.data.cafe);
      setMenu(res.data.menu || []);
      setRecommendations(res.data.recommendations || null);
      setLoading(false);
    }).catch(() => { toast.error('Failed to load menu'); setLoading(false); });
  }, [cafeId]);

  const categories = ['All', ...new Set(menu.map(i => i.category))];
  const filtered = category === 'All' ? menu : menu.filter(i => i.category === category);

  const getQty = (id) => items.find(i => i._id === id)?.quantity || 0;
  const addPairing = () => {
    if (!recommendations?.pairing || !cafe) return;
    addItem(recommendations.pairing.food, cafe);
    addItem(recommendations.pairing.beverage, cafe);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* Navbar */}
      <div style={{ background: '#1a1d2e', borderBottom: '1px solid #2d3148', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/student')} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 20 }}>←</button>
          <span style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>{cafe?.name || 'Menu'}</span>
          <span style={{ background: cafe?.isOpen ? '#10b98120' : '#ef444420', color: cafe?.isOpen ? '#10b981' : '#ef4444', padding: '4px 10px', borderRadius: 20, fontSize: 12 }}>{cafe?.isOpen ? '● Open' : '● Closed'}</span>
        </div>
        <button onClick={() => navigate('/student/cart')} style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          🛒 Cart {itemCount > 0 && `(${itemCount})`}
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>
        {/* Categories */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{ padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, background: category === cat ? 'linear-gradient(135deg, #f97316, #ea580c)' : '#1a1d2e', color: category === cat ? '#fff' : '#9ca3af', fontWeight: category === cat ? 600 : 400 }}>{cat}</button>
          ))}
        </div>

        {!loading && recommendations?.popular?.length > 0 && (
          <section style={{ marginBottom: 30 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 12 }}>
              <div><p style={{ color: '#fb923c', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: 0 }}>MOST ORDERED HERE</p><h2 style={{ color: '#fff', fontSize: 20, margin: '4px 0 0' }}>Student favourites</h2></div>
              {recommendations.bestReviewed && <span style={{ color: '#fbbf24', fontSize: 12 }}>★ Best rated: {recommendations.bestReviewed.name}</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {recommendations.popular.map((item, index) => (
                <div key={item._id} style={{ background: '#1a1d2e', border: index === 0 ? '1px solid #f97316' : '1px solid #2d3148', borderRadius: 12, padding: 16 }}>
                  <span style={{ color: '#fb923c', fontSize: 12, fontWeight: 700 }}>#{index + 1} POPULAR</span>
                  <h3 style={{ color: '#fff', margin: '8px 0 5px', fontSize: 16 }}>{item.name}</h3>
                  <p style={{ color: '#9ca3af', margin: 0, fontSize: 12 }}>{item.orderCount ? `${item.orderCount} ordered` : 'New favourite to try'}</p>
                  <button onClick={() => addItem(item, cafe)} style={{ marginTop: 12, background: 'transparent', border: '1px solid #f97316', color: '#fb923c', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Add to cart</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {!loading && (recommendations?.pairing || recommendations?.bestReviewed) && (
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginBottom: 30 }}>
            {recommendations?.pairing && <div style={{ background: 'linear-gradient(135deg, #312e81, #1e1b4b)', border: '1px solid #4f46e5', borderRadius: 12, padding: 18 }}>
              <p style={{ color: '#c4b5fd', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: 0 }}>PERFECT PAIRING</p>
              <h3 style={{ color: '#fff', margin: '8px 0 4px', fontSize: 16 }}>{recommendations.pairing.food.name} + {recommendations.pairing.beverage.name}</h3>
              <p style={{ color: '#c4b5fd', fontSize: 12, margin: 0 }}>A popular food with the café's top beverage.</p>
              <button onClick={addPairing} style={{ marginTop: 14, background: '#fff', border: 0, color: '#312e81', borderRadius: 7, padding: '7px 11px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Add both · ₹{recommendations.pairing.food.price + recommendations.pairing.beverage.price}</button>
            </div>}
            <div style={{ background: '#1a1d2e', border: '1px solid #2d3148', borderRadius: 12, padding: 18 }}>
              <p style={{ color: '#fbbf24', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: 0 }}>BEST REVIEWED AT {cafe?.name?.toUpperCase()}</p>
              {recommendations?.bestReviewed ? <><h3 style={{ color: '#fff', margin: '8px 0 4px', fontSize: 16 }}>{recommendations.bestReviewed.name}</h3><p style={{ color: '#fbbf24', fontSize: 13, margin: 0 }}>★ {recommendations.bestReviewed.averageRating}/5 from {recommendations.bestReviewed.reviewCount} review{recommendations.bestReviewed.reviewCount === 1 ? '' : 's'}</p><button onClick={() => addItem(recommendations.bestReviewed, cafe)} style={{ marginTop: 14, background: 'transparent', border: '1px solid #fbbf24', color: '#fbbf24', borderRadius: 7, padding: '7px 11px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Try it</button></> : <p style={{ color: '#9ca3af', fontSize: 13, margin: '9px 0 0' }}>No ratings yet. Be the first student to rate a completed order.</p>}
            </div>
          </section>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', color: '#f97316', padding: 60 }}>Loading menu...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {filtered.map(item => (
              <div key={item._id} style={{ background: '#1a1d2e', borderRadius: 14, padding: 20, border: '1px solid #2d3148', opacity: item.isAvailable ? 1 : 0.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <h3 style={{ color: '#fff', margin: 0, fontSize: 16, fontWeight: 600 }}>{item.name}</h3>
                  <span style={{ color: '#f97316', fontWeight: 700, fontSize: 16 }}>₹{item.price}</span>
                </div>
                <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 12px' }}>{item.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#9ca3af', fontSize: 12 }}>⏱ {item.preparationTime || 10} min</span>
                  {item.isAvailable ? (
                    getQty(item._id) > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => removeItem(item._id)} style={{ width: 28, height: 28, borderRadius: '50%', background: '#374151', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16 }}>-</button>
                        <span style={{ color: '#fff', fontWeight: 600 }}>{getQty(item._id)}</span>
                        <button onClick={() => addItem(item, cafe)} style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #ea580c)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16 }}>+</button>
                      </div>
                    ) : (
                      <button onClick={() => addItem(item, cafe)} style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Add +</button>
                    )
                  ) : (
                    <span style={{ color: '#ef4444', fontSize: 12 }}>Unavailable</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
