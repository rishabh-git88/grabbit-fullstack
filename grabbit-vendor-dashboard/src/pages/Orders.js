import React, { useState, useEffect, useCallback } from 'react';
import { orderAPI } from '../api';
import { useSocket } from '../hooks/useSocket';
import OrderCard from '../components/OrderCard';
import toast from 'react-hot-toast';

const FILTERS = ['all', 'placed', 'accepted', 'preparing', 'ready', 'completed'];

const Orders = ({ cafe }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchOrders = useCallback(async () => {
    if (!cafe) return;
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await orderAPI.getCafeOrders(cafe._id, params);
      setOrders(res.data.orders);
      setLastRefresh(new Date());
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [cafe, filter]);

  // Initial + polling (every 8 seconds)
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Real-time via Socket.io
  useSocket(cafe?._id, (newOrder) => {
    setOrders(prev => [newOrder, ...prev.filter(o => o._id !== newOrder._id)]);
    toast('🔔 New order received!', { style: { background: '#FF6B2C', color: '#fff', fontWeight: 600 } });
  });

  const handleOrderUpdated = (orderId, newStatus) => {
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === 'all' ? orders.length : orders.filter(o => o.status === f).length;
    return acc;
  }, {});

  if (!cafe) return (
    <div className="flex items-center justify-center h-64 text-[#8892A4]">No cafe linked to your account.</div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Orders</h1>
          <p className="text-xs text-[#8892A4] mt-1">
            Auto-refreshes every 8s · Last: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button onClick={fetchOrders} className="text-xs text-[#FF6B2C] hover:text-white bg-[#FF6B2C]/10 hover:bg-[#FF6B2C]/20 px-4 py-2 rounded-xl transition-all">
          ↺ Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-medium capitalize transition-all ${
              filter === f
                ? 'bg-[#FF6B2C] text-white'
                : 'bg-[#16213E] text-[#8892A4] hover:text-white border border-white/5'
            }`}
          >
            {f} {counts[f] > 0 && <span className="ml-1 opacity-70">({counts[f]})</span>}
          </button>
        ))}
      </div>

      {/* Orders grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-[#16213E] rounded-2xl h-32 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="text-5xl mb-3">🍽️</div>
          <p className="text-white font-medium">No orders yet</p>
          <p className="text-[#8892A4] text-sm mt-1">New orders will appear here automatically</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(order => (
            <OrderCard key={order._id} order={order} onUpdated={handleOrderUpdated} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
