import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useCart } from "../../shared/context/CartContext";
import "./checkout.css";

const ORDERS_API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/orders`
  : "http://localhost:4000/api/orders";

function getInitialSteps() {
  return {
    connection: "pending",
    inventory: "pending",
    totals: "pending",
    sendOrder: "pending",
    savePurchase: "pending",
    ticket: "pending",
  };
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function toOrderPayloadItems(items) {
  return items.map((item) => ({
    product_id: Number(item.id),
    title: String(item.title || "").trim(),
    price: Number(item.price),
    quantity: Number(item.quantity),
  }));
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

export default function CheckoutPage({
  defaultUserId = 1,
  onBackToCart = null,
  onGoCatalog = null,
}) {
  const { items, subtotal, iva, total, clearCart } = useCart();
  const [userId, setUserId] = useState(String(defaultUserId));
  const [steps, setSteps] = useState(getInitialSteps);
  const [summary, setSummary] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const handledStripeReturnRef = useRef(false);

  const currentSummary = summary || {
    subtotal,
    iva,
    total,
  };

  const itemCount = useMemo(
    () => items.reduce((acc, item) => acc + Number(item.quantity || 0), 0),
    [items]
  );

  function updateSteps(patch) {
    setSteps((prev) => ({ ...prev, ...patch }));
  }

  async function confirmStripeSession(sessionId) {
    setIsProcessing(true);
    setMessage("");
    setTicket(null);
    setSummary(null);
    setSteps({
      connection: "done",
      inventory: "done",
      totals: "done",
      sendOrder: "done",
      savePurchase: "running",
      ticket: "pending",
    });

    try {
      const { data } = await axios.post(`${ORDERS_API_URL}/checkout/confirm-session`, {
        session_id: sessionId,
      });

      setTicket(data.ticket);
      updateSteps({
        savePurchase: "done",
        ticket: "done",
      });
      clearCart();
      setMessage("Pago confirmado con Stripe y compra guardada correctamente.");
    } catch (error) {
      updateSteps({
        savePurchase: "error",
        ticket: "error",
      });
      setMessage(getErrorMessage(error, "No fue posible confirmar la compra"));
    } finally {
      setIsProcessing(false);
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("checkout");
      cleanUrl.searchParams.delete("session_id");
      window.history.replaceState({}, "", `${cleanUrl.pathname}${cleanUrl.search}`);
    }
  }

  useEffect(() => {
    if (handledStripeReturnRef.current) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get("checkout");
    const sessionId = params.get("session_id");

    if (checkoutStatus === "success" && sessionId) {
      handledStripeReturnRef.current = true;
      confirmStripeSession(sessionId);
      return;
    }

    if (checkoutStatus === "cancel") {
      handledStripeReturnRef.current = true;
      updateSteps({
        connection: "done",
        inventory: "done",
        totals: "done",
        sendOrder: "error",
      });
      setMessage("Pago cancelado. Puedes intentarlo de nuevo.");

      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("checkout");
      window.history.replaceState({}, "", `${cleanUrl.pathname}${cleanUrl.search}`);
    }
  }, []);

  async function handleStripeCheckout() {
    const numericUserId = Number(userId);
    if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
      setMessage("El user_id debe ser un entero positivo");
      return;
    }

    if (items.length === 0) {
      setMessage("No hay productos en el carrito");
      return;
    }

    setIsProcessing(true);
    setMessage("");
    setSummary(null);
    setTicket(null);
    setSteps({
      connection: "running",
      inventory: "pending",
      totals: "pending",
      sendOrder: "pending",
      savePurchase: "pending",
      ticket: "pending",
    });

    const payload = {
      user_id: numericUserId,
      items: toOrderPayloadItems(items),
    };

    try {
      const validationResult = await axios.post(`${ORDERS_API_URL}/checkout/validate`, payload);
      setSummary(validationResult.data.summary);
      setSteps({
        connection: "done",
        inventory: "done",
        totals: "done",
        sendOrder: "running",
        savePurchase: "pending",
        ticket: "pending",
      });
    } catch (error) {
      updateSteps({
        connection: "error",
        inventory: "error",
        totals: "error",
      });
      setMessage(getErrorMessage(error, "No fue posible validar el checkout"));
      setIsProcessing(false);
      return;
    }

    try {
      const sessionResponse = await axios.post(`${ORDERS_API_URL}/checkout/create-session`, payload);
      updateSteps({ sendOrder: "done" });
      window.location.assign(sessionResponse.data.checkout_url);
    } catch (error) {
      updateSteps({ sendOrder: "error" });
      setMessage(getErrorMessage(error, "No fue posible enviar el pedido a Stripe"));
      setIsProcessing(false);
    }
  }

  const canTriggerPayment = items.length > 0 && !isProcessing;

  return (
    <section className="checkout-page">
      <header className="checkout-page__header">
        <h2>Checkout con Stripe</h2>
      </header>

      {!ticket && (
        <div className="checkout-layout">
          <div className="checkout-card">
            <h3>Datos del pago</h3>
            <label htmlFor="checkout-user-id">User ID</label>
            <input
              id="checkout-user-id"
              type="number"
              min="1"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
            />

            <p>Articulos en carrito: {itemCount}</p>

            <button
              type="button"
              className="checkout-card__primary"
              onClick={handleStripeCheckout}
              disabled={!canTriggerPayment}
            >
              {isProcessing ? "Procesando..." : "Pagar con Stripe"}
            </button>

            {typeof onBackToCart === "function" && (
              <button
                type="button"
                className="checkout-card__ghost"
                onClick={onBackToCart}
                disabled={isProcessing}
              >
                Volver al carrito
              </button>
            )}
          </div>

          <aside className="checkout-summary">
            <h3>Resumen</h3>
            <div className="checkout-summary__row">
              <span>Subtotal</span>
              <strong>{formatMoney(currentSummary.subtotal)}</strong>
            </div>
            <div className="checkout-summary__row">
              <span>IVA (16%)</span>
              <strong>{formatMoney(currentSummary.iva)}</strong>
            </div>
            <div className="checkout-summary__row checkout-summary__row--total">
              <span>Total</span>
              <strong>{formatMoney(currentSummary.total)}</strong>
            </div>
          </aside>
        </div>
      )}

      {message && <p className="checkout-message">{message}</p>}

      {ticket && (
        <article className="checkout-ticket">
          <h3>Ticket de compra</h3>
          <p>Orden #{ticket.order_id}</p>
          <p>Pago: {ticket.payment_method}</p>
          <p>Total: {formatMoney(ticket.total)}</p>

          <div className="checkout-ticket__items">
            {ticket.items.map((item) => (
              <div key={`${item.product_id}-${item.title}`} className="checkout-ticket__item">
                <span>{item.title}</span>
                <span>
                  {item.quantity} x {formatMoney(item.price_at_purchase)}
                </span>
              </div>
            ))}
          </div>

          <div className="checkout-ticket__actions">
            {typeof onGoCatalog === "function" && (
              <button type="button" onClick={onGoCatalog}>
                Volver al catalogo
              </button>
            )}
            {typeof onBackToCart === "function" && (
              <button type="button" className="checkout-ticket__ghost" onClick={onBackToCart}>
                Ir al carrito
              </button>
            )}
          </div>
        </article>
      )}
    </section>
  );
}