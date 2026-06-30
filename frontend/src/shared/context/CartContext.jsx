import { createContext, useContext, useReducer, useMemo } from "react";

const CartContext = createContext(null);

const IVA_RATE = 0.16;

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.find((i) => i.id === action.product.id);
      const maxStock = action.product.stock ?? Infinity;

      if (existing) {
        const newQty = existing.quantity + action.quantity;
        if (newQty > maxStock) return state; // ya en el limite, no hacer nada
        return state.map((i) =>
          i.id === action.product.id ? { ...i, quantity: newQty } : i
        );
      }

      const qty = Math.min(action.quantity, maxStock);
      if (qty <= 0) return state;
      return [...state, { ...action.product, quantity: qty }];
    }

    case "REMOVE_ITEM":
      return state.filter((i) => i.id !== action.productId);

    case "UPDATE_QUANTITY": {
      if (action.quantity <= 0) {
        return state.filter((i) => i.id !== action.productId);
      }
      return state.map((i) => {
        if (i.id !== action.productId) return i;
        const maxStock = i.stock ?? Infinity;
        return { ...i, quantity: Math.min(action.quantity, maxStock) };
      });
    }

    case "CLEAR_CART":
      return [];

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, []);

  const { subtotal, iva, total } = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const iva = subtotal * IVA_RATE;
    const total = subtotal + iva;
    return { subtotal, iva, total };
  }, [items]);

  function addToCart(product, quantity = 1) {
    dispatch({ type: "ADD_ITEM", product, quantity });
  }

  function removeFromCart(productId) {
    dispatch({ type: "REMOVE_ITEM", productId });
  }

  function updateQuantity(productId, quantity) {
    dispatch({ type: "UPDATE_QUANTITY", productId, quantity });
  }

  function clearCart() {
    dispatch({ type: "CLEAR_CART" });
  }

  return (
    <CartContext.Provider value={{ items, subtotal, iva, total, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de CartProvider");
  }
  return context;
}
