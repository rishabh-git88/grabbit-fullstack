import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI, reviewAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_COLORS = { placed: '#6b7280', accepted: '#3b82f6', preparing: '#f59e0b', ready: '#10b981', completed: '#10b981', rejected: '#ef4444' };

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const rateItem = async (event, order, item, rating) => {
    event.stopPropagation();
    try {
      await reviewAPI.save({ orderId: order._id, itemId: item.itemId, rating });
      toast.success(`Rated ${item.name} ${rating}/5`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save your rating.');
    }
  };

  useEffect(() => {
    orderAPI.getUserOrders(user._id).then(res => { setOrders(res.data.orders || []); setLoading(false); })
      .catch(() => { toast.error('Failed to load orders'); setLoading(false); });
  }, [user._id]);

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div style={{ background: '#1a1d2e', borderBottom: '1px solid #2d3148', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => navigate('/student')} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 20 }}>←</button>
        <span style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>My Orders</span>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#f97316', padding: 60 }}>Loading orders...</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>📋</div>
            <h3 style={{ color: '#fff' }}>No orders yet</h3>
            <button onClick={() => navigate('/student')} style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 10, cursor: 'pointer', marginTop: 16 }}>Order Now</button>
          </div>
        ) : (
          orders.map(order => (
            <div key={order._id} onClick={() => navigate(`/student/track/${order._id}`)}
              style={{ background: '#1a1d2e', borderRadius: 14, padding: 20, marginBottom: 12, border: '1px solid #2d3148', cursor: 'pointer', transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#fff', fontWeight: 600 }}>Order #{order.orderNumber}</span>
                <span style={{ color: STATUS_COLORS[order.status], fontWeight: 600, fontSize: 13 }}>● {order.status.toUpperCase()}</span>
              </div>
              <p style={{ color: '#6b7280', margin: '0 0 8px', fontSize: 13 }}>{order.items.map(i => i.name).join(', ')}</p>
              {order.status === 'completed' && <div onClick={(event) => event.stopPropagation()} style={{ borderTop: '1px solid #2d3148', paddingTop: 10, marginTop: 10 }}>
                <span style={{ color: '#9ca3af', fontSize: 12 }}>Rate your order:</span>
                {order.items.map(item => <div key={item.itemId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 7 }}><span style={{ color: '#d1d5db', fontSize: 13 }}>{item.name}</span><span>{[1, 2, 3, 4, 5].map(rating => <button key={rating} onClick={(event) => rateItem(event, order, item, rating)} aria-label={`Rate ${item.name} ${rating} stars`} style={{ background: 'transparent', border: 0, color: '#fbbf24', cursor: 'pointer', fontSize: 17, padding: '0 2px' }}>☆</button>)}</span></div>)}
              </div>}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca3af', fontSize: 12 }}>{new Date(order.createdAt).toLocaleDateString()}</span>
                <span style={{ color: '#f97316', fontWeight: 600 }}>₹{order.totalAmount}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
