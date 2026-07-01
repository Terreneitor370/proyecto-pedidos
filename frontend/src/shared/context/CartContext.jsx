import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { useAuth } from "../../modules/auth/hooks/useAuth.js";
import {
  loadUserCart,
  saveUserCart,
} from "../services/userCartStorage.js";

const CartContext = createContext(null);

const IVA_RATE = 0.16;

function cartReducer(state, action) {
  switch (action.type) {
    case "LOAD_CART":
      return Array.isArray(action.items) ? action.items : [];

    case "ADD_ITEM": {
      const existing = state.find((i) => i.id === action.product.id);
      const maxStock = action.product.stock ?? Infinity;

      if (existing) {
        const newQty = existing.quantity + action.quantity;
        if (newQty > maxStock) return state;
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
  const { user } = useAuth();
  const [items, dispatch] = useReducer(cartReducer, []);
  const itemsRef = useRef(items);
  const activeUserIdRef = useRef(null);

  itemsRef.current = items;

  // Al cambiar de usuario: guardar carrito anterior y cargar el del nuevo
  useEffect(() => {
    const previousUserId = activeUserIdRef.current;

    if (previousUserId && previousUserId !== user?.id) {
      saveUserCart(previousUserId, itemsRef.current);
    }

    if (user?.id) {
      dispatch({ type: "LOAD_CART", items: loadUserCart(user.id) });
    } else {
      dispatch({ type: "LOAD_CART", items: [] });
    }

    activeUserIdRef.current = user?.id ?? null;
  }, [user?.id]);

  // Persistir carrito del usuario activo en cada cambio
  useEffect(() => {
    if (user?.id) {
      saveUserCart(user.id, items);
    }
  }, [user?.id, items]);

  const { subtotal, iva, total } = useMemo(() => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const iva = subtotal * IVA_RATE;
    const total = subtotal + iva;
    return { subtotal, iva, total };
  }, [items]);

  function addToCart(product, quantity = 1) {
    if (!user?.id) return;
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
    <CartContext.Provider
      value={{
        items,
        subtotal,
        iva,
        total,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartEnabled: Boolean(user?.id),
      }}
    >
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