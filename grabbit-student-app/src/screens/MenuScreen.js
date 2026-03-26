import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { cafeAPI } from '../api';
import { useCart } from '../context/CartContext';
import { COLORS } from '../utils/theme';

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages', 'Desserts', 'Other'];

const MenuItemCard = ({ item, cafe }) => {
  const { cart, addItem, removeItem } = useCart();
  const cartItem = cart.find(i => i.itemId === item._id);
  const qty = cartItem?.quantity || 0;

  return (
    <View style={[styles.itemCard, !item.isAvailable && styles.itemUnavailable]}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        {item.description ? <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text> : null}
        <Text style={styles.itemMeta}>{item.category} · {item.preparationTime} min</Text>
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.itemPrice}>₹{item.price}</Text>
        {item.isAvailable ? (
          qty === 0 ? (
            <TouchableOpacity style={styles.addBtn} onPress={() => addItem(item, cafe)}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => removeItem(item._id)}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyText}>{qty}</Text>
              <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={() => addItem(item, cafe)}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          <Text style={styles.unavailText}>Unavailable</Text>
        )}
      </View>
    </View>
  );
};

const MenuScreen = ({ route, navigation }) => {
  const { cafe } = route.params;
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const { cart, totalAmount, totalItems, clearCart, cafeId } = useCart();

  useEffect(() => {
    cafeAPI.getMenu(cafe._id).then(res => {
      setMenu(res.data.menu);
      setLoading(false);
    });
  }, [cafe._id]);

  // Warn if switching cafes
  useEffect(() => {
    if (cafeId && cafeId !== cafe._id && cart.length > 0) {
      // Cart will auto-clear on addItem from different cafe
    }
  }, [cafeId, cafe._id, cart.length]);

  const categories = ['All', ...CATEGORIES.slice(1).filter(c => menu.some(m => m.category === c))];
  const filtered = activeCategory === 'All' ? menu : menu.filter(m => m.category === activeCategory);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.cafeName}>{cafe.name}</Text>
          <Text style={styles.cafeLocation}>{cafe.location}</Text>
        </View>
      </View>

      {/* Category tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabsContent}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat} onPress={() => setActiveCategory(cat)}
            style={[styles.tab, activeCategory === cat && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeCategory === cat && styles.tabTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={COLORS.orange} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={({ item }) => <MenuItemCard item={item} cafe={cafe} />}
          contentContainerStyle={[styles.list, totalItems > 0 && { paddingBottom: 100 }]}
          ListEmptyComponent={<Text style={styles.empty}>No items in this category</Text>}
        />
      )}

      {/* Cart bar */}
      {totalItems > 0 && cafeId === cafe._id && (
        <View style={styles.cartBar}>
          <View>
            <Text style={styles.cartItems}>{totalItems} item{totalItems > 1 ? 's' : ''}</Text>
            <Text style={styles.cartTotal}>₹{totalAmount.toFixed(0)}</Text>
          </View>
          <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart', { cafe })}>
            <Text style={styles.cartBtnText}>View Cart →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
  backText: { color: COLORS.text, fontSize: 20, lineHeight: 24 },
  cafeName: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  cafeLocation: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  tabs: { maxHeight: 48 },
  tabsContent: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  tabActive: { backgroundColor: COLORS.orange },
  tabText: { color: COLORS.muted, fontSize: 13, fontWeight: '500' },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  list: { padding: 20, paddingTop: 12 },
  itemCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: 'row', borderWidth: 1, borderColor: COLORS.border },
  itemUnavailable: { opacity: 0.5 },
  itemInfo: { flex: 1, paddingRight: 12 },
  itemName: { color: COLORS.text, fontSize: 15, fontWeight: '600', marginBottom: 3 },
  itemDesc: { color: COLORS.muted, fontSize: 12, marginBottom: 4 },
  itemMeta: { color: COLORS.muted, fontSize: 11 },
  itemRight: { alignItems: 'flex-end', justifyContent: 'space-between', minWidth: 80 },
  itemPrice: { color: COLORS.orange, fontSize: 16, fontWeight: '700' },
  addBtn: { backgroundColor: COLORS.orange + '20', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.orange + '40' },
  addBtnText: { color: COLORS.orange, fontWeight: '700', fontSize: 13 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  qtyBtnAdd: { backgroundColor: COLORS.orange },
  qtyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', lineHeight: 20 },
  qtyText: { color: COLORS.text, fontWeight: '700', fontSize: 15, minWidth: 18, textAlign: 'center' },
  unavailText: { color: COLORS.muted, fontSize: 11 },
  empty: { color: COLORS.muted, textAlign: 'center', marginTop: 40 },
  cartBar: { position: 'absolute', bottom: 24, left: 20, right: 20, backgroundColor: COLORS.orange, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: COLORS.orange, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  cartItems: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  cartTotal: { color: '#fff', fontSize: 17, fontWeight: '800' },
  cartBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  cartBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

export default MenuScreen;
