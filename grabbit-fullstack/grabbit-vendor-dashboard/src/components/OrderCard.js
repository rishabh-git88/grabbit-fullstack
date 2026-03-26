import React, { useState } from 'react';
import { orderAPI } from '../api';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  placed:    { color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', label: 'New Order',  dot: 'bg-yellow-400' },
  accepted:  { color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',       label: 'Accepted',   dot: 'bg-blue-400'   },
  preparing: { color: 'text-purple-400 bg-purple-400/10 border-purple-400/20', label: 'Preparing',  dot: 'bg-purple-400' },
  ready:     { color: 'text-green-400 bg-green-400/10 border-green-400/20',     label: 'Ready',      dot: 'bg-green-400'  },
  completed: { color: 'text-gray-400 bg-gray-400/10 border-gray-400/20',       label: 'Completed',  dot: 'bg-gray-400'   },
  rejected:  { color: 'text-red-400 bg-red-400/10 border-red-400/20',          label: 'Rejected',   dot: 'bg-red-400'    },
};

const NEXT_ACTIONS = {
  placed:    [{ status: 'accepted', label: '✓ Accept', cls: 'bg-blue-500 hover:bg-blue-600' }, { status: 'rejected', label: '✕ Reject', cls: 'bg-red-500/20 text-red-400 hover:bg-red-500/30' }],
  accepted:  [{ status: 'preparing', label: '🍳 Start Preparing', cls: 'bg-purple-500 hover:bg-purple-600' }],
  preparing: [{ status: 'ready', label: '🔔 Mark Ready', cls: 'bg-green-500 hover:bg-green-600' }],
  ready:     [{ status: 'completed', label: '✅ Complete', cls: 'bg-[#FF6B2C] hover:bg-[#e55a1f]' }],
  completed: [],
  rejected:  [],
};

const OrderCard = ({ order, onUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(order.status === 'placed');
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.placed;
  const actions = NEXT_ACTIONS[order.status] || [];

  const handleAction = async (status) => {
    setLoading(true);
    try {
      await orderAPI.updateStatus(order._id, status);
      toast.success(`Order ${order.orderNumber} → ${status}`);
      onUpdated(order._id, status);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const timeAgo = (date) => {
    const mins = Math.floor((Date.now() - new Date(date)) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  return (
    <div className={`bg-[#16213E] border rounded-2xl overflow-hidden transition-all animate-fade-in ${
      order.status === 'placed' ? 'border-yellow-400/30 shadow-lg shadow-yellow-400/5' : 'border-white/5'
    }`}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/2 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-white text-sm">#{order.orderNumber}</span>
              {order.status === 'placed' && (
                <span className="text-[10px] bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full font-medium animate-pulse">NEW</span>
              )}
            </div>
            <p className="text-xs text-[#8892A4] mt-0.5">
              {order.userId?.name || 'Student'} · {timeAgo(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
          <span className="text-white/30 text-sm">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-white/5 px-5 pb-5 pt-4">
          {/* Items */}
          <div className="space-y-2 mb-4">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-white/80">
                  <span className="text-[#FF6B2C] font-medium">×{item.quantity}</span>{' '}
                  {item.name}
                </span>
                <span className="text-[#8892A4]">₹{(item.price * item.quantity).toFixed(0)}</span>
              </div>
            ))}
          </div>

          {/* Payment breakdown */}
          <div className="bg-[#0F3460]/60 rounded-xl p-3 mb-4 text-xs space-y-1.5">
            <div className="flex justify-between text-[#8892A4]">
              <span>Total</span>
              <span className="text-white font-medium">₹{order.totalAmount}</span>
            </div>
            <div className="flex justify-between text-[#8892A4]">
              <span>Advance paid (60%)</span>
              <span className="text-green-400">₹{order.paidAmount}</span>
            </div>
            <div className="flex justify-between text-[#8892A4]">
              <span>Collect at pickup (40%)</span>
              <span className="text-yellow-400">₹{order.remainingAmount}</span>
            </div>
          </div>

          {order.notes && (
            <p className="text-xs text-[#8892A4] italic mb-4 bg-white/3 rounded-lg px-3 py-2">
              Note: {order.notes}
            </p>
          )}

          {/* Action buttons */}
          {actions.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {actions.map((action) => (
                <button
                  key={action.status}
                  onClick={() => handleAction(action.status)}
                  disabled={loading}
                  className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 ${action.cls}`}
                >
                  {loading ? '…' : action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderCard;
