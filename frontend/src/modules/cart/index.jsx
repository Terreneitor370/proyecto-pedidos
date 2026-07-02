import { useMemo } from "react";
import { useCart } from "../../shared/context/CartContext";
import { useAuth } from "../auth/hooks/useAuth.js";
import CartEmptyState from "./components/CartEmptyState";
import CartItemRow from "./components/CartItemRow";
import CartSummary from "./components/CartSummary";
import "./cart.css";

function createCurrencyFormatter(locale, currency) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    });
  } catch (_error) {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 2,
    });
  }
}

export default function CartPage({
  title = "Tu carrito",
  locale = "es-MX",
  currency = "MXN",
  onCheckout = null,
}) {
  const { user } = useAuth();
  const { items, subtotal, iva, total, clearCart, updateQuantity, removeFromCart } = useCart();

  const formatter = useMemo(
    () => createCurrencyFormatter(locale, currency),
    [locale, currency]
  );

  const itemCount = useMemo(
    () => items.reduce((acc, item) => acc + Number(item.quantity || 0), 0),
    [items]
  );

  function formatMoney(value) {
    return formatter.format(Number(value) || 0);
  }

  async function handleCheckout() {
    if (typeof onCheckout !== "function" || items.length === 0) {
      return;
    }

    await onCheckout({
      items,
      subtotal,
      iva,
      total,
    });
  }

  function handleClearCart() {
    if (items.length === 0) {
      return;
    }

    if (window.confirm("Se eliminaran todos los productos del carrito. ?Continuar?")) {
      clearCart();
    }
  }

  return (
    <section className="cart-page">
      <header className="cart-page__header">
        <h2>{title}</h2>
        <p>
          {itemCount} articulo(s)
          {user ? ` · Carrito de @${user.username}` : ""}
        </p>
      </header>

      {items.length === 0 ? (
        <CartEmptyState />
      ) : (
        <div className="cart-page__layout">
          <div className="cart-page__items" aria-label="Productos en carrito">
            {items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                formatMoney={formatMoney}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
              />
            ))}
          </div>

          <CartSummary
            subtotal={subtotal}
            iva={iva}
            total={total}
            itemCount={itemCount}
            formatMoney={formatMoney}
            onClearCart={handleClearCart}
            onCheckout={handleCheckout}
            checkoutEnabled={typeof onCheckout === "function"}
          />
        </div>
      )}
    </section>
  );
}