import React, { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [cafeId, setCafeId] = useState(null);
  const [cafeName, setCafeName] = useState('');

  const addItem = useCallback((item, cafe) => {
    // If adding from a different cafe, clear cart
    if (cafeId && cafeId !== cafe._id) {
      setCart([]);
    }
    setCafeId(cafe._id);
    setCafeName(cafe.name);
    setCart(prev => {
      const existing = prev.find(i => i.itemId === item._id);
      if (existing) {
        return prev.map(i => i.itemId === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { itemId: item._id, name: item.name, price: item.price, quantity: 1 }];
    });
  }, [cafeId]);

  const removeItem = useCallback((itemId) => {
    setCart(prev => {
      const updated = prev.map(i => i.itemId === itemId ? { ...i, quantity: i.quantity - 1 } : i)
                         .filter(i => i.quantity > 0);
      if (updated.length === 0) { setCafeId(null); setCafeName(''); }
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setCafeId(null);
    setCafeName('');
  }, []);

  const totalAmount = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, cafeId, cafeName, addItem, removeItem, clearCart, totalAmount, totalItems }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
