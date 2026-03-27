import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, ScrollView, StatusBar, TextInput,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { cafeAPI } from '../api';
import { COLORS } from '../utils/theme';

const CATEGORIES = [
  { id: 'all',       label: 'All',       emoji: '🍽️', color: '#FF6300' },
  { id: 'Breakfast', label: 'Breakfast', emoji: '🥞', color: '#F59E0B' },
  { id: 'Lunch',     label: 'Lunch',     emoji: '🍱', color: '#10B981' },
  { id: 'Dinner',    label: 'Dinner',    emoji: '🍛', color: '#6366F1' },
  { id: 'Snacks',    label: 'Snacks',    emoji: '🍟', color: '#EF4444' },
  { id: 'Beverages', label: 'Drinks',    emoji: '☕', color: '#8B5CF6' },
  { id: 'Desserts',  label: 'Desserts',  emoji: '🍰', color: '#EC4899' },
];

const CAFE_THEMES = [
  { from: '#FF6300', via: '#FF8C42', emoji: '🍔' },
  { from: '#6366F1', via: '#818CF8', emoji: '🍜' },
  { from: '#10B981', via: '#34D399', emoji: '🥗' },
  { from: '#F59E0B', via: '#FCD34D', emoji: '🌮' },
  { from: '#EC4899', via: '#F472B6', emoji: '🍰' },
  { from: '#8B5CF6', via: '#A78BFA', emoji: '🍱' },
];

const PROMOS = [
  { bg: '#F4501E', title: 'Skip the line!', desc: 'Order ahead & pick up fresh', icon: '⚡' },
  { bg: '#6366F1', title: 'Try something new', desc: 'Explore all campus cafes', icon: '🌟' },
];

const StarRating = ({ rating = 4.2 }) => (
  <View style={styles.stars}>
    <Text style={styles.starText}>★</Text>
    <Text style={styles.ratingNum}>{rating}</Text>
  </View>
);

