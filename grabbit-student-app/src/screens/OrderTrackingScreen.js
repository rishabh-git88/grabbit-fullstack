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
  { key: 'placed',    label: 'Order Placed',      icon: '🛒', desc: 'We received your order!' },
  { key: 'accepted',  label: 'Accepted',           icon: '✅', desc: 'Cafe confirmed your order' },
  { key: 'preparing', label: 'Being Prepared',     icon: '👨‍🍳', desc: 'Your food is cooking now' },
  { key: 'ready',     label: 'Ready for Pickup',   icon: '🔔', desc: 'Head to the counter!' },
  { key: 'completed', label: 'Picked Up',          icon: '🎉', desc: 'Enjoy your meal!' },
];

const ProgressStep = ({ step, currentStatus, isLast }) => {
  const currentIdx = STEPS.findIndex(s => s.key === (currentStatus === 'rejected' ? 'placed' : currentStatus));
  const stepIdx = STEPS.findIndex(s => s.key === step.key);
  const isDone = stepIdx < currentIdx;
  const isActive = stepIdx === currentIdx;
  const isRejected = currentStatus === 'rejected' && step.key === 'placed';

  return (
    <View style={trackStyles.stepRow}>
      <View style={trackStyles.stepTimeline}>
        <View style={[
          trackStyles.stepBubble,
          isDone && trackStyles.bubbleDone,
          isActive && !isRejected && trackStyles.bubbleActive,
          isRejected && trackStyles.bubbleRejected,
        ]}>
          {isRejected
            ? <Text style={trackStyles.bubbleText}>✕</Text>
            : isDone
              ? <Text style={trackStyles.bubbleText}>✓</Text>
              : isActive
                ? <Text style={trackStyles.bubbleActiveEmoji}>{step.icon}</Text>
                : <Text style={trackStyles.bubbleInactiveEmoji}>{step.icon}</Text>
          }
        </View>
        {!isLast && (
          <View style={[trackStyles.connector, isDone && trackStyles.connectorDone]} />
        )}
      </View>

      <View style={[trackStyles.stepInfo, !isLast && { paddingBottom: 24 }]}>
        <Text style={[
          trackStyles.stepLabel,
          isDone && trackStyles.labelDone,
          isActive && !isRejected && trackStyles.labelActive,
          isRejected && trackStyles.labelRejected,
        ]}>
          {isRejected ? 'Order Rejected' : step.label}
        </Text>
        <Text style={trackStyles.stepDesc}>
          {isRejected ? 'Your order was cancelled by the cafe' : step.desc}
        </Text>
        {isActive && !isRejected && (
          <View style={trackStyles.activePill}>
            <Text style={trackStyles.activePillText}>● In progress</Text>
          </View>
        )}
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
        <Text style={styles.loadingText}>Loading order…</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text style={{ fontSize: 48 }}>⚠️</Text>
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  const statusCfg = STATUS_COLORS[order.status] || STATUS_COLORS.placed;
  const isReady = order.status === 'ready';
  const isPreparing = order.status === 'preparing';
  const isAccepted = order.status === 'accepted';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.orange} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Track Order</Text>
          <Text style={styles.headerSub}>Order #{order.orderNumber}</Text>
        </View>
        <View style={styles.liveChip}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live</Text>
        </View>
      </View>

      {/* Status hero */}
      <View style={[styles.statusHero, { backgroundColor: statusCfg.bg }]}>
        <Text style={styles.statusHeroEmoji}>
          {order.status === 'placed' ? '🛒' :
           order.status === 'accepted' ? '✅' :
           order.status === 'preparing' ? '👨‍🍳' :
           order.status === 'ready' ? '🔔' :
           order.status === 'completed' ? '🎉' : '❌'}
        </Text>
        <Text style={[styles.statusHeroLabel, { color: statusCfg.text }]}>
          {statusCfg.label}
        </Text>
        {isReady && (
          <Text style={[styles.statusHeroSub, { color: statusCfg.text }]}>
            Head to {order.cafeId?.name} now!
          </Text>
        )}
        {isPreparing && (
          <Text style={[styles.statusHeroSub, { color: statusCfg.text }]}>
            Your food is being cooked
          </Text>
        )}
        {isAccepted && (
          <Text style={[styles.statusHeroSub, { color: statusCfg.text }]}>
            Cafe confirmed your order
          </Text>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Ready to pickup banner */}
        {isReady && (
          <View style={styles.readyCard}>
            <Text style={styles.readyCardEmoji}>🔔</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.readyCardTitle}>Ready for pickup!</Text>
              <Text style={styles.readyCardDesc}>
                Head to the counter at {order.cafeId?.name}.{'\n'}
                Bring ₹{order.remainingAmount} for the remaining 40%.
              </Text>
            </View>
          </View>
        )}

        {/* Cafe */}
        <View style={styles.card}>
          <View style={styles.cafeRow}>
            <View style={styles.cafeIconBox}>
              <Text style={styles.cafeIconEmoji}>🏪</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cafeCardName}>{order.cafeId?.name}</Text>
              <Text style={styles.cafeCardHint}>Show QR code when collecting</Text>
            </View>
            <View style={[styles.statusDotSmall, { backgroundColor: '#22C55E' }]} />
          </View>
        </View>

        {/* Progress tracker */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Progress</Text>
          <View style={styles.progressWrap}>
            {STEPS.map((step, i) => (
              <ProgressStep
                key={step.key}
                step={step}
                currentStatus={order.status}
                isLast={i === STEPS.length - 1}
              />
            ))}
          </View>
        </View>

        {/* QR Code */}
        {order.qrCode && !['rejected', 'completed'].includes(order.status) && (
          <View style={[styles.card, styles.qrCard]}>
            <Text style={styles.cardTitle}>Pickup QR Code</Text>
            <Text style={styles.qrHint}>Show this at the counter to collect your order</Text>
            <View style={styles.qrFrame}>
              <Image source={{ uri: order.qrCode }} style={styles.qrImage} resizeMode="contain" />
            </View>
          </View>
        )}

        {/* Bill */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary</Text>

          {order.items.map((item, i) => (
            <View key={i} style={styles.billItemRow}>
              <View style={styles.billQtyBadge}>
                <Text style={styles.billQtyText}>{item.quantity}×</Text>
              </View>
              <Text style={styles.billItemName}>{item.name}</Text>
              <Text style={styles.billItemAmt}>₹{(item.price * item.quantity).toFixed(0)}</Text>
            </View>
          ))}

          <View style={styles.billDivider} />

          <View style={styles.billTotalRow}>
            <Text style={styles.billTotalLabel}>Total</Text>
            <Text style={styles.billTotalAmt}>₹{order.totalAmount}</Text>
          </View>

          <View style={styles.paymentBreakdown}>
            <View style={styles.paymentRow}>
              <View style={styles.paymentDot} />
              <Text style={styles.paymentLabel}>Advance paid (60%)</Text>
              <Text style={[styles.paymentAmt, { color: '#10B981' }]}>₹{order.paidAmount}</Text>
            </View>
            <View style={styles.paymentRow}>
              <View style={[styles.paymentDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.paymentLabel}>Pay at pickup (40%)</Text>
              <Text style={[styles.paymentAmt, { color: '#F59E0B' }]}>₹{order.remainingAmount}</Text>
            </View>
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
  loadingText: { color: COLORS.muted, fontSize: 14 },
  errorText: { color: COLORS.muted, fontSize: 16 },

  header: {
    backgroundColor: COLORS.orange,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { color: '#fff', fontSize: 22 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 1 },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80' },
  liveText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  statusHero: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 4,
  },
  statusHeroEmoji: { fontSize: 44, marginBottom: 4 },
  statusHeroLabel: { fontSize: 20, fontWeight: '900' },
  statusHeroSub: { fontSize: 13, fontWeight: '500', opacity: 0.8 },

  scroll: { padding: 16, paddingBottom: 40 },

  readyCard: {
    backgroundColor: '#DCFCE7',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  readyCardEmoji: { fontSize: 32, marginTop: 2 },
  readyCardTitle: { color: '#15803D', fontWeight: '800', fontSize: 15, marginBottom: 4 },
  readyCardDesc: { color: '#166534', fontSize: 13, lineHeight: 19 },

  card: {
    backgroundColor: COLORS.bg,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardTitle: { color: COLORS.text, fontWeight: '800', fontSize: 15, marginBottom: 16 },

  cafeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cafeIconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: COLORS.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cafeIconEmoji: { fontSize: 24 },
  cafeCardName: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  cafeCardHint: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  statusDotSmall: { width: 10, height: 10, borderRadius: 5 },

  progressWrap: {},

  qrCard: { alignItems: 'center' },
  qrHint: { color: COLORS.muted, fontSize: 13, textAlign: 'center', marginTop: -8, marginBottom: 16 },
  qrFrame: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  qrImage: { width: 180, height: 180, borderRadius: 8 },

  billItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  billQtyBadge: {
    backgroundColor: COLORS.orangeLight,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  billQtyText: { color: COLORS.orange, fontWeight: '800', fontSize: 12 },
  billItemName: { flex: 1, color: COLORS.subtext, fontSize: 14 },
  billItemAmt: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  billDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  billTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  billTotalLabel: { color: COLORS.text, fontWeight: '800', fontSize: 15 },
  billTotalAmt: { color: COLORS.text, fontWeight: '900', fontSize: 16 },

  paymentBreakdown: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  paymentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  paymentLabel: { flex: 1, color: COLORS.subtext, fontSize: 13 },
  paymentAmt: { fontWeight: '700', fontSize: 13 },
});

const trackStyles = StyleSheet.create({
  stepRow: { flexDirection: 'row', gap: 14 },
  stepTimeline: { alignItems: 'center', width: 36 },
  stepBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleDone: { backgroundColor: '#10B981', borderColor: '#10B981' },
  bubbleActive: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  bubbleRejected: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  bubbleText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  bubbleActiveEmoji: { fontSize: 17 },
  bubbleInactiveEmoji: { fontSize: 17, opacity: 0.4 },
  connector: { width: 2, flex: 1, minHeight: 20, backgroundColor: COLORS.border, marginTop: 2 },
  connectorDone: { backgroundColor: '#10B981' },
  stepInfo: { flex: 1, paddingTop: 4 },
  stepLabel: { color: COLORS.muted, fontSize: 14, fontWeight: '600' },
  labelDone: { color: '#10B981', fontWeight: '700' },
  labelActive: { color: COLORS.text, fontWeight: '800', fontSize: 15 },
  labelRejected: { color: '#EF4444', fontWeight: '700' },
  stepDesc: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  activePill: {
    marginTop: 6,
    backgroundColor: COLORS.orangeLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  activePillText: { color: COLORS.orange, fontSize: 11, fontWeight: '700' },
});

export default OrderTrackingScreen;
