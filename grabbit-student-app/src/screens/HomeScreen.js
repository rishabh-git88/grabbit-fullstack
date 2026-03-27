import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, ScrollView, StatusBar, TextInput,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { cafeAPI } from '../api';
import { COLORS } from '../utils/theme';

const CATEGORIES = [
  { id: 'all', label: 'All', emoji: '🍽️' },
  { id: 'Breakfast', label: 'Breakfast', emoji: '🥞' },
  { id: 'Lunch', label: 'Lunch', emoji: '🍱' },
  { id: 'Dinner', label: 'Dinner', emoji: '🍛' },
  { id: 'Snacks', label: 'Snacks', emoji: '🍟' },
  { id: 'Beverages', label: 'Drinks', emoji: '☕' },
  { id: 'Desserts', label: 'Desserts', emoji: '🍰' },
];

const BANNER_COLORS = [
  ['#FF6300', '#FF8C42'],
  ['#7C3AED', '#A78BFA'],
  ['#059669', '#34D399'],
  ['#DC2626', '#F87171'],
  ['#2563EB', '#60A5FA'],
  ['#D97706', '#FCD34D'],
];

const CafeCard = ({ cafe, index, onPress }) => {
  const colors = BANNER_COLORS[index % BANNER_COLORS.length];
  const [c1, c2] = colors;

  return (
    <TouchableOpacity
      style={[styles.cafeCard, !cafe.isOpen && styles.cafeCardClosed]}
      onPress={onPress}
      activeOpacity={0.92}
    >
      {/* Colored banner */}
      <View style={[styles.banner, { backgroundColor: c1 }]}>
        <View style={[styles.bannerCircle, { backgroundColor: c2 }]} />
        <View style={[styles.bannerCircle2, { backgroundColor: 'rgba(255,255,255,0.12)' }]} />
        <Text style={styles.bannerEmoji}>🍽️</Text>
        {!cafe.isOpen && (
          <View style={styles.closedOverlay}>
            <Text style={styles.closedText}>CLOSED</Text>
          </View>
        )}
      </View>

      <View style={styles.cafeBody}>
        <View style={styles.cafeRow}>
          <Text style={styles.cafeName} numberOfLines={1}>{cafe.name}</Text>
          <View style={[styles.statusPill, { backgroundColor: cafe.isOpen ? COLORS.greenLight : '#FEE2E2' }]}>
            <View style={[styles.statusDot, { backgroundColor: cafe.isOpen ? COLORS.green : COLORS.red }]} />
            <Text style={[styles.statusLabel, { color: cafe.isOpen ? '#15803D' : '#DC2626' }]}>
              {cafe.isOpen ? 'Open' : 'Closed'}
            </Text>
          </View>
        </View>

        {cafe.description
          ? <Text style={styles.cafeDesc} numberOfLines={2}>{cafe.description}</Text>
          : null}

        <View style={styles.cafeMeta}>
          {cafe.location
            ? <View style={styles.metaChip}>
                <Text style={styles.metaIcon}>📍</Text>
                <Text style={styles.metaText}>{cafe.location}</Text>
              </View>
            : null}
          <View style={styles.metaChip}>
            <Text style={styles.metaIcon}>⏱️</Text>
            <Text style={styles.metaText}>10–20 min</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const HomeScreen = ({ navigation }) => {
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
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

  const filtered = cafes.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <View style={styles.locationRow}>
              <Text style={styles.locationPin}>📍</Text>
              <Text style={styles.locationLabel}>Delivering to</Text>
            </View>
            <Text style={styles.locationName} numberOfLines={1}>Campus</Text>
          </View>
          <TouchableOpacity style={styles.avatar} onPress={logout}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search cafes or food..."
            placeholderTextColor={COLORS.muted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Category row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catContent}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catChip, activeCategory === cat.id && styles.catChipActive]}
            onPress={() => setActiveCategory(cat.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.catEmoji}>{cat.emoji}</Text>
            <Text style={[styles.catLabel, activeCategory === cat.id && styles.catLabelActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Section heading */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>
          {search ? `Results for "${search}"` : 'Campus Cafes'}
        </Text>
        <Text style={styles.sectionCount}>{filtered.length} places</Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={COLORS.orange} size="large" />
          <Text style={styles.loadingText}>Finding cafes near you…</Text>
        </View>
      ) : (
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
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchCafes(); }}
              tintColor={COLORS.orange}
              colors={[COLORS.orange]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyTitle}>No cafes found</Text>
              <Text style={styles.emptyDesc}>Try a different search or check back later</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    backgroundColor: COLORS.bg,
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  locationPin: { fontSize: 13 },
  locationLabel: { color: COLORS.muted, fontSize: 12, fontWeight: '500' },
  locationName: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 15, padding: 0 },
  catScroll: { maxHeight: 70, backgroundColor: COLORS.bg },
  catContent: { paddingHorizontal: 16, gap: 8, paddingVertical: 10 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  catChipActive: {
    backgroundColor: COLORS.orange,
    borderColor: COLORS.orange,
  },
  catEmoji: { fontSize: 15 },
  catLabel: { color: COLORS.subtext, fontSize: 13, fontWeight: '600' },
  catLabelActive: { color: '#fff' },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  sectionCount: { color: COLORS.muted, fontSize: 13 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 80 },
  loadingText: { color: COLORS.muted, fontSize: 14 },
  cafeCard: {
    backgroundColor: COLORS.bg,
    borderRadius: 20,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cafeCardClosed: { opacity: 0.7 },
  banner: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  bannerCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    right: -20,
    top: -30,
  },
  bannerCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    left: -10,
    bottom: -20,
  },
  bannerEmoji: { fontSize: 44, zIndex: 1 },
  closedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedText: { color: '#fff', fontWeight: '900', fontSize: 18, letterSpacing: 3 },
  cafeBody: { padding: 16 },
  cafeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cafeName: { color: COLORS.text, fontSize: 17, fontWeight: '800', flex: 1, marginRight: 10 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 11, fontWeight: '700' },
  cafeDesc: { color: COLORS.muted, fontSize: 13, lineHeight: 18, marginBottom: 10 },
  cafeMeta: { flexDirection: 'row', gap: 10 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  metaIcon: { fontSize: 12 },
  metaText: { color: COLORS.subtext, fontSize: 12, fontWeight: '500' },
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  emptyDesc: { color: COLORS.muted, fontSize: 14, textAlign: 'center' },
});

export default HomeScreen;
