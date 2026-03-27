import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';

import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import MenuScreen from '../screens/MenuScreen';
import CartScreen from '../screens/CartScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';
import OrdersScreen from '../screens/OrdersScreen';
import { COLORS } from '../utils/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabIcon = ({ icon, focused }) => (
  <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
    <Text style={[tabStyles.iconText, !focused && tabStyles.iconInactive]}>{icon}</Text>
  </View>
);

const tabStyles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 4,
    borderRadius: 20,
  },
  iconWrapActive: {
    backgroundColor: COLORS.orangeLight,
  },
  iconText: { fontSize: 22 },
  iconInactive: { opacity: 0.4 },
});

const HomeTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: COLORS.bg,
        borderTopColor: COLORS.border,
        borderTopWidth: 1,
        paddingBottom: 10,
        paddingTop: 8,
        height: 68,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 16,
      },
      tabBarActiveTintColor: COLORS.orange,
      tabBarInactiveTintColor: COLORS.muted,
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '700',
        marginTop: 2,
      },
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
        tabBarLabel: 'Explore',
      }}
    />
    <Tab.Screen
      name="Orders"
      component={OrdersScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon icon="📋" focused={focused} />,
        tabBarLabel: 'Orders',
      }}
    />
  </Tab.Navigator>
);

const SplashScreen = () => (
  <View style={{ flex: 1, backgroundColor: COLORS.orange, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
    <View style={{
      width: 80, height: 80, borderRadius: 24,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
    }}>
      <Text style={{ color: '#fff', fontSize: 42, fontWeight: '900' }}>G</Text>
    </View>
    <Text style={{ color: '#fff', fontSize: 44, fontWeight: '900', letterSpacing: 4 }}>GRABBIT</Text>
    <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, fontWeight: '500' }}>
      Campus food, fast & easy 🐇
    </Text>
  </View>
);

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) return <SplashScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={HomeTabs} />
            <Stack.Screen name="Menu" component={MenuScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
