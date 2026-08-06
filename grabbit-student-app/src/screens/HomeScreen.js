import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { cafeAPI } from '../api';
import { COLORS } from '../utils/theme';

const CafeCard = ({ cafe, onPress }) => (
  <TouchableOpacity style={[styles.cafeCard, !cafe.isOpen && styles.cafeCardClosed]} onPress={onPress} activeOpacity={0.8}>
    {/* Color banner based on name */}
    <View style={[styles.cafeBanner, { backgroundColor: cafe.isOpen ? COLORS.orange + '20' : COLORS.muted + '10' }]}>
      <Text style={styles.cafeEmoji}>🍽️</Text>
    </View>
    <View style={styles.cafeInfo}>
      <View style={styles.cafeRow}>
        <Text style={styles.cafeName}>{cafe.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: cafe.isOpen ? '#22C55E20' : '#EF444420' }]}>
          <View style={[styles.statusDot, { backgroundColor: cafe.isOpen ? '#22C55E' : '#EF4444' }]} />
          <Text style={[styles.statusText, { color: cafe.isOpen ? '#22C55E' : '#EF4444' }]}>
            {cafe.isOpen ? 'Open' : 'Closed'}
          </Text>
        </View>
      </View>
      {cafe.description ? <Text style={styles.cafeDesc} numberOfLines={1}>{cafe.description}</Text> : null}
      {cafe.location ? <Text style={styles.cafeLocation}>📍 {cafe.location}</Text> : null}
    </View>
  </TouchableOpacity>
);

const HomeScreen = ({ navigation }) => {
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, logout } = useAuth();

  const fetchCafes = useCallback(async () => {
    try {
      const res = await cafeAPI.getAll();
      setCafes(res.data.cafes);
    } catch {
      // silently fail on network issues
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchCafes(); }, [fetchCafes]);

  const onRefresh = () => { setRefreshing(true); fetchCafes(); };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hey, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.subtitle}>What are you craving?</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Orders')} style={styles.ordersBtn}>
          <Text style={styles.ordersBtnText}>My Orders</Text>
        </TouchableOpacity>
      </View>

      {/* Section title */}
      <Text style={styles.sectionTitle}>Campus Cafes</Text>

      {loading ? (
        <ActivityIndicator color={COLORS.orange} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={cafes}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <CafeCard
              cafe={item}
              onPress={() => item.isOpen && navigation.navigate('Menu', { cafe: item })}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.orange} />}
          ListEmptyComponent={<Text style={styles.empty}>No cafes found</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  greeting: { color: COLORS.text, fontSize: 22, fontWeight: '700' },
  subtitle: { color: COLORS.muted, fontSize: 14, marginTop: 2 },
  ordersBtn: { backgroundColor: COLORS.orange + '20', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  ordersBtnText: { color: COLORS.orange, fontWeight: '600', fontSize: 13 },
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700', paddingHorizontal: 20, marginBottom: 12 },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  cafeCard: { backgroundColor: COLORS.card, borderRadius: 20, marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  cafeCardClosed: { opacity: 0.6 },
  cafeBanner: { height: 80, alignItems: 'center', justifyContent: 'center' },
  cafeEmoji: { fontSize: 36 },
  cafeInfo: { padding: 16 },
  cafeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cafeName: { color: COLORS.text, fontSize: 17, fontWeight: '700', flex: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  cafeDesc: { color: COLORS.muted, fontSize: 13, marginBottom: 4 },
  cafeLocation: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  empty: { color: COLORS.muted, textAlign: 'center', marginTop: 40 },
});

export default HomeScreen;
