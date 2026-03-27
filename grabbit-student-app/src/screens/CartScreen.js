import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, ScrollView, StatusBar,
} from 'react-native';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI, paymentAPI } from '../api';
import { COLORS } from '../utils/theme';

const CartScreen = ({ route, navigation }) => {
  const { cafe } = route.params;
  const { cart, totalAmount, clearCart, addItem, removeItem } = useCart();
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);

  const advance = Math.round(totalAmount * 0.6 * 100) / 100;
  const remaining = Math.round((totalAmount - advance) * 100) / 100;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setPlacing(true);
    try {
      const orderRes = await orderAPI.place({
        cafeId: cafe._id,
        items: cart.map(i => ({ itemId: i.itemId, quantity: i.quantity })),
        notes,
      });
      const order = orderRes.data.order;
      const payRes = await paymentAPI.create(order._id);

      if (payRes.data.simulated) {
        clearCart();
        navigation.reset({
          index: 0,
          routes: [{ name: 'OrderTracking', params: { orderId: order._id, orderNumber: order.orderNumber } }],
        });
      } else {
        Alert.alert(
          'Payment Required',
          `Pay ₹${advance} (60% advance) to confirm your order.\n\nRazorpay Order ID: ${payRes.data.razorpayOrderId}`,
          [
            {
              text: 'Simulate Success',
              onPress: () => {
                clearCart();
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'OrderTracking', params: { orderId: order._id, orderNumber: order.orderNumber } }],
                });
              },
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to place order. Try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <View style={styles.emptyScreen}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptyDesc}>Looks like you haven't added anything yet</Text>
        <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.browseBtnText}>Browse Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Your Cart</Text>
          <Text style={styles.subtitle}>{cafe.name}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Items list */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Order Items</Text>
          {cart.map(item => (
            <View key={item.itemId} style={styles.cartItem}>
              <View style={styles.itemEmojiBadge}>
                <Text style={styles.itemEmoji}>🍽️</Text>
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemUnit}>₹{item.price} each</Text>
              </View>
              <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => removeItem(item.itemId)}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyNum}>{item.quantity}</Text>
                <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={() => addItem(item, cafe)}>
                  <Text style={[styles.qtyBtnText, { color: '#fff' }]}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.itemTotal}>₹{(item.price * item.quantity).toFixed(0)}</Text>
            </View>
          ))}
        </View>

        {/* Special instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Special Instructions</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="E.g. Less spicy, no onions, extra sauce…"
            placeholderTextColor={COLORS.muted}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Bill summary */}
        <View style={styles.billCard}>
          <Text style={styles.billTitle}>Bill Details</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>₹{totalAmount.toFixed(0)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={[styles.billValue, { color: COLORS.green }]}>FREE</Text>
          </View>

          <View style={styles.billDivider} />

          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { fontWeight: '800', color: COLORS.text }]}>Total</Text>
            <Text style={[styles.billValue, { fontWeight: '900', fontSize: 18, color: COLORS.text }]}>₹{totalAmount.toFixed(0)}</Text>
          </View>
        </View>

        {/* Payment split */}
        <View style={styles.splitCard}>
          <Text style={styles.splitTitle}>Payment Split</Text>
          <View style={styles.splitRow}>
            <View style={[styles.splitHalf, { borderRightWidth: 1, borderRightColor: COLORS.border }]}>
              <Text style={styles.splitIcon}>💳</Text>
              <Text style={styles.splitAmt} numberOfLines={1}>₹{advance.toFixed(0)}</Text>
              <Text style={styles.splitLabel}>Pay Now (60%)</Text>
              <Text style={styles.splitDesc}>Online</Text>
            </View>
            <View style={styles.splitHalf}>
              <Text style={styles.splitIcon}>🏷️</Text>
              <Text style={styles.splitAmt}>₹{remaining.toFixed(0)}</Text>
              <Text style={styles.splitLabel}>At Pickup (40%)</Text>
              <Text style={styles.splitDesc}>Cash / UPI</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeBtn, placing && styles.placeBtnDisabled]}
          onPress={handlePlaceOrder}
          disabled={placing}
          activeOpacity={0.88}
        >
          {placing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.placeBtnInner}>
              <Text style={styles.placeBtnMain}>Pay ₹{advance.toFixed(0)} & Place Order</Text>
              <Text style={styles.placeBtnSub}>60% now · 40% at pickup</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  emptyScreen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  emptyEmoji: { fontSize: 72, marginBottom: 8 },
  emptyTitle: { color: COLORS.text, fontSize: 22, fontWeight: '800' },
  emptyDesc: { color: COLORS.muted, fontSize: 14, textAlign: 'center' },
  browseBtn: {
    backgroundColor: COLORS.orange,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  browseBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  header: {
    backgroundColor: COLORS.bg,
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backArrow: { color: COLORS.text, fontSize: 22 },
  title: { color: COLORS.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: COLORS.muted, fontSize: 13, marginTop: 1 },
  scroll: { padding: 16, paddingBottom: 120 },
  section: { marginBottom: 14 },
  sectionLabel: { color: COLORS.subtext, fontSize: 13, fontWeight: '700', marginBottom: 10, letterSpacing: 0.3 },
  cartItem: {
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  itemEmojiBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemEmoji: { fontSize: 22 },
  itemInfo: { flex: 1 },
  itemName: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  itemUnit: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qtyBtnAdd: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  qtyBtnText: { color: COLORS.text, fontSize: 16, fontWeight: '800', lineHeight: 20 },
  qtyNum: { color: COLORS.text, fontWeight: '800', fontSize: 15, minWidth: 20, textAlign: 'center' },
  itemTotal: { color: COLORS.orange, fontWeight: '800', fontSize: 15, minWidth: 48, textAlign: 'right' },
  notesInput: {
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    padding: 14,
    color: COLORS.text,
    fontSize: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  billCard: {
    backgroundColor: COLORS.bg,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  billTitle: { color: COLORS.text, fontWeight: '800', fontSize: 15, marginBottom: 14 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  billLabel: { color: COLORS.subtext, fontSize: 14 },
  billValue: { color: COLORS.subtext, fontSize: 14, fontWeight: '600' },
  billDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },
  splitCard: {
    backgroundColor: COLORS.bg,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  splitTitle: { color: COLORS.text, fontWeight: '800', fontSize: 15, padding: 18, paddingBottom: 14 },
  splitRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.border },
  splitHalf: { flex: 1, alignItems: 'center', paddingVertical: 18, gap: 4 },
  splitIcon: { fontSize: 26, marginBottom: 4 },
  splitAmt: { color: COLORS.text, fontSize: 20, fontWeight: '900' },
  splitLabel: { color: COLORS.subtext, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  splitDesc: { color: COLORS.muted, fontSize: 11, textAlign: 'center' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.bg,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  placeBtn: {
    backgroundColor: COLORS.orange,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: COLORS.orange,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  placeBtnDisabled: { opacity: 0.65 },
  placeBtnInner: { alignItems: 'center', gap: 3 },
  placeBtnMain: { color: '#fff', fontSize: 17, fontWeight: '800' },
  placeBtnSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
});

export default CartScreen;
