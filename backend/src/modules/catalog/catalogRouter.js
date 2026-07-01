const express = require("express");
const axios = require("axios");
const db = require("../../shared/db");

const router = express.Router();

const FAKESTORE_URL = "https://fakestoreapi.com/products";

function esProductoValido(p) {
  return (
    typeof p.id === "number" &&
    typeof p.title === "string" &&
    typeof p.price === "number" &&
    typeof p.category === "string" &&
    typeof p.image === "string" &&
    typeof p.rating === "object" &&
    p.rating !== null
  );
}

router.get("/", async (req, res) => {
  try {
    const { data: fakeProducts } = await axios.get(FAKESTORE_URL, {
      timeout: 8000,
    });

    if (!Array.isArray(fakeProducts)) {
      return res
        .status(502)
        .json({ error: "Respuesta inesperada de la API externa" });
    }

    const productosValidos = fakeProducts.filter(esProductoValido);

    const [stockRows] = await db.query(
      "SELECT product_id, quantity FROM stock"
    );

    const stockMap = {};
    stockRows.forEach(function(row) {
      stockMap[row.product_id] = row.quantity;
    });

    const products = productosValidos.map(function(product) {
      return {
        id: product.id,
        title: product.title,
        price: product.price,
        description: product.description,
        category: product.category,
        image: product.image,
        rating: {
          rate: product.rating.rate,
          count: product.rating.count,
        },
        stock: stockMap[product.id] !== undefined ? stockMap[product.id] : 0,
      };
    });

    res.json(products);
  } catch (err) {
    console.error("[/api/products] Error:", err.message);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

module.exports = router;
