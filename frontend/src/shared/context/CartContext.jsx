import { createContext, useContext, useReducer, useMemo } from "react";

const CartContext = createContext(null);

const IVA_RATE = 0.16;

// --- Reducer ---
function cartReducer(state, action) {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.id === action.product.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.product.id
              ? { ...i, quantity: i.quantity + action.quantity }
              : i
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.product, quantity: action.quantity }],
      };
    }

    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((i) => i.id !== action.productId),
      };

    case "UPDATE_QUANTITY": {
      const newQty = action.quantity;
      if (newQty <= 0) {
        return {
          ...state,
          items: state.items.filter((i) => i.id !== action.productId),
        };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.productId ? { ...i, quantity: newQty } : i
        ),
      };
    }

    case "CLEAR_CART":
      return { ...state, items: [] };

    case "SET_DESCUENTO":
      return { ...state, descuento: Math.max(0, action.amount) };

    default:
      return state;
  }
}

const initialState = {
  items: [],
  descuento: 0,
};

// --- Provider ---
export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const totales = useMemo(() => {
    const subtotal = state.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const descuento = Math.min(state.descuento, subtotal);
    const base = subtotal - descuento;
    const iva = base * IVA_RATE;
    const total = base + iva;
    return { subtotal, descuento, iva, total };
  }, [state.items, state.descuento]);

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

  function applyDescuento(amount) {
    dispatch({ type: "SET_DESCUENTO", amount });
  }

  const value = {
    items: state.items,
    ...totales,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    applyDescuento,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// --- Hook ---
// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de CartProvider");
  }
  return context;
}
