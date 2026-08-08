import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI, paymentAPI } from '../api';
import toast from 'react-hot-toast';

export default function Cart() {
  const { items, cafeId, cafeName, total, clearCart, addItem, removeItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');

  const advance = Math.round(total * 0.6);
  const remaining = total - advance;

  const handlePlaceOrder = async () => {
    if (items.length === 0) { toast.error('Cart is empty'); return; }
    setLoading(true);
    try {
      // Create payment order
      const payRes = await paymentAPI.create({
        amount: advance,
        cafeId,
        items: items.map(i => ({ itemId: i._id, name: i.name, quantity: i.quantity, price: i.price }))
      });

      if (payRes.data.simulated) {
        // Simulated payment - place order directly
        const orderRes = await orderAPI.place({
          cafeId,
          items: items.map(i => ({ itemId: i._id, name: i.name, quantity: i.quantity, price: i.price })),
          notes,
          paymentId: payRes.data.paymentId
        });
        clearCart();
        toast.success('Order placed successfully!');
        navigate(`/track/${orderRes.data.order._id}`);
        return;
      }

      // Real Razorpay payment
      const options = {
        key: payRes.data.razorpayKeyId,
        amount: payRes.data.amount,
        currency: 'INR',
        order_id: payRes.data.razorpayOrderId,
        name: 'Grabbit',
        description: `Order from ${cafeName}`,
        image: '🐇',
        prefill: { name: user.name, email: user.email },
        theme: { color: '#f97316' },
        handler: async (data) => {
          try {
            const orderRes = await orderAPI.place({
              cafeId,
              items: items.map(i => ({ itemId: i._id, name: i.name, quantity: i.quantity, price: i.price })),
              notes,
              paymentId: payRes.data.paymentId,
              razorpayPaymentId: data.razorpay_payment_id,
              razorpaySignature: data.razorpay_signature
            });
            await paymentAPI.verify({
              razorpayOrderId: payRes.data.razorpayOrderId,
              razorpayPaymentId: data.razorpay_payment_id,
              razorpaySignature: data.razorpay_signature,
              paymentId: payRes.data.paymentId
            });
            clearCart();
            toast.success('Payment successful! Order placed 🎉');
            navigate(`/track/${orderRes.data.order._id}`);
          } catch (err) {
            toast.error('Order failed after payment. Contact support.');
          }
        },
        modal: { ondismiss: () => { setLoading(false); toast.error('Payment cancelled'); } }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error('Failed to place order');
    }
    setLoading(false);
  };

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
        <div style={{ fontSize: 80, marginBottom: 24 }}>🛒</div>
        <h2 style={{ color: '#fff', margin: '0 0 8px' }}>Your cart is empty</h2>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>Browse cafes and add some food!</p>
        <button onClick={() => navigate('/')} style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', border: 'none', color: '#fff', padding: '12px 24px', borderRadius: 12, cursor: 'pointer', fontSize: 16, fontWeight: 600 }}>Browse Cafes</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div style={{ background: '#1a1d2e', borderBottom: '1px solid #2d3148', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 20 }}>←</button>
        <span style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>Your Cart</span>
        <span style={{ color: '#6b7280', fontSize: 14 }}>from {cafeName}</span>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px' }}>
        {/* Items */}
        <div style={{ background: '#1a1d2e', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #2d3148' }}>
          {items.map(item => (
            <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #2d3148' }}>
              <div>
                <p style={{ color: '#fff', margin: 0, fontWeight: 600 }}>{item.name}</p>
                <p style={{ color: '#6b7280', margin: 0, fontSize: 13 }}>₹{item.price} × {item.quantity}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: '#f97316', fontWeight: 700 }}>₹{item.price * item.quantity}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => removeItem(item._id)} style={{ width: 28, height: 28, borderRadius: '50%', background: '#374151', border: 'none', color: '#fff', cursor: 'pointer' }}>-</button>
                  <span style={{ color: '#fff', fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                  <button onClick={() => addItem(item, { _id: cafeId, name: cafeName })} style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #ea580c)', border: 'none', color: '#fff', cursor: 'pointer' }}>+</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div style={{ background: '#1a1d2e', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #2d3148' }}>
          <label style={{ color: '#9ca3af', fontSize: 12, display: 'block', marginBottom: 8 }}>SPECIAL INSTRUCTIONS</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special requests?" style={{ width: '100%', padding: '10px', background: '#0f1117', border: '1px solid #374151', borderRadius: 8, color: '#fff', fontSize: 14, resize: 'none', height: 80, boxSizing: 'border-box', outline: 'none' }} />
        </div>

        {/* Payment Summary */}
        <div style={{ background: '#1a1d2e', borderRadius: 16, padding: 20, marginBottom: 20, border: '1px solid #2d3148' }}>
          <h3 style={{ color: '#fff', margin: '0 0 16px', fontSize: 16 }}>Payment Summary</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#9ca3af' }}>Subtotal</span>
            <span style={{ color: '#fff' }}>₹{total}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#9ca3af' }}>Pay now (60%)</span>
            <span style={{ color: '#10b981', fontWeight: 600 }}>₹{advance}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid #2d3148', marginTop: 8 }}>
            <span style={{ color: '#9ca3af' }}>Pay at pickup (40%)</span>
            <span style={{ color: '#f97316', fontWeight: 600 }}>₹{remaining}</span>
          </div>
          <div style={{ background: '#f9731620', borderRadius: 8, padding: 12, marginTop: 8 }}>
            <p style={{ color: '#f97316', margin: 0, fontSize: 13 }}>💡 Pay ₹{advance} now via UPI/Card. Remaining ₹{remaining} at pickup.</p>
          </div>
        </div>

        <button onClick={handlePlaceOrder} disabled={loading} style={{ width: '100%', padding: '16px', borderRadius: 14, background: loading ? '#374151' : 'linear-gradient(135deg, #f97316, #ea580c)', border: 'none', color: '#fff', fontSize: 18, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 20px rgba(249,115,22,0.4)' }}>
          {loading ? 'Processing...' : `Pay ₹${advance} via UPI/Card`}
        </button>
      </div>
    </div>
  );
}
