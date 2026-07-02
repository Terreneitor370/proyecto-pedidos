export default function CartSummary({
  subtotal,
  iva,
  total,
  itemCount,
  formatMoney,
  onClearCart,
  onCheckout,
  checkoutEnabled,
}) {
  return (
    <aside className="cart-summary" aria-label="Resumen de compra">
      <h3>Resumen</h3>

      <div className="cart-summary__row">
        <span>Articulos</span>
        <strong>{itemCount}</strong>
      </div>

      <div className="cart-summary__row">
        <span>Subtotal</span>
        <strong>{formatMoney(subtotal)}</strong>
      </div>

      <div className="cart-summary__row">
        <span>IVA (16%)</span>
        <strong>{formatMoney(iva)}</strong>
      </div>

      <div className="cart-summary__row cart-summary__row--total">
        <span>Total</span>
        <strong>{formatMoney(total)}</strong>
      </div>

      <button type="button" className="cart-summary__button cart-summary__button--ghost" onClick={onClearCart}>
        Vaciar carrito
      </button>

      <button
        type="button"
        className="cart-summary__button cart-summary__button--primary"
        onClick={onCheckout}
        disabled={!checkoutEnabled}
        title={checkoutEnabled ? "Ir al checkout con Stripe" : "No hay accion de checkout conectada"}
      >
        Pagar con Stripe
      </button>
    </aside>
  );
}