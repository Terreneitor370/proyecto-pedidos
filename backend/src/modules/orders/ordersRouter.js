const express = require("express");
const db = require("../../shared/db");

const router = express.Router();

// Validar estructura de cada item del pedido
function validarItem(item) {
  return (
    typeof item.product_id === "number" &&
    typeof item.title === "string" && item.title.trim().length > 0 &&
    typeof item.price === "number" && item.price > 0 &&
    typeof item.quantity === "number" && Number.isInteger(item.quantity) && item.quantity >= 1
  );
}

// POST /api/orders
router.post("/", async (req, res) => {
  const { user_id, items } = req.body;

  // Validar body
  if (!user_id || typeof user_id !== "number") {
    return res.status(400).json({ error: "user_id invalido" });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "El pedido debe tener al menos un producto" });
  }
  if (!items.every(validarItem)) {
    return res.status(400).json({ error: "Uno o mas productos tienen datos invalidos" });
  }

  const productIds = items.map((i) => i.product_id);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Verificar stock en DB (FOR UPDATE bloquea las filas durante la transaccion)
    const [stockRows] = await conn.query(
      "SELECT product_id, quantity FROM stock WHERE product_id IN (?) FOR UPDATE",
      [productIds]
    );

    const stockMap = {};
    stockRows.forEach((row) => { stockMap[row.product_id] = row.quantity; });

    // Validar que cada producto tiene suficiente stock
    for (const item of items) {
      const disponible = stockMap[item.product_id];
      if (disponible === undefined) {
        await conn.rollback();
        return res.status(400).json({
          error: `Producto ${item.product_id} no encontrado en stock`,
        });
      }
      if (item.quantity > disponible) {
        await conn.rollback();
        return res.status(400).json({
          error: `Stock insuficiente para "${item.title}". Disponible: ${disponible}, solicitado: ${item.quantity}`,
        });
      }
    }

    // Calcular total
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const total = parseFloat((subtotal * 1.16).toFixed(2));

    // Insertar orden
    const [orderResult] = await conn.query(
      "INSERT INTO orders (user_id, total) VALUES (?, ?)",
      [user_id, total]
    );
    const orderId = orderResult.insertId;

    // Insertar items de la orden (precio snapshot)
    for (const item of items) {
      await conn.query(
        "INSERT INTO order_items (order_id, product_id, title, price_at_purchase, quantity) VALUES (?, ?, ?, ?, ?)",
        [orderId, item.product_id, item.title, item.price, item.quantity]
      );
      // Descontar stock
      await conn.query(
        "UPDATE stock SET quantity = quantity - ? WHERE product_id = ?",
        [item.quantity, item.product_id]
      );
    }

    await conn.commit();

    res.status(201).json({
      order_id: orderId,
      total,
      items: items.map((i) => ({ product_id: i.product_id, title: i.title, quantity: i.quantity, price_at_purchase: i.price })),
    });
  } catch (err) {
    await conn.rollback();
    console.error("[POST /api/orders] Error:", err.message);
    res.status(500).json({ error: "Error al procesar el pedido" });
  } finally {
    conn.release();
  }
});

module.exports = router;
