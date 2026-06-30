const express = require("express");
const axios = require("axios");
const db = require("../../shared/db");

const router = express.Router();

// GET /api/products
// BFF: combina productos de FakeStore con stock real de MySQL
router.get("/", async (req, res) => {
  try {
    // 1. Obtener productos de FakeStore (operación asíncrona)
    const { data: fakeProducts } = await axios.get(
      "https://fakestoreapi.com/products"
    );

    // 2. Obtener stock desde MySQL
    const [stockRows] = await db.query(
      "SELECT product_id, quantity FROM stock"
    );

    // Convertir rows a mapa { product_id: quantity } para búsqueda O(1)
    const stockMap = {};
    stockRows.forEach((row) => {
      stockMap[row.product_id] = row.quantity;
    });

    // 3. Combinar: agregar campo stock a cada producto
    const products = fakeProducts.map((product) => ({
      id: product.id,
      title: product.title,
      price: product.price,
      description: product.description,
      category: product.category,
      image: product.image,
      rating: product.rating,
      stock: stockMap[product.id] ?? 0, // 0 si no hay registro en MySQL
    }));

    res.json(products);
  } catch (err) {
    console.error("[/api/products] Error:", err.message);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

module.exports = router;
