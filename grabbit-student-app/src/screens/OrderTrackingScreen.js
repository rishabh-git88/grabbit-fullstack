import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Image, ScrollView, Alert,
} from 'react-native';
import { orderAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useOrderSocket } from '../hooks/useOrderSocket';
import { COLORS, STATUS_COLORS } from '../utils/theme';

const STEPS = ['placed', 'accepted', 'preparing', 'ready', 'completed'];

const StatusStep = ({ step, currentStatus }) => {
  const currentIdx = STEPS.indexOf(currentStatus === 'rejected' ? 'placed' : currentStatus);
  const stepIdx = STEPS.indexOf(step);
  const isDone = stepIdx < currentIdx;
  const isActive = stepIdx === currentIdx;
  const isRejected = currentStatus === 'rejected' && step === 'placed';

  const STEP_LABELS = {
    placed: 'Order Placed', accepted: 'Accepted', preparing: 'Preparing',
    ready: 'Ready for Pickup', completed: 'Completed',
  };

  return (
    <View style={styles.stepRow}>
      <View style={styles.stepLeft}>
        <View style={[
          styles.stepDot,
          isDone && styles.stepDotDone,
          isActive && !isRejected && styles.stepDotActive,
          isRejected && styles.stepDotRejected,
        ]}>
          {isDone && <Text style={styles.stepCheck}>✓</Text>}
          {isActive && !isRejected && <View style={styles.stepPulse} />}
        </View>
        {step !== 'completed' && <View style={[styles.stepLine, isDone && styles.stepLineDone]} />}
      </View>
      <Text style={[
        styles.stepLabel,
        isDone && styles.stepLabelDone,
        isActive && styles.stepLabelActive,
      ]}>
        {isRejected ? 'Order Rejected ✕' : STEP_LABELS[step]}
      </Text>
    </View>
  );
};

