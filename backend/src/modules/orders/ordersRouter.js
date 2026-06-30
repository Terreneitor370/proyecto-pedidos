const express = require("express");
const Stripe = require("stripe");
const db = require("../../shared/db");

const router = express.Router();
const IVA_RATE = 0.16;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const STRIPE_CURRENCY = (process.env.STRIPE_CURRENCY || "mxn").toLowerCase();

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const pendingCheckoutSessions = new Map();
const finalizedTicketsBySession = new Map();

class RequestError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = "RequestError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function respondError(res, error, fallbackMessage) {
  if (error instanceof RequestError) {
    const payload = { error: error.message };
    if (error.details) {
      payload.details = error.details;
    }
    return res.status(error.statusCode).json(payload);
  }

  console.error("[ordersRouter] Error:", error.message);
  return res.status(500).json({ error: fallbackMessage || "Error interno del servidor" });
}

// Validar estructura de cada item del pedido
function validarItem(item) {
  return (
    typeof item.product_id === "number" &&
    typeof item.title === "string" && item.title.trim().length > 0 &&
    typeof item.price === "number" && item.price > 0 &&
    typeof item.quantity === "number" && Number.isInteger(item.quantity) && item.quantity >= 1
  );
}

function normalizarPayloadPedido(body) {
  const rawUserId = Number(body?.user_id);
  if (!Number.isInteger(rawUserId) || rawUserId <= 0) {
    throw new RequestError(400, "user_id invalido");
  }

  if (!Array.isArray(body?.items) || body.items.length === 0) {
    throw new RequestError(400, "El pedido debe tener al menos un producto");
  }

  if (!body.items.every(validarItem)) {
    throw new RequestError(400, "Uno o mas productos tienen datos invalidos");
  }

  const items = body.items.map((item) => ({
    product_id: Number(item.product_id),
    title: String(item.title).trim(),
    price: roundMoney(Number(item.price)),
    quantity: Number(item.quantity),
  }));

  return {
    user_id: rawUserId,
    items,
  };
}

function agruparCantidades(items) {
  const grouped = new Map();

  for (const item of items) {
    const prev = grouped.get(item.product_id);
    if (prev) {
      prev.quantity += item.quantity;
    } else {
      grouped.set(item.product_id, {
        product_id: item.product_id,
        title: item.title,
        quantity: item.quantity,
      });
    }
  }

  return [...grouped.values()];
}

function calcularTotales(items) {
  const subtotal = roundMoney(
    items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0)
  );
  const iva = roundMoney(subtotal * IVA_RATE);
  const total = roundMoney(subtotal + iva);

  return {
    subtotal,
    iva,
    total,
  };
}

async function validarConexionDB() {
  try {
    await db.query("SELECT 1 AS ok");
  } catch (error) {
    throw new RequestError(503, "Sin conexion con la base de datos", {
      reason: error.message,
    });
  }
}

async function validarInventario(items, options = {}) {
  const { lockRows = false, connection = db } = options;
  const groupedItems = agruparCantidades(items);
  const productIds = groupedItems.map((item) => item.product_id);

  let query = "SELECT product_id, quantity FROM stock WHERE product_id IN (?)";
  if (lockRows) {
    query += " FOR UPDATE";
  }

  const [stockRows] = await connection.query(query, [productIds]);
  const stockMap = new Map();
  stockRows.forEach((row) => {
    stockMap.set(Number(row.product_id), Number(row.quantity));
  });

  for (const item of groupedItems) {
    const disponible = stockMap.get(item.product_id);

    if (disponible === undefined) {
      throw new RequestError(400, `Producto ${item.product_id} no encontrado en stock`, {
        product_id: item.product_id,
      });
    }

    if (item.quantity > disponible) {
      throw new RequestError(
        400,
        `Stock insuficiente para "${item.title}". Disponible: ${disponible}, solicitado: ${item.quantity}`,
        {
          product_id: item.product_id,
          requested: item.quantity,
          available: disponible,
        }
      );
    }
  }

  return true;
}

function requireStripeConfigured() {
  if (!stripe) {
    throw new RequestError(500, "Stripe no esta configurado. Define STRIPE_SECRET_KEY en backend/.env");
  }
}

function toStripeLineItems(items) {
  return items.map((item) => ({
    quantity: item.quantity,
    price_data: {
      currency: STRIPE_CURRENCY,
      unit_amount: Math.round(Number(item.price) * 100),
      product_data: {
        name: item.title,
      },
    },
  }));
}

async function guardarOrden(connection, payload, summary) {
  const [orderResult] = await connection.query(
    "INSERT INTO orders (user_id, total) VALUES (?, ?)",
    [payload.user_id, summary.total]
  );
  const orderId = orderResult.insertId;

  for (const item of payload.items) {
    await connection.query(
      "INSERT INTO order_items (order_id, product_id, title, price_at_purchase, quantity) VALUES (?, ?, ?, ?, ?)",
      [orderId, item.product_id, item.title, item.price, item.quantity]
    );

    await connection.query(
      "UPDATE stock SET quantity = quantity - ? WHERE product_id = ?",
      [item.quantity, item.product_id]
    );
  }

  return orderId;
}

function buildTicket(orderId, payload, summary, extras = {}) {
  return {
    order_id: orderId,
    user_id: payload.user_id,
    subtotal: summary.subtotal,
    iva: summary.iva,
    total: summary.total,
    items: payload.items.map((item) => ({
      product_id: item.product_id,
      title: item.title,
      quantity: item.quantity,
      price_at_purchase: item.price,
    })),
    payment_method: extras.payment_method || "stripe",
    stripe_session_id: extras.stripe_session_id || null,
    created_at: extras.created_at || new Date().toISOString(),
  };
}

