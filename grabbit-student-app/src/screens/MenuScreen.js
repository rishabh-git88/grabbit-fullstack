import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, StatusBar,
} from 'react-native';
import { cafeAPI } from '../api';
import { useCart } from '../context/CartContext';
import { COLORS } from '../utils/theme';

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages', 'Desserts', 'Other'];

const ITEM_COLORS = ['#FF6300', '#7C3AED', '#059669', '#2563EB', '#D97706', '#DC2626'];

const MenuItemCard = ({ item, cafe, index }) => {
  const { cart, addItem, removeItem } = useCart();
  const cartItem = cart.find(i => i.itemId === item._id);
  const qty = cartItem?.quantity || 0;
  const color = ITEM_COLORS[index % ITEM_COLORS.length];

  return (
    <View style={[styles.itemCard, !item.isAvailable && styles.itemUnavailable]}>
      {/* Left: info */}
      <View style={styles.itemInfo}>
        {item.isVeg !== undefined && (
          <View style={[styles.vegDot, { borderColor: item.isVeg ? COLORS.green : COLORS.red }]}>
            <View style={[styles.vegFill, { backgroundColor: item.isVeg ? COLORS.green : COLORS.red }]} />
          </View>
        )}
        <Text style={styles.itemName}>{item.name}</Text>
        {item.description
          ? <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
          : null}
        <View style={styles.itemMeta}>
          <Text style={styles.metaTag}>{item.category}</Text>
          {item.preparationTime
            ? <Text style={styles.metaTag}>⏱ {item.preparationTime} min</Text>
            : null}
        </View>
        <Text style={styles.itemPrice}>₹{item.price}</Text>
      </View>

      {/* Right: image placeholder + add button */}
      <View style={styles.itemRight}>
        <View style={[styles.imgBox, { backgroundColor: color + '18' }]}>
          <Text style={styles.imgEmoji}>🍽️</Text>
        </View>

        {item.isAvailable ? (
          qty === 0 ? (
            <TouchableOpacity style={styles.addBtn} onPress={() => addItem(item, cafe)} activeOpacity={0.85}>
              <Text style={styles.addBtnText}>ADD</Text>
              <Text style={styles.addPlus}>+</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.qtyControl}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => removeItem(item._id)}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyNum}>{qty}</Text>
              <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={() => addItem(item, cafe)}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          <View style={styles.unavailBadge}>
            <Text style={styles.unavailText}>Sold Out</Text>
          </View>
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
  const { cart, totalAmount, totalItems, cafeId } = useCart();

  useEffect(() => {
    cafeAPI.getMenu(cafe._id).then(res => {
      setMenu(res.data.menu);
      setLoading(false);
    });
  }, [cafe._id]);

  const availableCategories = ['All', ...CATEGORIES.slice(1).filter(c => menu.some(m => m.category === c))];
  const filtered = activeCategory === 'All' ? menu : menu.filter(m => m.category === activeCategory);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.orange} />

      {/* Orange header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.cafeName}>{cafe.name}</Text>
          {cafe.location ? <Text style={styles.cafeLocation}>📍 {cafe.location}</Text> : null}
        </View>
        <View style={[styles.openPill, { backgroundColor: cafe.isOpen ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)' }]}>
          <Text style={[styles.openText, { color: cafe.isOpen ? '#A7F3D0' : '#FECACA' }]}>
            {cafe.isOpen ? 'Open' : 'Closed'}
          </Text>
        </View>
      </View>

      {/* Category tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {availableCategories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.tab, activeCategory === cat && styles.tabActive]}
              onPress={() => setActiveCategory(cat)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeCategory === cat && styles.tabTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={COLORS.orange} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={({ item, index }) => (
            <MenuItemCard item={item} cafe={cafe} index={index} />
          )}
          contentContainerStyle={[styles.list, totalItems > 0 && { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>🍽️</Text>
              <Text style={styles.emptyText}>Nothing here yet</Text>
            </View>
          }
        />
      )}

      {/* Cart bar */}
      {totalItems > 0 && cafeId === cafe._id && (
        <TouchableOpacity
          style={styles.cartBar}
          onPress={() => navigation.navigate('Cart', { cafe })}
          activeOpacity={0.92}
        >
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{totalItems}</Text>
          </View>
          <Text style={styles.cartBarText}>View Cart</Text>
          <Text style={styles.cartBarAmount}>₹{totalAmount.toFixed(0)}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
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
  headerInfo: { flex: 1 },
  cafeName: { color: '#fff', fontSize: 19, fontWeight: '800' },
  cafeLocation: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  openPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  openText: { fontSize: 11, fontWeight: '700' },
  tabsWrapper: {
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabsContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  tabActive: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  tabText: { color: COLORS.subtext, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 30 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  itemCard: {
    backgroundColor: COLORS.bg,
    borderRadius: 18,
    marginBottom: 12,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  itemUnavailable: { opacity: 0.55 },
  itemInfo: { flex: 1 },
  vegDot: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  vegFill: { width: 6, height: 6, borderRadius: 3 },
  itemName: { color: COLORS.text, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  itemDesc: { color: COLORS.muted, fontSize: 12, lineHeight: 17, marginBottom: 8 },
  itemMeta: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  metaTag: {
    backgroundColor: COLORS.surface,
    color: COLORS.subtext,
    fontSize: 11,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  itemPrice: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  itemRight: { alignItems: 'center', justifyContent: 'space-between', width: 80 },
  imgBox: {
    width: 76,
    height: 76,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  imgEmoji: { fontSize: 34 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.bg,
    borderWidth: 1.5,
    borderColor: COLORS.orange,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addBtnText: { color: COLORS.orange, fontWeight: '800', fontSize: 12 },
  addPlus: { color: COLORS.orange, fontWeight: '800', fontSize: 14 },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
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
  qtyNum: { color: COLORS.text, fontWeight: '800', fontSize: 14, minWidth: 16, textAlign: 'center' },
  unavailBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  unavailText: { color: '#DC2626', fontSize: 10, fontWeight: '700' },
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: COLORS.muted, fontSize: 15 },
  cartBar: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: COLORS.orange,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: COLORS.orange,
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  cartBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  cartBarText: { color: '#fff', fontWeight: '800', fontSize: 16, flex: 1, textAlign: 'center' },
  cartBarAmount: { color: 'rgba(255,255,255,0.9)', fontWeight: '700', fontSize: 15 },
});

export default MenuScreen;