const OrderTrackingScreen = ({ route, navigation }) => {
  const { orderId, orderNumber } = route.params;
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await orderAPI.getOrder(orderId);
      setOrder(res.data.order);
    } catch {
      Alert.alert('Error', 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    // Poll every 10 seconds as fallback
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  // Real-time socket updates
  useOrderSocket(user?._id, (data) => {
    if (data.orderId === orderId) {
      setOrder(prev => prev ? { ...prev, status: data.status } : prev);
    }
  });

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator color={COLORS.orange} size="large" />
    </View>
  );

  if (!order) return (
    <View style={styles.centered}>
      <Text style={styles.errorText}>Order not found</Text>
    </View>
  );

  const statusCfg = STATUS_COLORS[order.status] || STATUS_COLORS.placed;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.homeBtn}>
          <Text style={styles.homeBtnText}>← Home</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Track Order</Text>
      </View>

      {/* Order number + status */}
      <View style={styles.orderHero}>
        <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
          <Text style={[styles.statusText, { color: statusCfg.text }]}>{statusCfg.label}</Text>
        </View>
        <Text style={styles.orderNum}>#{order.orderNumber}</Text>
        <Text style={styles.cafeName}>{order.cafeId?.name}</Text>
      </View>

      {/* Progress tracker */}
      <View style={styles.progressCard}>
        <Text style={styles.cardTitle}>Order Progress</Text>
        {(order.status === 'rejected' ? ['placed'] : STEPS).map(step => (
          <StatusStep key={step} step={step} currentStatus={order.status} />
        ))}
      </View>

      {/* Ready for pickup banner */}
      {order.status === 'ready' && (
        <View style={styles.readyBanner}>
          <Text style={styles.readyEmoji}>🔔</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.readyTitle}>Your order is ready!</Text>
            <Text style={styles.readyDesc}>Head to {order.cafeId?.name} to collect. Pay ₹{order.remainingAmount} on pickup.</Text>
          </View>
        </View>
      )}

      {/* QR Code */}
      {order.qrCode && order.status !== 'rejected' && order.status !== 'completed' && (
        <View style={styles.qrCard}>
          <Text style={styles.cardTitle}>Pickup QR Code</Text>
          <Text style={styles.qrDesc}>Show this at the counter</Text>
          <Image source={{ uri: order.qrCode }} style={styles.qrImage} resizeMode="contain" />
        </View>
      )}

      {/* Items */}
      <View style={styles.itemsCard}>
        <Text style={styles.cardTitle}>Items Ordered</Text>
        {order.items.map((item, i) => (
          <View key={i} style={styles.itemRow}>
            <Text style={styles.itemName}><Text style={{ color: COLORS.orange }}>×{item.quantity}</Text> {item.name}</Text>
            <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(0)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.itemRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{order.totalAmount}</Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={{ color: COLORS.muted, fontSize: 13 }}>Advance paid (60%)</Text>
          <Text style={{ color: COLORS.green, fontWeight: '600' }}>₹{order.paidAmount}</Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={{ color: COLORS.muted, fontSize: 13 }}>Pay at pickup (40%)</Text>
          <Text style={{ color: COLORS.yellow, fontWeight: '600' }}>₹{order.remainingAmount}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingBottom: 40 },
  centered: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: COLORS.muted },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  homeBtn: { backgroundColor: COLORS.card, padding: 10, borderRadius: 12 },
  homeBtnText: { color: COLORS.orange, fontWeight: '600', fontSize: 14 },
  title: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  orderHero: { paddingHorizontal: 20, paddingVertical: 20, alignItems: 'flex-start' },
  statusBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 8 },
  statusText: { fontWeight: '700', fontSize: 14 },
  orderNum: { color: COLORS.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  cafeName: { color: COLORS.muted, fontSize: 14, marginTop: 2 },
  progressCard: { marginHorizontal: 20, backgroundColor: COLORS.card, borderRadius: 20, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { color: COLORS.text, fontWeight: '700', fontSize: 15, marginBottom: 18 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  stepLeft: { alignItems: 'center', width: 24 },
  stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.accent, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  stepDotDone: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  stepDotActive: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  stepDotRejected: { backgroundColor: COLORS.red, borderColor: COLORS.red },
  stepCheck: { color: '#fff', fontSize: 12, fontWeight: '800' },
  stepPulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  stepLine: { width: 2, height: 28, backgroundColor: COLORS.border, marginTop: 2 },
  stepLineDone: { backgroundColor: COLORS.green },
  stepLabel: { color: COLORS.muted, fontSize: 14, paddingTop: 2, paddingBottom: 26 },
  stepLabelDone: { color: COLORS.green },
  stepLabelActive: { color: COLORS.text, fontWeight: '700' },
  readyBanner: { marginHorizontal: 20, backgroundColor: '#22C55E15', borderRadius: 18, padding: 18, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#22C55E30' },
  readyEmoji: { fontSize: 32 },
  readyTitle: { color: '#22C55E', fontWeight: '800', fontSize: 16 },
  readyDesc: { color: COLORS.muted, fontSize: 13, marginTop: 3, lineHeight: 18 },
  qrCard: { marginHorizontal: 20, backgroundColor: COLORS.card, borderRadius: 20, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  qrDesc: { color: COLORS.muted, fontSize: 13, marginBottom: 16, marginTop: -8 },
  qrImage: { width: 200, height: 200, borderRadius: 12, backgroundColor: '#fff' },
  itemsCard: { marginHorizontal: 20, backgroundColor: COLORS.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.border },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  itemName: { color: COLORS.text, fontSize: 14, flex: 1 },
  itemPrice: { color: COLORS.muted, fontSize: 14 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 8 },
  totalLabel: { color: COLORS.text, fontWeight: '700', fontSize: 15 },
  totalValue: { color: COLORS.text, fontWeight: '800', fontSize: 17 },
});

export default OrderTrackingScreen;
