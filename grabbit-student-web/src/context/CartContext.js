import React, { createContext, useContext, useState } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [cafeId, setCafeId] = useState(null);
  const [cafeName, setCafeName] = useState('');

  const addItem = (item, cafe) => {
    if (cafeId && cafeId !== cafe._id) {
      if (window.confirm(`Your cart has items from ${cafeName}. Clear cart and add from ${cafe.name}?`)) {
        setItems([{ ...item, quantity: 1 }]);
        setCafeId(cafe._id);
        setCafeName(cafe.name);
      }
      return;
    }
    setCafeId(cafe._id);
    setCafeName(cafe.name);
    setItems(prev => {
      const existing = prev.find(i => i._id === item._id);
      if (existing) {
        return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name} added to cart`);
  };

  const removeItem = (itemId) => {
    setItems(prev => {
      const existing = prev.find(i => i._id === itemId);
      if (existing?.quantity === 1) return prev.filter(i => i._id !== itemId);
      return prev.map(i => i._id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
    });
  };

  const clearCart = () => {
    setItems([]);
    setCafeId(null);
    setCafeName('');
  };

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, cafeId, cafeName, addItem, removeItem, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