const CafeCard = ({ cafe, index, onPress }) => {
  const theme = CAFE_THEMES[index % CAFE_THEMES.length];

  return (
    <TouchableOpacity
      style={[styles.cafeCard, !cafe.isOpen && styles.cafeCardClosed]}
      onPress={onPress}
      activeOpacity={0.93}
    >
      {/* Image hero area */}
      <View style={[styles.cafeBanner, { backgroundColor: theme.from }]}>
        <View style={[styles.bannerGlow, { backgroundColor: theme.via }]} />
        <Text style={styles.cafeBannerEmoji}>{theme.emoji}</Text>

        {/* Badges */}
        <View style={styles.bannerBadges}>
          {index === 0 && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>🔥 Popular</Text>
            </View>
          )}
          {cafe.isOpen ? null : (
            <View style={styles.closedBadge}>
              <Text style={styles.closedBadgeText}>Closed</Text>
            </View>
          )}
        </View>

        <View style={[styles.openDot, { backgroundColor: cafe.isOpen ? '#22C55E' : '#EF4444' }]} />
      </View>

      {/* Info */}
      <View style={styles.cafeInfo}>
        <View style={styles.cafeNameRow}>
          <Text style={styles.cafeName} numberOfLines={1}>{cafe.name}</Text>
          <StarRating rating={(4.0 + (index % 5) * 0.1).toFixed(1)} />
        </View>

        {cafe.description ? (
          <Text style={styles.cafeDesc} numberOfLines={1}>{cafe.description}</Text>
        ) : null}

        <View style={styles.cafeMeta}>
          {cafe.location ? (
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📍</Text>
              <Text style={styles.metaText}>{cafe.location}</Text>
            </View>
          ) : null}
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>⏱</Text>
            <Text style={styles.metaText}>10–15 min</Text>
          </View>
          <View style={styles.metaDivider} />
          <Text style={styles.freeText}>FREE pickup</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const PromoCard = ({ promo }) => (
  <View style={[styles.promoCard, { backgroundColor: promo.bg }]}>
    <View>
      <Text style={styles.promoTitle}>{promo.title}</Text>
      <Text style={styles.promoDesc}>{promo.desc}</Text>
      <View style={styles.promoBtn}>
        <Text style={styles.promoBtnText}>Order Now →</Text>
      </View>
    </View>
    <Text style={styles.promoIcon}>{promo.icon}</Text>
  </View>
);

const HomeScreen = ({ navigation }) => {
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [promoIdx, setPromoIdx] = useState(0);
  const { user, logout } = useAuth();

  const fetchCafes = useCallback(async () => {
    try {
      const res = await cafeAPI.getAll();
      setCafes(res.data.cafes);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchCafes(); }, [fetchCafes]);

  useEffect(() => {
    const t = setInterval(() => setPromoIdx(i => (i + 1) % PROMOS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const filtered = cafes.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Sticky header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.locationWrap}>
            <Text style={styles.deliverTo}>Delivering to</Text>
            <View style={styles.locationRow}>
              <Text style={styles.locationPin}>📍</Text>
              <Text style={styles.locationName}>My Campus</Text>
              <Text style={styles.chevron}>▾</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.avatarBtn} onPress={logout} activeOpacity={0.85}>
            <Text style={styles.avatarText}>{initials}</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for cafes or dishes..."
              placeholderTextColor={COLORS.muted}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text style={styles.clearBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item._id}
        renderItem={({ item, index }) => (
          <CafeCard
            cafe={item}
            index={index}
            onPress={() => item.isOpen && navigation.navigate('Menu', { cafe: item })}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchCafes(); }}
            tintColor={COLORS.orange}
            colors={[COLORS.orange]}
          />
        }
        ListHeaderComponent={
          <>
            {/* Promo banner */}
            {!search && (
              <View style={styles.promoWrap}>
                <PromoCard promo={PROMOS[promoIdx]} />
                <View style={styles.promoIndicators}>
                  {PROMOS.map((_, i) => (
                    <View key={i} style={[styles.indicator, i === promoIdx && styles.indicatorActive]} />
                  ))}
                </View>
              </View>
            )}

            {/* Category chips */}
            <View style={styles.catSection}>
              <Text style={styles.catSectionLabel}>What are you craving?</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.catContent}
              >
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.catChip, activeCategory === cat.id && { borderColor: cat.color }]}
                    onPress={() => setActiveCategory(cat.id)}
                    activeOpacity={0.85}
                  >
                    <View style={[
                      styles.catIconBox,
                      { backgroundColor: activeCategory === cat.id ? cat.color + '18' : COLORS.surface }
                    ]}>
                      <Text style={styles.catEmoji}>{cat.emoji}</Text>
                    </View>
                    <Text style={[
                      styles.catLabel,
                      activeCategory === cat.id && { color: cat.color, fontWeight: '700' }
                    ]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Section heading */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {search ? `Results for "${search}"` : 'All Cafes Near You'}
              </Text>
              <Text style={styles.sectionCount}>{filtered.length} places</Text>
            </View>

            {loading && (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={COLORS.orange} size="large" />
                <Text style={styles.loadingText}>Finding cafes near you…</Text>
              </View>
            )}
          </>
        }
        ListEmptyComponent={!loading ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>No cafes found</Text>
            <Text style={styles.emptyDesc}>Try a different search or check back later</Text>
          </View>
        ) : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    backgroundColor: COLORS.bg,
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  locationWrap: {},
  deliverTo: { color: COLORS.muted, fontSize: 11, fontWeight: '500', marginBottom: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationPin: { fontSize: 14 },
  locationName: { color: COLORS.text, fontSize: 17, fontWeight: '800' },
  chevron: { color: COLORS.orange, fontSize: 14, marginLeft: 2 },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  searchWrap: {},
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 14, padding: 0 },
  clearBtn: { color: COLORS.muted, fontSize: 14, padding: 4 },

  listContent: { paddingBottom: 100 },

  // Promo
  promoWrap: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4 },
  promoCard: {
    borderRadius: 20,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  promoTitle: { color: '#fff', fontSize: 19, fontWeight: '900', marginBottom: 4 },
  promoDesc: { color: 'rgba(255,255,255,0.82)', fontSize: 13, marginBottom: 14 },
  promoBtn: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  promoBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  promoIcon: { fontSize: 52 },
  promoIndicators: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  indicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.border },
  indicatorActive: { width: 18, backgroundColor: COLORS.orange },

  // Categories
  catSection: { paddingTop: 22, paddingBottom: 6 },
  catSectionLabel: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  catContent: { paddingHorizontal: 16, gap: 10 },
  catChip: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 4,
    width: 70,
  },
  catIconBox: {
    width: 54,
    height: 54,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catEmoji: { fontSize: 26 },
  catLabel: { color: COLORS.subtext, fontSize: 11, fontWeight: '600', textAlign: 'center' },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  sectionCount: { color: COLORS.muted, fontSize: 13 },

  loadingBox: { alignItems: 'center', paddingTop: 60, gap: 12 },
  loadingText: { color: COLORS.muted, fontSize: 14 },

  // Cafe card (Grubhub style)
  cafeCard: {
    backgroundColor: COLORS.bg,
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cafeCardClosed: { opacity: 0.65 },
  cafeBanner: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  bannerGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -40,
    top: -40,
    opacity: 0.5,
  },
  cafeBannerEmoji: { fontSize: 58, zIndex: 1 },
  bannerBadges: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 6,
  },
  popularBadge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  popularText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  closedBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  closedBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  openDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  cafeInfo: { padding: 16 },
  cafeNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cafeName: { color: COLORS.text, fontSize: 17, fontWeight: '800', flex: 1, marginRight: 10 },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  starText: { color: '#F59E0B', fontSize: 14 },
  ratingNum: { color: COLORS.subtext, fontSize: 13, fontWeight: '700' },
  cafeDesc: { color: COLORS.muted, fontSize: 13, marginBottom: 12 },
  cafeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaIcon: { fontSize: 12 },
  metaText: { color: COLORS.subtext, fontSize: 12, fontWeight: '500' },
  metaDivider: { width: 1, height: 12, backgroundColor: COLORS.border, marginHorizontal: 2 },
  freeText: { color: '#10B981', fontSize: 12, fontWeight: '700' },

  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 8, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 52, marginBottom: 4 },
  emptyTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  emptyDesc: { color: COLORS.muted, fontSize: 14, textAlign: 'center' },
});

export default HomeScreen;
