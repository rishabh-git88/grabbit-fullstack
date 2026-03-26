import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { orderAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { COLORS, STATUS_COLORS } from '../utils/theme';

const OrderHistoryCard = ({ order, onPress }) => {
  const cfg = STATUS_COLORS[order.status] || STATUS_COLORS.placed;
  const date = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderNum}>#{order.orderNumber}</Text>
          <Text style={styles.cafeName}>{order.cafeId?.name}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.date}>{date}</Text>
        <Text style={styles.amount}>₹{order.totalAmount}</Text>
      </View>
      <Text style={styles.itemsSummary} numberOfLines={1}>
        {order.items.map(i => `${i.name} ×${i.quantity}`).join(', ')}
      </Text>
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
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.orange} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <OrderHistoryCard
              order={item}
              onPress={() => navigation.navigate('OrderTracking', { orderId: item._id, orderNumber: item.orderNumber })}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor={COLORS.orange} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🍽️</Text>
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptyDesc}>Go grab some food!</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16 },
  title: { color: COLORS.text, fontSize: 26, fontWeight: '800' },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  card: { backgroundColor: COLORS.card, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  orderNum: { color: COLORS.text, fontWeight: '800', fontSize: 16 },
  cafeName: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  date: { color: COLORS.muted, fontSize: 12 },
  amount: { color: COLORS.orange, fontWeight: '700', fontSize: 15 },
  itemsSummary: { color: COLORS.muted, fontSize: 12 },
  empty: { alignItems: 'center', marginTop: 80, gap: 8 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  emptyDesc: { color: COLORS.muted, fontSize: 14 },
});

export default OrdersScreen;
