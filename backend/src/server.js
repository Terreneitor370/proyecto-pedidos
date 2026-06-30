const express = require("express");
const cors = require("cors");
require("dotenv").config();

const catalogRouter = require("./modules/catalog/catalogRouter");

const app = express();

app.use(cors());
app.use(express.json());

// Rutas
app.use("/api/products", catalogRouter);

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Backend de Pedidos corriendo" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
});
