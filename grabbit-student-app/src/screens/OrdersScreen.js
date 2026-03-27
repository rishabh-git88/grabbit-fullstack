import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { orderAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { COLORS, STATUS_COLORS } from '../utils/theme';

const STATUS_META = {
  placed:    { icon: '🕐', pulse: true },
  accepted:  { icon: '✅', pulse: true },
  preparing: { icon: '👨‍🍳', pulse: true },
  ready:     { icon: '🔔', pulse: true },
  completed: { icon: '✅', pulse: false },
  rejected:  { icon: '❌', pulse: false },
};

const OrderCard = ({ order, onPress }) => {
  const cfg = STATUS_COLORS[order.status] || STATUS_COLORS.placed;
  const meta = STATUS_META[order.status] || STATUS_META.placed;
  const isActive = ['placed', 'accepted', 'preparing', 'ready'].includes(order.status);

  const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short',
  });
  const time = new Date(order.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      {isActive && <View style={styles.activeAccent} />}

      <View style={styles.cardHeader}>
        <View style={[styles.iconCircle, { backgroundColor: cfg.bg }]}>
          <Text style={styles.iconEmoji}>{meta.icon}</Text>
        </View>

        <View style={styles.orderMeta}>
          <Text style={styles.orderNum}>Order #{order.orderNumber}</Text>
          <Text style={styles.cafeName}>{order.cafeId?.name}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Items */}
      <Text style={styles.itemsList} numberOfLines={1}>
        {order.items.map(i => `${i.name} ×${i.quantity}`).join('  ·  ')}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.dateWrap}>
          <Text style={styles.dateText}>{date}</Text>
          <Text style={styles.timeDot}>·</Text>
          <Text style={styles.dateText}>{time}</Text>
        </View>
        <Text style={styles.amountText}>₹{order.totalAmount}</Text>
      </View>

      {isActive && (
        <TouchableOpacity style={styles.trackBtn} onPress={onPress} activeOpacity={0.85}>
          <Text style={styles.trackBtnText}>Track your order</Text>
          <Text style={styles.trackArrow}> →</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const OrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const fetchOrders = useCallback(async () => {
    try {
      const res = await orderAPI.getUserOrders(user._id);
      setOrders(res.data.orders);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user._id]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const activeOrders = orders.filter(o => ['placed','accepted','preparing','ready'].includes(o.status));
  const pastOrders = orders.filter(o => ['completed','rejected'].includes(o.status));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        {orders.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{orders.length}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={COLORS.orange} size="large" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={() => navigation.navigate('OrderTracking', {
                orderId: item._id,
                orderNumber: item.orderNumber,
              })}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchOrders(); }}
              tintColor={COLORS.orange}
              colors={[COLORS.orange]}
            />
          }
          ListHeaderComponent={
            activeOrders.length > 0 ? (
              <View style={styles.sectionLabel}>
                <View style={styles.activePulse} />
                <Text style={styles.sectionLabelText}>Active orders</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconBox}>
                <Text style={styles.emptyEmoji}>🍽️</Text>
              </View>
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptyDesc}>Your order history will appear here once you place your first order</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    backgroundColor: COLORS.bg,
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { color: COLORS.text, fontSize: 26, fontWeight: '900', flex: 1 },
  countBadge: {
    backgroundColor: COLORS.orangeLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: { color: COLORS.orange, fontWeight: '800', fontSize: 13 },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 100 },

  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  activePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.orange,
  },
  sectionLabelText: { color: COLORS.text, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  card: {
    backgroundColor: COLORS.bg,
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    padding: 16,
  },
  activeAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.orange,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: { fontSize: 22 },
  orderMeta: { flex: 1 },
  orderNum: { color: COLORS.text, fontWeight: '800', fontSize: 15 },
  cafeName: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: { fontSize: 11, fontWeight: '700' },

  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: 10 },

  itemsList: {
    color: COLORS.subtext,
    fontSize: 13,
    marginBottom: 10,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { color: COLORS.muted, fontSize: 12 },
  timeDot: { color: COLORS.muted, fontSize: 12 },
  amountText: { color: COLORS.text, fontWeight: '800', fontSize: 15 },

  trackBtn: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackBtnText: { color: COLORS.orange, fontWeight: '700', fontSize: 13 },
  trackArrow: { color: COLORS.orange, fontWeight: '700', fontSize: 14 },

  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 12, paddingHorizontal: 32 },
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: COLORS.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  emptyDesc: { color: COLORS.muted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
});

export default OrdersScreen;
