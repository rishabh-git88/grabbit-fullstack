import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useOrderSocket } from '../hooks/useOrderSocket';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['placed', 'accepted', 'preparing', 'ready', 'completed'];
const STATUS_LABELS = { placed: '📋 Order Placed', accepted: '✅ Accepted', preparing: '👨‍🍳 Preparing', ready: '🔔 Ready for Pickup', completed: '🎉 Completed' };
const STATUS_COLORS = { placed: '#6b7280', accepted: '#3b82f6', preparing: '#f59e0b', ready: '#10b981', completed: '#10b981', rejected: '#ef4444' };

export default function OrderTracking() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    orderAPI.get(orderId).then(res => { setOrder(res.data.order); setLoading(false); })
      .catch(() => { toast.error('Order not found'); setLoading(false); });
    const interval = setInterval(() => {
      orderAPI.get(orderId).then(res => setOrder(res.data.order)).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  useOrderSocket(user?._id, (data) => {
    if (data.orderId === orderId) {
      setOrder(prev => ({ ...prev, status: data.status }));
      toast.success(`Order ${data.status}!`);
    }
  });

  if (loading) return <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f97316', fontSize: 18 }}>Loading order...</div>;
  if (!order) return <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Order not found</div>;

  const currentStep = STATUS_STEPS.indexOf(order.status);

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div style={{ background: '#1a1d2e', borderBottom: '1px solid #2d3148', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/student')} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 20 }}>←</button>
        <span style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>Order #{order.orderNumber}</span>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px' }}>
        {/* Status */}
        <div style={{ background: '#1a1d2e', borderRadius: 16, padding: 24, marginBottom: 16, border: '1px solid #2d3148', textAlign: 'center' }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>{order.status === 'rejected' ? '❌' : order.status === 'completed' ? '🎉' : order.status === 'ready' ? '🔔' : '⏳'}</div>
          <h2 style={{ color: STATUS_COLORS[order.status] || '#fff', margin: '0 0 8px', fontSize: 22 }}>{STATUS_LABELS[order.status] || order.status}</h2>
          {order.status === 'ready' && <p style={{ color: '#10b981', margin: 0 }}>Show QR code at counter to collect your order!</p>}
          {order.status === 'rejected' && <p style={{ color: '#ef4444', margin: 0 }}>Your order was rejected. Refund will be processed.</p>}
        </div>

        {/* Progress Steps */}
        {order.status !== 'rejected' && (
          <div style={{ background: '#1a1d2e', borderRadius: 16, padding: 24, marginBottom: 16, border: '1px solid #2d3148' }}>
            {STATUS_STEPS.filter(s => s !== 'completed').map((step, idx) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: idx < 3 ? 16 : 0 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: idx <= currentStep ? 'linear-gradient(135deg, #f97316, #ea580c)' : '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{idx <= currentStep ? '✓' : idx + 1}</div>
                <span style={{ color: idx <= currentStep ? '#fff' : '#6b7280', fontSize: 15, fontWeight: idx <= currentStep ? 600 : 400 }}>{STATUS_LABELS[step]}</span>
              </div>
            ))}
          </div>
        )}

        {/* QR Code */}
        {order.qrCode && (order.status === 'ready' || order.status === 'completed') && (
          <div style={{ background: '#1a1d2e', borderRadius: 16, padding: 24, marginBottom: 16, border: '1px solid #10b981', textAlign: 'center' }}>
            <h3 style={{ color: '#10b981', margin: '0 0 16px' }}>Show this QR at counter</h3>
            <img src={order.qrCode} alt="QR Code" style={{ width: 200, height: 200, borderRadius: 12 }} />
          </div>
        )}

        {/* Order Details */}
        <div style={{ background: '#1a1d2e', borderRadius: 16, padding: 20, border: '1px solid #2d3148' }}>
          <h3 style={{ color: '#fff', margin: '0 0 16px' }}>Order Details</h3>
          {order.items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2d3148' }}>
              <span style={{ color: '#9ca3af' }}>{item.name} × {item.quantity}</span>
              <span style={{ color: '#fff' }}>₹{item.price * item.quantity}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
            <span style={{ color: '#9ca3af' }}>Paid online</span>
            <span style={{ color: '#10b981', fontWeight: 600 }}>₹{order.paidAmount}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ color: '#9ca3af' }}>Pay at pickup</span>
            <span style={{ color: '#f97316', fontWeight: 600 }}>₹{order.remainingAmount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
