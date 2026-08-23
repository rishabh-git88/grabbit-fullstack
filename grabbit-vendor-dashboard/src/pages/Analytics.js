import React, { useEffect, useState } from 'react';
import { orderAPI } from '../api';
import toast from 'react-hot-toast';

const Metric = ({ label, value, hint }) => <div className="bg-[#16213E] rounded-2xl border border-white/5 p-5"><p className="text-xs text-[#8892A4] uppercase tracking-wider">{label}</p><p className="font-display text-2xl font-bold text-white mt-2">{value}</p><p className="text-xs text-[#8892A4] mt-1">{hint}</p></div>;

export default function Analytics({ cafe }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    if (!cafe?._id) return;
    setLoading(true);
    orderAPI.getCafeAnalytics(cafe._id, period)
      .then((res) => setAnalytics(res.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [cafe?._id, period]);

  if (!cafe) return <div className="flex items-center justify-center h-64 text-[#8892A4]">No cafe linked to your account.</div>;
  if (loading) return <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1, 2, 3].map((item) => <div key={item} className="h-28 bg-[#16213E] rounded-2xl animate-pulse" />)}</div>;

  const maxOrders = Math.max(...(analytics?.dailySales || []).map((day) => day.orders), 1);
  const hasSales = analytics?.totals?.orders > 0;
  const isDaily = period === 'day';
  const periodLabel = isDaily ? 'today' : 'the last 7 days';
  const comparisonLabel = isDaily ? 'yesterday' : 'last week';
  return <div>
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6"><div><p className="text-xs text-[#FF6B2C] uppercase tracking-wider font-semibold">{cafe.name}</p><h1 className="font-display text-2xl font-bold text-white mt-1">{isDaily ? 'Daily' : 'Weekly'} item analytics</h1><p className="text-sm text-[#8892A4] mt-1">Paid orders from {periodLabel}. Use it to plan stock and improve your menu.</p></div><div className="flex p-1 rounded-xl bg-[#16213E] border border-white/5 self-start"><button onClick={() => setPeriod('day')} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${isDaily ? 'bg-[#FF6B2C] text-white' : 'text-[#8892A4] hover:text-white'}`}>Today</button><button onClick={() => setPeriod('week')} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${!isDaily ? 'bg-[#FF6B2C] text-white' : 'text-[#8892A4] hover:text-white'}`}>Last 7 days</button></div></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Metric label="Paid orders" value={analytics?.totals?.orders || 0} hint={isDaily ? 'Today' : 'Last 7 days'} />
      <Metric label="Items sold" value={analytics?.totals?.itemsSold || 0} hint="Across all menu items" />
      <Metric label="Sales revenue" value={`₹${analytics?.totals?.revenue || 0}`} hint="From paid, non-rejected orders" />
    </div>
    {!hasSales ? <div className="bg-[#16213E] border border-white/5 rounded-2xl p-8 text-center"><div className="text-4xl mb-3">📊</div><p className="text-white font-medium">No paid orders {isDaily ? 'today' : 'in the past week'}</p><p className="text-sm text-[#8892A4] mt-1">Analytics will appear as students place paid orders.</p></div> : <>
      {!isDaily && <section className="bg-[#16213E] border border-white/5 rounded-2xl p-6 mb-6"><div className="flex items-center justify-between mb-6"><div><p className="text-xs text-[#8892A4] uppercase tracking-wider">Daily demand</p><h2 className="font-display text-lg font-semibold text-white mt-1">Orders this week</h2></div></div><div className="h-40 flex items-end gap-3">{analytics.dailySales.map((day) => <div key={day.date} className="flex-1 h-full flex flex-col justify-end items-center gap-2"><span className="text-xs text-white">{day.orders || ''}</span><div className="w-full max-w-12 rounded-t-lg bg-gradient-to-t from-[#E94560] to-[#FF6B2C] min-h-1" style={{ height: `${Math.max((day.orders / maxOrders) * 100, day.orders ? 8 : 2)}%` }} /><span className="text-[10px] text-[#8892A4]">{day.label}</span></div>)}</div></section>}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-[#16213E] border border-white/5 rounded-2xl p-6"><p className="text-xs text-green-400 uppercase tracking-wider font-semibold">Stock more raw material</p><h2 className="font-display text-lg font-semibold text-white mt-1 mb-4">Best-selling items</h2><AnalyticsTable items={analytics.bestSellers} mode="best" comparisonLabel={comparisonLabel} /></section>
        <section className="bg-[#16213E] border border-white/5 rounded-2xl p-6"><p className="text-xs text-yellow-400 uppercase tracking-wider font-semibold">Review or improve</p><h2 className="font-display text-lg font-semibold text-white mt-1 mb-4">Low-demand items</h2><AnalyticsTable items={analytics.needsAttention} mode="attention" comparisonLabel={comparisonLabel} /></section>
      </div>
    </>}
  </div>;
}

const AnalyticsTable = ({ items = [], mode, comparisonLabel }) => !items.length ? <p className="text-sm text-[#8892A4] py-5">No menu-item data yet.</p> : <div className="space-y-3">{items.map((item, index) => <div key={item._id} className="flex items-center gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0"><span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${mode === 'best' ? 'bg-green-400/10 text-green-400' : 'bg-yellow-400/10 text-yellow-400'}`}>{index + 1}</span><div className="flex-1 min-w-0"><p className="text-sm text-white truncate">{item.name}</p><p className="text-xs text-[#8892A4]">{item.category} · {item.quantity} sold · ₹{item.revenue}</p></div><span className={`text-xs font-semibold ${item.quantityChange > 0 ? 'text-green-400' : item.quantityChange < 0 ? 'text-red-400' : 'text-[#8892A4]'}`}>{item.quantityChange > 0 ? '↑' : item.quantityChange < 0 ? '↓' : '–'} {Math.abs(item.quantityChange)} vs {comparisonLabel}</span></div>)}</div>;
