import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, StatusBar,
} from 'react-native';
import { cafeAPI } from '../api';
import { useCart } from '../context/CartContext';
import { COLORS } from '../utils/theme';

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages', 'Desserts', 'Other'];

const ITEM_THEMES = [
  { bg: '#FFF4ED', accent: '#F4501E', emoji: '🍔' },
  { bg: '#F0F4FF', accent: '#6366F1', emoji: '🍜' },
  { bg: '#F0FFF7', accent: '#10B981', emoji: '🥗' },
  { bg: '#FFFBEB', accent: '#F59E0B', emoji: '🌮' },
  { bg: '#FFF0F9', accent: '#EC4899', emoji: '🍰' },
  { bg: '#F5F0FF', accent: '#8B5CF6', emoji: '🍱' },
];

const MenuItemCard = ({ item, cafe, index }) => {
  const { cart, addItem, removeItem } = useCart();
  const cartItem = cart.find(i => i.itemId === item._id);
  const qty = cartItem?.quantity || 0;
  const theme = ITEM_THEMES[index % ITEM_THEMES.length];

  return (
    <View style={[styles.itemCard, !item.isAvailable && styles.itemUnavailable]}>
      <View style={styles.itemLeft}>
        {item.isVeg !== undefined && (
          <View style={[styles.vegIndicator, { borderColor: item.isVeg ? '#10B981' : '#EF4444' }]}>
            <View style={[styles.vegDot, { backgroundColor: item.isVeg ? '#10B981' : '#EF4444' }]} />
          </View>
        )}
        <Text style={styles.itemName}>{item.name}</Text>
        {item.description ? (
          <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}

        <View style={styles.itemTags}>
          <View style={[styles.categoryTag, { backgroundColor: theme.bg }]}>
            <Text style={[styles.categoryTagText, { color: theme.accent }]}>{item.category}</Text>
          </View>
          {item.preparationTime ? (
            <View style={styles.timeTag}>
              <Text style={styles.timeTagText}>⏱ {item.preparationTime} min</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.itemPrice}>₹{item.price}</Text>
      </View>

      <View style={styles.itemRight}>
        {/* Food image placeholder */}
        <View style={[styles.foodImgBox, { backgroundColor: theme.bg }]}>
          <Text style={styles.foodEmoji}>{theme.emoji}</Text>
          {!item.isAvailable && (
            <View style={styles.soldOutOverlay}>
              <Text style={styles.soldOutText}>Sold Out</Text>
            </View>
          )}
        </View>

        {item.isAvailable ? (
          qty === 0 ? (
            <TouchableOpacity style={styles.addBtn} onPress={() => addItem(item, cafe)} activeOpacity={0.85}>
              <Text style={styles.addBtnText}>ADD  +</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.qtyWrap}>
              <TouchableOpacity style={styles.qtyMinus} onPress={() => removeItem(item._id)}>
                <Text style={styles.qtyMinusText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyNum}>{qty}</Text>
              <TouchableOpacity style={styles.qtyPlus} onPress={() => addItem(item, cafe)}>
                <Text style={styles.qtyPlusText}>+</Text>
              </TouchableOpacity>
            </View>
          )
        ) : null}
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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{cafe.name}</Text>
          {cafe.location ? (
            <View style={styles.locationRow}>
              <Text style={styles.locationDot}>📍</Text>
              <Text style={styles.locationText}>{cafe.location}</Text>
            </View>
          ) : null}
        </View>
        <View style={[
          styles.statusPill,
          { backgroundColor: cafe.isOpen ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)' }
        ]}>
          <View style={[styles.statusDot2, { backgroundColor: cafe.isOpen ? '#22C55E' : '#EF4444' }]} />
          <Text style={[styles.statusPillText, { color: cafe.isOpen ? '#A7F3D0' : '#FECACA' }]}>
            {cafe.isOpen ? 'Open' : 'Closed'}
          </Text>
        </View>
      </View>

      {/* Category tabs */}
      <View style={styles.tabsRow}>
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
          <Text style={styles.loadingText}>Loading menu…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={({ item, index }) => (
            <MenuItemCard item={item} cafe={cafe} index={index} />
          )}
          contentContainerStyle={[styles.list, totalItems > 0 && { paddingBottom: 110 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>🍽️</Text>
              <Text style={styles.emptyText}>Nothing in this category yet</Text>
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
          <Text style={styles.cartBarLabel}>View Cart</Text>
          <Text style={styles.cartBarTotal}>₹{totalAmount.toFixed(0)}</Text>
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
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 18,
    gap: 10,
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
  headerCenter: { flex: 1 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locationDot: { fontSize: 11 },
  locationText: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot2: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 11, fontWeight: '700' },

  tabsRow: {
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  tabsContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  tabActive: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  tabText: { color: COLORS.subtext, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#fff', fontWeight: '700' },

  list: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 30 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: COLORS.muted, fontSize: 14 },

  itemCard: {
    backgroundColor: COLORS.bg,
    borderRadius: 18,
    marginBottom: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  itemUnavailable: { opacity: 0.5 },
  itemLeft: { flex: 1 },
  vegIndicator: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  vegDot: { width: 6, height: 6, borderRadius: 3 },
  itemName: { color: COLORS.text, fontSize: 15, fontWeight: '700', marginBottom: 4, lineHeight: 20 },
  itemDesc: { color: COLORS.muted, fontSize: 12, lineHeight: 17, marginBottom: 10 },
  itemTags: { flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  categoryTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  categoryTagText: { fontSize: 11, fontWeight: '700' },
  timeTag: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  timeTagText: { color: COLORS.subtext, fontSize: 11 },
  itemPrice: { color: COLORS.text, fontSize: 16, fontWeight: '800' },

  itemRight: { alignItems: 'center', gap: 10, width: 82 },
  foodImgBox: {
    width: 80,
    height: 80,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  foodEmoji: { fontSize: 36 },
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldOutText: { color: '#EF4444', fontWeight: '800', fontSize: 10 },

  addBtn: {
    backgroundColor: COLORS.bg,
    borderWidth: 1.5,
    borderColor: COLORS.orange,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    width: 76,
    alignItems: 'center',
  },
  addBtnText: { color: COLORS.orange, fontWeight: '800', fontSize: 12 },
  qtyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    width: 76,
  },
  qtyMinus: {
    width: 26,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyMinusText: { color: COLORS.orange, fontSize: 18, fontWeight: '900', lineHeight: 22 },
  qtyNum: { flex: 1, textAlign: 'center', color: COLORS.text, fontWeight: '800', fontSize: 14 },
  qtyPlus: {
    width: 26,
    height: 28,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyPlusText: { color: '#fff', fontSize: 18, fontWeight: '900', lineHeight: 22 },

  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyEmoji: { fontSize: 52 },
  emptyText: { color: COLORS.muted, fontSize: 15 },

  cartBar: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: COLORS.orange,
    borderRadius: 18,
    paddingVertical: 17,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.orange,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  cartBadge: {
    backgroundColor: 'rgba(255,255,255,0.28)',
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  cartBarLabel: { color: '#fff', fontWeight: '800', fontSize: 16, flex: 1, textAlign: 'center' },
  cartBarTotal: { color: 'rgba(255,255,255,0.9)', fontWeight: '700', fontSize: 15 },
});

export default MenuScreen;
