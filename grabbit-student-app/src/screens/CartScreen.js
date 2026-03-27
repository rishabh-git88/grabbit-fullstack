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
          `Pay ₹${advance} (60% advance) to confirm your order.`,
          [
            {
              text: 'Simulate Payment',
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
        <View style={styles.emptyIconBox}>
          <Text style={styles.emptyEmoji}>🛒</Text>
        </View>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptyDesc}>Add items from a cafe to get started</Text>
        <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.browseBtnText}>Browse Cafes</Text>
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
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Your Order</Text>
          <Text style={styles.subtitle}>from {cafe.name}</Text>
        </View>
        <View style={styles.itemCountBadge}>
          <Text style={styles.itemCount}>{cart.reduce((s,i) => s + i.quantity, 0)} items</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Cafe banner */}
        <View style={styles.cafeBanner}>
          <View style={styles.cafeIconBox}>
            <Text style={styles.cafeIconEmoji}>🍽️</Text>
          </View>
          <View style={styles.cafeInfoBox}>
            <Text style={styles.cafeNameText}>{cafe.name}</Text>
            {cafe.location ? <Text style={styles.cafeLocText}>📍 {cafe.location}</Text> : null}
          </View>
          <View style={styles.freePickup}>
            <Text style={styles.freePickupText}>Free pickup</Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {cart.map((item, idx) => (
            <View key={item.itemId} style={[styles.cartItem, idx === cart.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.itemIconBox}>
                <Text style={styles.itemEmoji}>🍽️</Text>
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemUnit}>₹{item.price} each</Text>
              </View>
              <View style={styles.qtyControl}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => removeItem(item.itemId)}>
                  <Text style={styles.qtyMinus}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyNum}>{item.quantity}</Text>
                <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={() => addItem(item, cafe)}>
                  <Text style={styles.qtyPlus}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.itemLineTotal}>₹{(item.price * item.quantity).toFixed(0)}</Text>
            </View>
          ))}
        </View>

        {/* Special instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions</Text>
          <View style={styles.notesWrap}>
            <Text style={styles.notesEmoji}>✏️</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any special requests? (optional)"
              placeholderTextColor={COLORS.muted}
              multiline
            />
          </View>
        </View>

        {/* Bill */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Details</Text>
          <View style={styles.billCard}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item subtotal</Text>
              <Text style={styles.billValue}>₹{totalAmount.toFixed(0)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Pickup fee</Text>
              <Text style={[styles.billValue, styles.freeTag]}>FREE</Text>
            </View>
            <View style={styles.billDivider} />
            <View style={styles.billRow}>
              <Text style={styles.billTotal}>Total</Text>
              <Text style={styles.billTotalAmt}>₹{totalAmount.toFixed(0)}</Text>
            </View>
          </View>
        </View>

        {/* Payment split */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How you'll pay</Text>
          <View style={styles.splitWrap}>
            <View style={styles.splitCard}>
              <View style={[styles.splitIconBox, { backgroundColor: COLORS.orangeLight }]}>
                <Text style={styles.splitIconEmoji}>💳</Text>
              </View>
              <Text style={styles.splitAmount}>₹{advance.toFixed(0)}</Text>
              <Text style={styles.splitLabel}>Pay now</Text>
              <View style={styles.splitPct}>
                <Text style={styles.splitPctText}>60%</Text>
              </View>
            </View>
            <View style={styles.splitPlus}>
              <Text style={styles.splitPlusText}>+</Text>
            </View>
            <View style={styles.splitCard}>
              <View style={[styles.splitIconBox, { backgroundColor: '#FFFBEB' }]}>
                <Text style={styles.splitIconEmoji}>🏷️</Text>
              </View>
              <Text style={styles.splitAmount}>₹{remaining.toFixed(0)}</Text>
              <Text style={styles.splitLabel}>At pickup</Text>
              <View style={[styles.splitPct, { backgroundColor: '#FEF9C3' }]}>
                <Text style={[styles.splitPctText, { color: '#B45309' }]}>40%</Text>
              </View>
            </View>
          </View>
          <View style={styles.splitNote}>
            <Text style={styles.splitNoteIcon}>ℹ️</Text>
            <Text style={styles.splitNoteText}>
              Pay 60% now to secure your order. Pay the remaining 40% in cash or UPI when you pick it up.
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* CTA */}
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
            <>
              <Text style={styles.placeBtnText}>Confirm & Pay ₹{advance.toFixed(0)}</Text>
              <Text style={styles.placeBtnSub}>60% advance · 40% at pickup</Text>
            </>
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
    padding: 40,
  },
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: COLORS.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { color: COLORS.text, fontSize: 22, fontWeight: '800' },
  emptyDesc: { color: COLORS.muted, fontSize: 14, textAlign: 'center' },
  browseBtn: {
    backgroundColor: COLORS.orange,
    paddingHorizontal: 32,
    paddingVertical: 15,
    borderRadius: 16,
    marginTop: 8,
  },
  browseBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  header: {
    backgroundColor: COLORS.bg,
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  headerCenter: { flex: 1 },
  title: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  subtitle: { color: COLORS.muted, fontSize: 12, marginTop: 1 },
  itemCountBadge: {
    backgroundColor: COLORS.orangeLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  itemCount: { color: COLORS.orange, fontWeight: '700', fontSize: 12 },

  scroll: { padding: 16, paddingBottom: 130 },

  cafeBanner: {
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cafeIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cafeIconEmoji: { fontSize: 24 },
  cafeInfoBox: { flex: 1 },
  cafeNameText: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  cafeLocText: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  freePickup: {
    backgroundColor: '#DCFCE7',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  freePickupText: { color: '#15803D', fontSize: 11, fontWeight: '700' },

  section: { marginBottom: 14 },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: 0.2,
  },

  cartItem: {
    backgroundColor: COLORS.bg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    borderRadius: 16,
    marginBottom: 6,
  },
  itemIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemEmoji: { fontSize: 20 },
  itemDetails: { flex: 1 },
  itemName: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  itemUnit: { color: COLORS.muted, fontSize: 12, marginTop: 1 },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnAdd: { backgroundColor: COLORS.orange },
  qtyMinus: { color: COLORS.orange, fontSize: 18, fontWeight: '900', lineHeight: 22 },
  qtyPlus: { color: '#fff', fontSize: 18, fontWeight: '900', lineHeight: 22 },
  qtyNum: { width: 24, textAlign: 'center', color: COLORS.text, fontWeight: '800', fontSize: 14 },
  itemLineTotal: { color: COLORS.orange, fontWeight: '800', fontSize: 14, minWidth: 44, textAlign: 'right' },

  notesWrap: {
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  notesEmoji: { fontSize: 18, marginTop: 2 },
  notesInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    minHeight: 50,
    textAlignVertical: 'top',
  },

  billCard: {
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  billLabel: { color: COLORS.subtext, fontSize: 14 },
  billValue: { color: COLORS.subtext, fontSize: 14, fontWeight: '600' },
  freeTag: { color: '#10B981', fontWeight: '700' },
  billDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 6 },
  billTotal: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  billTotalAmt: { color: COLORS.text, fontSize: 18, fontWeight: '900' },

  splitWrap: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  splitCard: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  splitIconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  splitIconEmoji: { fontSize: 22 },
  splitAmount: { color: COLORS.text, fontSize: 20, fontWeight: '900' },
  splitLabel: { color: COLORS.muted, fontSize: 12, fontWeight: '600' },
  splitPct: {
    backgroundColor: COLORS.orangeLight,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4,
  },
  splitPctText: { color: COLORS.orange, fontSize: 11, fontWeight: '800' },
  splitPlus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  splitPlusText: { color: COLORS.subtext, fontSize: 16, fontWeight: '700' },
  splitNote: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  splitNoteIcon: { fontSize: 14 },
  splitNoteText: { color: COLORS.muted, fontSize: 12, flex: 1, lineHeight: 18 },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  placeBtn: {
    backgroundColor: COLORS.orange,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: COLORS.orange,
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  placeBtnDisabled: { opacity: 0.65 },
  placeBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  placeBtnSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
});

export default CartScreen;
