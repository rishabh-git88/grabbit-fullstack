import React from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import AppNavigator from './src/navigation/AppNavigator';

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />
        <AppNavigator />
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
