import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, ScrollView,
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
      // 1. Create order
      const orderRes = await orderAPI.place({
        cafeId: cafe._id,
        items: cart.map(i => ({ itemId: i.itemId, quantity: i.quantity })),
        notes,
      });
      const order = orderRes.data.order;

      // 2. Create payment (simulated or Razorpay)
      const payRes = await paymentAPI.create(order._id);

      if (payRes.data.simulated) {
        // Simulated payment — go straight to tracking
        clearCart();
        navigation.reset({ index: 0, routes: [{ name: 'OrderTracking', params: { orderId: order._id, orderNumber: order.orderNumber } }] });
      } else {
        // Real Razorpay — in production integrate RazorpayCheckout here
        Alert.alert(
          'Payment Required',
          `Pay ₹${advance} (60% advance) to confirm your order.\n\nRazorpay Order ID: ${payRes.data.razorpayOrderId}`,
          [
            {
              text: 'Simulate Success',
              onPress: async () => {
                clearCart();
                navigation.reset({ index: 0, routes: [{ name: 'OrderTracking', params: { orderId: order._id, orderNumber: order.orderNumber } }] });
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
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={styles.emptyTitle}>Cart is empty</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backToMenuBtn}>
          <Text style={styles.backToMenuText}>Browse Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Your Cart</Text>
        <Text style={styles.cafeName}>{cafe.name}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Items */}
        {cart.map(item => (
          <View key={item.itemId} style={styles.cartItem}>
            <View style={styles.cartItemInfo}>
              <Text style={styles.cartItemName}>{item.name}</Text>
              <Text style={styles.cartItemPrice}>₹{item.price} each</Text>
            </View>
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => removeItem(item.itemId)}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={() => addItem(item, cafe)}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
              <Text style={styles.itemTotal}>₹{(item.price * item.quantity).toFixed(0)}</Text>
            </View>
          </View>
        ))}

        {/* Notes */}
        <View style={styles.notesBox}>
          <Text style={styles.notesLabel}>Special Instructions (optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes} onChangeText={setNotes}
            placeholder="e.g. Less spicy, no onions…"
            placeholderTextColor={COLORS.muted}
            multiline numberOfLines={2}
          />
        </View>

        {/* Payment breakdown */}
        <View style={styles.breakdown}>
          <Text style={styles.breakdownTitle}>Payment Summary</Text>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Total Amount</Text>
            <Text style={styles.breakdownValue}>₹{totalAmount.toFixed(0)}</Text>
          </View>
          <View style={[styles.breakdownRow, styles.payNowRow]}>
            <View>
              <Text style={[styles.breakdownLabel, { color: COLORS.orange }]}>Pay Now (60%)</Text>
              <Text style={styles.breakdownSub}>Online payment to confirm order</Text>
            </View>
            <Text style={[styles.breakdownValue, { color: COLORS.orange, fontSize: 20 }]}>₹{advance.toFixed(0)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <View>
              <Text style={styles.breakdownLabel}>Pay at Pickup (40%)</Text>
              <Text style={styles.breakdownSub}>Pay remaining when collecting</Text>
            </View>
            <Text style={[styles.breakdownValue, { color: COLORS.muted }]}>₹{remaining.toFixed(0)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order button */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.placeBtn, placing && styles.placeBtnDisabled]} onPress={handlePlaceOrder} disabled={placing}>
          {placing ? <ActivityIndicator color="#fff" /> : (
            <>
              <Text style={styles.placeBtnText}>Pay ₹{advance.toFixed(0)} & Place Order</Text>
              <Text style={styles.placeBtnSub}>60% advance · rest at pickup</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  emptyContainer: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  backToMenuBtn: { backgroundColor: COLORS.orange, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, marginTop: 8 },
  backToMenuText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  backText: { color: COLORS.text, fontSize: 20 },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '800' },
  cafeName: { color: COLORS.muted, fontSize: 13, marginTop: 2 },
  scroll: { paddingHorizontal: 20, paddingBottom: 120 },
  cartItem: { backgroundColor: COLORS.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  cartItemInfo: { marginBottom: 10 },
  cartItemName: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  cartItemPrice: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: { width: 30, height: 30, borderRadius: 9, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  qtyBtnAdd: { backgroundColor: COLORS.orange },
  qtyBtnText: { color: '#fff', fontSize: 18, fontWeight: '700', lineHeight: 22 },
  qtyText: { color: COLORS.text, fontWeight: '700', fontSize: 16, minWidth: 24, textAlign: 'center' },
  itemTotal: { color: COLORS.orange, fontWeight: '700', fontSize: 15, marginLeft: 'auto' },
  notesBox: { marginVertical: 8 },
  notesLabel: { color: COLORS.muted, fontSize: 12, fontWeight: '600', marginBottom: 8, letterSpacing: 0.5 },
  notesInput: { backgroundColor: COLORS.card, borderRadius: 14, padding: 14, color: COLORS.text, fontSize: 14, borderWidth: 1, borderColor: COLORS.border, minHeight: 70, textAlignVertical: 'top' },
  breakdown: { backgroundColor: COLORS.card, borderRadius: 20, padding: 18, marginTop: 12, borderWidth: 1, borderColor: COLORS.border },
  breakdownTitle: { color: COLORS.text, fontWeight: '700', fontSize: 15, marginBottom: 14 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  payNowRow: { backgroundColor: COLORS.orange + '08', marginHorizontal: -18, paddingHorizontal: 18, borderRadius: 0 },
  breakdownLabel: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  breakdownSub: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  breakdownValue: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.bg, padding: 20, paddingBottom: 34, borderTopWidth: 1, borderTopColor: COLORS.border },
  placeBtn: { backgroundColor: COLORS.orange, borderRadius: 18, paddingVertical: 16, alignItems: 'center', shadowColor: COLORS.orange, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  placeBtnDisabled: { opacity: 0.6 },
  placeBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  placeBtnSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 3 },
});

export default CartScreen;
