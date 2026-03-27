import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { orderAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { COLORS, STATUS_COLORS } from '../utils/theme';

const STATUS_ICONS = {
  placed: '🕐',
  accepted: '✅',
  preparing: '👨‍🍳',
  ready: '🔔',
  completed: '✅',
  rejected: '❌',
};

const OrderCard = ({ order, onPress }) => {
  const cfg = STATUS_COLORS[order.status] || STATUS_COLORS.placed;
  const icon = STATUS_ICONS[order.status] || '🕐';
  const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
  const isActive = ['placed', 'accepted', 'preparing', 'ready'].includes(order.status);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      {isActive && <View style={styles.activeLine} />}

      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <View style={[styles.statusIcon, { backgroundColor: cfg.bg }]}>
            <Text style={styles.statusEmoji}>{icon}</Text>
          </View>
          <View>
            <Text style={styles.orderNum}>#{order.orderNumber}</Text>
            <Text style={styles.cafeName}>{order.cafeId?.name}</Text>
          </View>
        </View>
        <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
        </View>
      </View>

      <Text style={styles.itemsList} numberOfLines={1}>
        {order.items.map(i => `${i.name} ×${i.quantity}`).join(' · ')}
      </Text>

      <View style={styles.cardBottom}>
        <Text style={styles.date}>{date}</Text>
        <Text style={styles.amount}>₹{order.totalAmount}</Text>
      </View>

      {isActive && (
        <View style={styles.trackRow}>
          <Text style={styles.trackText}>Tap to track order</Text>
          <Text style={styles.trackArrow}>→</Text>
        </View>
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
        <Text style={styles.subtitle}>Your order history</Text>
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
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>🍽️</Text>
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptyDesc}>Your order history will appear here</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { color: COLORS.text, fontSize: 26, fontWeight: '900' },
  subtitle: { color: COLORS.muted, fontSize: 13, marginTop: 2 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: COLORS.bg,
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    padding: 16,
  },
  activeLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.orange,
    borderRadius: 4,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusEmoji: { fontSize: 22 },
  orderNum: { color: COLORS.text, fontWeight: '800', fontSize: 15 },
  cafeName: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  itemsList: { color: COLORS.subtext, fontSize: 12, marginBottom: 10, lineHeight: 16 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { color: COLORS.muted, fontSize: 12 },
  amount: { color: COLORS.orange, fontWeight: '800', fontSize: 16 },
  trackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  trackText: { color: COLORS.orange, fontSize: 12, fontWeight: '600' },
  trackArrow: { color: COLORS.orange, fontSize: 14, fontWeight: '700' },
  emptyBox: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyEmoji: { fontSize: 64, marginBottom: 8 },
  emptyTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  emptyDesc: { color: COLORS.muted, fontSize: 14, textAlign: 'center' },
});

export default OrdersScreen;