// POST /api/orders
router.post("/", async (req, res) => {
  let payload;
  try {
    payload = normalizarPayloadPedido(req.body);
    await validarConexionDB();
  } catch (error) {
    return respondError(res, error, "No fue posible validar el pedido");
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await validarInventario(payload.items, { lockRows: true, connection: conn });
    const summary = calcularTotales(payload.items);
    const orderId = await guardarOrden(conn, payload, summary);

    await conn.commit();

    res.status(201).json({
      order_id: orderId,
      total: summary.total,
      items: payload.items.map((i) => ({
        product_id: i.product_id,
        title: i.title,
        quantity: i.quantity,
        price_at_purchase: i.price,
      })),
    });
  } catch (err) {
    await conn.rollback();
    return respondError(res, err, "Error al procesar el pedido");
  } finally {
    conn.release();
  }
});

// POST /api/orders/checkout/validate
router.post("/checkout/validate", async (req, res) => {
  try {
    const payload = normalizarPayloadPedido(req.body);

    await validarConexionDB();
    await validarInventario(payload.items, { lockRows: false });
    const summary = calcularTotales(payload.items);

    return res.status(200).json({
      steps: {
        connection: "ok",
        inventory: "ok",
        totals: "ok",
      },
      summary,
      items_count: payload.items.length,
    });
  } catch (error) {
    return respondError(res, error, "Error al validar checkout");
  }
});

// POST /api/orders/checkout/create-session
router.post("/checkout/create-session", async (req, res) => {
  try {
    requireStripeConfigured();

    const payload = normalizarPayloadPedido(req.body);
    await validarConexionDB();
    await validarInventario(payload.items, { lockRows: false });
    const summary = calcularTotales(payload.items);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: toStripeLineItems(payload.items),
      success_url: `${FRONTEND_URL}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/?checkout=cancel`,
      metadata: {
        user_id: String(payload.user_id),
      },
    });

    pendingCheckoutSessions.set(session.id, {
      payload,
      summary,
      created_at: new Date().toISOString(),
    });

    return res.status(201).json({
      session_id: session.id,
      checkout_url: session.url,
      summary,
      payment_method: "stripe",
      step: "send_order",
    });
  } catch (error) {
    return respondError(res, error, "Error al enviar pedido a Stripe");
  }
});

// POST /api/orders/checkout/confirm-session
router.post("/checkout/confirm-session", async (req, res) => {
  const sessionId = String(req.body?.session_id || "").trim();

  if (!sessionId) {
    return res.status(400).json({ error: "session_id es obligatorio" });
  }

  if (finalizedTicketsBySession.has(sessionId)) {
    return res.status(200).json({
      ticket: finalizedTicketsBySession.get(sessionId),
      already_processed: true,
    });
  }

  try {
    requireStripeConfigured();
    await validarConexionDB();
  } catch (error) {
    return respondError(res, error, "No fue posible iniciar confirmacion");
  }

  const pending = pendingCheckoutSessions.get(sessionId);
  if (!pending) {
    return res.status(404).json({
      error: "No existe un checkout pendiente para esta session. Si el servidor se reinicio, crea un checkout nuevo.",
    });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      throw new RequestError(409, "El pago aun no esta confirmado en Stripe", {
        payment_status: session.payment_status,
      });
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await validarInventario(pending.payload.items, { lockRows: true, connection: conn });

      const summary = calcularTotales(pending.payload.items);
      const orderId = await guardarOrden(conn, pending.payload, summary);
      await conn.commit();

      const ticket = buildTicket(orderId, pending.payload, summary, {
        payment_method: "stripe",
        stripe_session_id: sessionId,
      });

      pendingCheckoutSessions.delete(sessionId);
      finalizedTicketsBySession.set(sessionId, ticket);

      return res.status(201).json({
        ticket,
        step: "save_purchase",
      });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    return respondError(res, error, "Error al guardar la compra");
  }
});

// GET /api/orders/ticket/:orderId
router.get("/ticket/:orderId", async (req, res) => {
  const orderId = Number(req.params.orderId);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ error: "orderId invalido" });
  }

  try {
    await validarConexionDB();

    const [orderRows] = await db.query(
      "SELECT id, user_id, total, created_at FROM orders WHERE id = ? LIMIT 1",
      [orderId]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ error: "Ticket no encontrado" });
    }

    const order = orderRows[0];

    const [itemRows] = await db.query(
      "SELECT product_id, title, price_at_purchase, quantity FROM order_items WHERE order_id = ?",
      [orderId]
    );

    const items = itemRows.map((item) => ({
      product_id: Number(item.product_id),
      title: item.title,
      quantity: Number(item.quantity),
      price_at_purchase: roundMoney(Number(item.price_at_purchase)),
    }));

    const subtotal = roundMoney(
      items.reduce((acc, item) => acc + item.price_at_purchase * item.quantity, 0)
    );
    const total = roundMoney(Number(order.total));
    const iva = roundMoney(total - subtotal);

    return res.status(200).json({
      ticket: {
        order_id: orderId,
        user_id: Number(order.user_id),
        subtotal,
        iva,
        total,
        items,
        payment_method: "stripe",
        created_at: order.created_at,
      },
      step: "show_ticket",
    });
  } catch (error) {
    return respondError(res, error, "Error al obtener ticket");
  }
});

module.exports = router;
