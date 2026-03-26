import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/theme';

const LoginScreen = ({ navigation }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={styles.logoBox}>
            <Text style={styles.logoLetter}>G</Text>
          </View>
          <Text style={styles.logoText}>grabbit</Text>
        </View>
        <Text style={styles.tagline}>Campus food, made easy 🐇</Text>

        {/* Card */}
        <View style={styles.card}>
          {/* Toggle */}
          <View style={styles.toggle}>
            {['login', 'register'].map(m => (
              <TouchableOpacity key={m} style={[styles.toggleBtn, mode === m && styles.toggleActive]} onPress={() => setMode(m)}>
                <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>
                  {m === 'login' ? 'Sign In' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {mode === 'register' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>FULL NAME</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName}
                placeholder="Your name" placeholderTextColor={COLORS.muted} autoCapitalize="words" />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail}
              placeholder="student@college.edu" placeholderTextColor={COLORS.muted}
              keyboardType="email-address" autoCapitalize="none" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword}
              placeholder="••••••••" placeholderTextColor={COLORS.muted} secureTextEntry />
          </View>

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <Text style={styles.btnText}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.demo}>Demo: rahul@grabbit.com / password123</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  logoBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.orange, alignItems: 'center', justifyContent: 'center' },
  logoLetter: { color: '#fff', fontSize: 24, fontWeight: '800' },
  logoText: { color: '#fff', fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  tagline: { color: COLORS.muted, fontSize: 14, marginBottom: 32 },
  card: { backgroundColor: COLORS.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  toggle: { flexDirection: 'row', backgroundColor: COLORS.accent, borderRadius: 12, padding: 4, marginBottom: 24 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  toggleActive: { backgroundColor: COLORS.orange },
  toggleText: { color: COLORS.muted, fontWeight: '600', fontSize: 14 },
  toggleTextActive: { color: '#fff' },
  inputGroup: { marginBottom: 16 },
  label: { color: COLORS.muted, fontSize: 10, fontWeight: '600', letterSpacing: 1.2, marginBottom: 6 },
  input: { backgroundColor: COLORS.accent, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, color: COLORS.text, fontSize: 15, borderWidth: 1, borderColor: COLORS.border },
  btn: { backgroundColor: COLORS.orange, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  demo: { color: COLORS.muted, fontSize: 11, textAlign: 'center', marginTop: 16 },
});

export default LoginScreen;
