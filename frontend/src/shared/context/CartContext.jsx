import React, { createContext, useState, useContext } from 'react';

// Crear el contexto
export const CartContext = createContext();

// Provider - AHORA con todas las funciones que necesita Isa
export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // 📌 Función para agregar al carrito (necesaria para Isa)
  const addToCart = (product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        // Si ya existe, actualizar cantidad
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Si no existe, agregar nuevo
        return [...prevCart, { ...product, quantity }];
      }
    });
  };

  // 📌 Función para eliminar del carrito (necesaria para Isa)
  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  // 📌 Función para actualizar cantidad (necesaria para Isa)
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  // 📌 Función para vaciar el carrito (necesaria para Isa)
  const clearCart = () => {
    setCart([]);
  };

  // ⭐ El valor que se pasa al contexto (¡con TODO lo que necesitan!)
  const value = {
    cart,              // ← Para tu código
    setCart,           // ← Para tu código
    items: cart,       // ← Para el código de Isa (alias de cart)
    addToCart,         // ← Para Isa
    removeFromCart,    // ← Para Isa
    updateQuantity,    // ← Para Isa
    clearCart          // ← Para Isa
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// ⭐ Hook useCart para que funcione con el código de Isa
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe usarse dentro de CartProvider');
  }
  return context;
};