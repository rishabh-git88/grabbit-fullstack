import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Image, ScrollView, Alert, StatusBar,
} from 'react-native';
import { orderAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useOrderSocket } from '../hooks/useOrderSocket';
import { COLORS, STATUS_COLORS } from '../utils/theme';

const STEPS = [
  { key: 'placed',    label: 'Order Placed',      icon: '🛒', desc: 'We received your order' },
  { key: 'accepted',  label: 'Accepted',           icon: '✅', desc: 'Cafe confirmed your order' },
  { key: 'preparing', label: 'Preparing',          icon: '👨‍🍳', desc: 'Your food is being cooked' },
  { key: 'ready',     label: 'Ready for Pickup',   icon: '🔔', desc: 'Head to the counter now!' },
  { key: 'completed', label: 'Completed',          icon: '🎉', desc: 'Enjoy your meal!' },
];

const ProgressStep = ({ step, currentStatus, isLast }) => {
  const currentIdx = STEPS.findIndex(s => s.key === (currentStatus === 'rejected' ? 'placed' : currentStatus));
  const stepIdx = STEPS.findIndex(s => s.key === step.key);
  const isDone = stepIdx < currentIdx;
  const isActive = stepIdx === currentIdx;
  const isRejected = currentStatus === 'rejected' && step.key === 'placed';

  return (
    <View style={styles.stepRow}>
      <View style={styles.stepLeft}>
        <View style={[
          styles.stepCircle,
          isDone && styles.stepDone,
          isActive && !isRejected && styles.stepActive,
          isRejected && styles.stepRejected,
        ]}>
          {isRejected
            ? <Text style={styles.stepEmojiText}>✕</Text>
            : isDone
              ? <Text style={styles.stepEmojiText}>✓</Text>
              : <Text style={styles.stepEmojiInactive}>{step.icon}</Text>
          }
        </View>
        {!isLast && (
          <View style={[styles.stepConnector, isDone && styles.stepConnectorDone]} />
        )}
      </View>

      <View style={styles.stepContent}>
        <Text style={[
          styles.stepLabel,
          isActive && styles.stepLabelActive,
          isDone && styles.stepLabelDone,
        ]}>
          {isRejected ? 'Order Rejected' : step.label}
        </Text>
        <Text style={styles.stepDesc}>
          {isRejected ? 'Your order was cancelled' : step.desc}
        </Text>
      </View>
    </View>
  );
};

const OrderTrackingScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
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
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  useOrderSocket(user?._id, (data) => {
    if (data.orderId === orderId) {
      setOrder(prev => prev ? { ...prev, status: data.status } : prev);
    }
  });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.orange} size="large" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  const statusCfg = STATUS_COLORS[order.status] || STATUS_COLORS.placed;
  const isReady = order.status === 'ready';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.orange} />

      {/* Orange header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Track Order</Text>
          <Text style={styles.headerSub}>#{order.orderNumber}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <Text style={styles.statusBadgeText}>{statusCfg.label}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Cafe info card */}
        <View style={styles.cafeCard}>
          <View style={styles.cafeIconBox}>
            <Text style={styles.cafeIcon}>🍽️</Text>
          </View>
          <View>
            <Text style={styles.cafeName}>{order.cafeId?.name}</Text>
            <Text style={styles.cafeHint}>Show QR code when collecting</Text>
          </View>
        </View>

        {/* Ready banner */}
        {isReady && (
          <View style={styles.readyBanner}>
            <Text style={styles.readyBannerEmoji}>🔔</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.readyBannerTitle}>Your order is ready!</Text>
              <Text style={styles.readyBannerDesc}>
                Head to {order.cafeId?.name}. Pay ₹{order.remainingAmount} at pickup.
              </Text>
            </View>
          </View>
        )}

        {/* Progress tracker */}
        <View style={styles.progressCard}>
          <Text style={styles.cardTitle}>Order Progress</Text>
          {STEPS.map((step, i) => (
            <ProgressStep
              key={step.key}
              step={step}
              currentStatus={order.status}
              isLast={i === STEPS.length - 1}
            />
          ))}
        </View>

        {/* QR Code */}
        {order.qrCode && !['rejected', 'completed'].includes(order.status) && (
          <View style={styles.qrCard}>
            <Text style={styles.cardTitle}>Pickup QR Code</Text>
            <Text style={styles.qrHint}>Show this at the counter to collect your order</Text>
            <View style={styles.qrFrame}>
              <Image source={{ uri: order.qrCode }} style={styles.qrImage} resizeMode="contain" />
            </View>
          </View>
        )}

        {/* Bill details */}
        <View style={styles.billCard}>
          <Text style={styles.cardTitle}>Order Summary</Text>
          {order.items.map((item, i) => (
            <View key={i} style={styles.billRow}>
              <Text style={styles.billItem}>
                <Text style={{ color: COLORS.orange, fontWeight: '700' }}>×{item.quantity}</Text>
                {'  '}{item.name}
              </Text>
              <Text style={styles.billItemPrice}>₹{(item.price * item.quantity).toFixed(0)}</Text>
            </View>
          ))}
          <View style={styles.billDivider} />
          <View style={styles.billRow}>
            <Text style={styles.billTotal}>Total Amount</Text>
            <Text style={[styles.billTotal, { color: COLORS.text }]}>₹{order.totalAmount}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billSub}>Advance Paid (60%)</Text>
            <Text style={[styles.billSub, { color: COLORS.green, fontWeight: '700' }]}>₹{order.paidAmount}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billSub}>Pay at Pickup (40%)</Text>
            <Text style={[styles.billSub, { color: COLORS.yellow, fontWeight: '700' }]}>₹{order.remainingAmount}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  centered: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorEmoji: { fontSize: 48 },
  errorText: { color: COLORS.muted, fontSize: 16 },
  header: {
    backgroundColor: COLORS.orange,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 18,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { color: '#fff', fontSize: 22, lineHeight: 26 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 1 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 40 },
  cafeCard: {
    backgroundColor: COLORS.bg,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cafeIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cafeIcon: { fontSize: 26 },
  cafeName: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  cafeHint: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  readyBanner: {
    backgroundColor: '#DCFCE7',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  readyBannerEmoji: { fontSize: 32 },
  readyBannerTitle: { color: '#15803D', fontWeight: '800', fontSize: 16 },
  readyBannerDesc: { color: '#166534', fontSize: 12, marginTop: 3, lineHeight: 17 },
  progressCard: {
    backgroundColor: COLORS.bg,
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { color: COLORS.text, fontWeight: '800', fontSize: 16, marginBottom: 20 },
  stepRow: { flexDirection: 'row', gap: 16, marginBottom: 0 },
  stepLeft: { alignItems: 'center', width: 36 },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDone: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  stepActive: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  stepRejected: { backgroundColor: COLORS.red, borderColor: COLORS.red },
  stepEmojiText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  stepEmojiInactive: { fontSize: 16 },
  stepConnector: { width: 2, flex: 1, minHeight: 28, backgroundColor: COLORS.border, marginTop: 4 },
  stepConnectorDone: { backgroundColor: COLORS.green },
  stepContent: { flex: 1, paddingBottom: 20, paddingTop: 4 },
  stepLabel: { color: COLORS.muted, fontSize: 14, fontWeight: '600' },
  stepLabelActive: { color: COLORS.text, fontWeight: '800' },
  stepLabelDone: { color: COLORS.green, fontWeight: '700' },
  stepDesc: { color: COLORS.muted, fontSize: 12, marginTop: 3 },
  qrCard: {
    backgroundColor: COLORS.bg,
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  qrHint: { color: COLORS.muted, fontSize: 13, marginBottom: 20, marginTop: -8 },
  qrFrame: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qrImage: { width: 180, height: 180, borderRadius: 8 },
  billCard: {
    backgroundColor: COLORS.bg,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  billItem: { color: COLORS.subtext, fontSize: 13, flex: 1 },
  billItemPrice: { color: COLORS.subtext, fontSize: 13 },
  billDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },
  billTotal: { color: COLORS.subtext, fontWeight: '800', fontSize: 15 },
  billSub: { color: COLORS.muted, fontSize: 13 },
});

export default OrderTrackingScreen;
