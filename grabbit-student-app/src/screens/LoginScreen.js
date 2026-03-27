import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/theme';

const { height } = Dimensions.get('window');

const LoginScreen = () => {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const { login, register } = useAuth();

  const handleSubmit = async () => {
    if (!email || !password || (mode === 'register' && !name)) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email.trim().toLowerCase(), password);
      } else {
        await register(name.trim(), email.trim().toLowerCase(), password);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" bounces={false}>

        {/* Top orange hero */}
        <View style={styles.hero}>
          <View style={styles.heroPattern}>
            <View style={styles.circle1} />
            <View style={styles.circle2} />
            <View style={styles.circle3} />
          </View>
          <View style={styles.logoWrap}>
            <View style={styles.logoBox}>
              <Text style={styles.logoLetter}>G</Text>
            </View>
          </View>
          <Text style={styles.brandName}>grabbit</Text>
          <Text style={styles.tagline}>Campus food, fast & fresh</Text>
          <View style={styles.pillRow}>
            <View style={styles.pill}><Text style={styles.pillText}>🚀 Fast pickup</Text></View>
            <View style={styles.pill}><Text style={styles.pillText}>🍔 All cafes</Text></View>
            <View style={styles.pill}><Text style={styles.pillText}>💳 Easy pay</Text></View>
          </View>
        </View>

        {/* White card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{mode === 'login' ? 'Welcome back 👋' : 'Join Grabbit'}</Text>
          <Text style={styles.cardSub}>
            {mode === 'login' ? 'Sign in to order your favorites' : 'Create your student account'}
          </Text>

          {/* Toggle */}
          <View style={styles.toggle}>
            {['login', 'register'].map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.toggleBtn, mode === m && styles.toggleActive]}
                onPress={() => setMode(m)}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>
                  {m === 'login' ? 'Sign In' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {mode === 'register' && (
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={[styles.input, focusedField === 'name' && styles.inputFocused]}
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                placeholderTextColor={COLORS.muted}
                autoCapitalize="words"
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          )}

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Email address</Text>
            <TextInput
              style={[styles.input, focusedField === 'email' && styles.inputFocused]}
              value={email}
              onChangeText={setEmail}
              placeholder="student@college.edu"
              placeholderTextColor={COLORS.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Password</Text>
            <TextInput
              style={[styles.input, focusedField === 'password' && styles.inputFocused]}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={COLORS.muted}
              secureTextEntry
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchLink} onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
            <Text style={styles.switchText}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <Text style={styles.switchAction}>{mode === 'login' ? 'Sign Up' : 'Sign In'}</Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.demoBox}>
            <Text style={styles.demoIcon}>💡</Text>
            <View>
              <Text style={styles.demoLabel}>Try with demo account</Text>
              <Text style={styles.demoText}>rahul@grabbit.com · password123</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          By continuing, you agree to our Terms of Service & Privacy Policy
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.orange },
  scroll: { flexGrow: 1 },
  hero: {
    backgroundColor: COLORS.orange,
    paddingTop: 64,
    paddingBottom: 44,
    paddingHorizontal: 28,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  heroPattern: { ...StyleSheet.absoluteFillObject },
  circle1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -60,
    right: -60,
  },
  circle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: 0,
    left: -40,
  },
  circle3: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: 20,
    left: 30,
  },
  logoWrap: { marginBottom: 14 },
  logoBox: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  logoLetter: { color: '#fff', fontSize: 36, fontWeight: '900' },
  brandName: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },
  tagline: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 20,
  },
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  card: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    minHeight: height * 0.6,
  },
  cardTitle: { color: COLORS.text, fontSize: 24, fontWeight: '800', marginBottom: 4 },
  cardSub: { color: COLORS.muted, fontSize: 14, marginBottom: 24 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  toggleActive: { backgroundColor: COLORS.orange },
  toggleText: { color: COLORS.muted, fontWeight: '600', fontSize: 14 },
  toggleTextActive: { color: '#fff', fontWeight: '700' },
  fieldWrap: { marginBottom: 16 },
  fieldLabel: {
    color: COLORS.subtext,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: COLORS.orange,
    backgroundColor: COLORS.orangeLight,
  },
  btn: {
    backgroundColor: COLORS.orange,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,
    shadowColor: COLORS.orange,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  btnDisabled: { opacity: 0.65 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  switchLink: { alignItems: 'center', marginBottom: 20 },
  switchText: { color: COLORS.muted, fontSize: 13 },
  switchAction: { color: COLORS.orange, fontWeight: '700' },
  demoBox: {
    backgroundColor: COLORS.orangeLight,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  demoIcon: { fontSize: 22 },
  demoLabel: { color: COLORS.orange, fontSize: 12, fontWeight: '700', marginBottom: 2 },
  demoText: { color: COLORS.subtext, fontSize: 12 },
  footer: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    paddingVertical: 20,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 24,
  },
});

export default LoginScreen;
