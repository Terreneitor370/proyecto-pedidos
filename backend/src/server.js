const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const catalogRouter = require("./modules/catalog/catalogRouter");

const app = express();

// ── Seguridad: headers HTTP seguros (OWASP A05) ──────────────────────────────
app.use(helmet());

// ── Seguridad: CORS restringido al origen del frontend (OWASP A05) ────────────
const ALLOWED_ORIGIN = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(
  cors({
    origin: ALLOWED_ORIGIN,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Seguridad: límite de tamaño de body (OWASP A04) ──────────────────────────
app.use(express.json({ limit: "10kb" }));

// ── Seguridad: rate limiting global (OWASP A04) ───────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // ventana de 15 minutos
  max: 100,                  // máx 100 peticiones por IP por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas peticiones. Intenta de nuevo en 15 minutos." },
});
app.use(limiter);

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use("/api/products", catalogRouter);

// Health check (sin información sensible del servidor)
app.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

// ── Iniciar servidor ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
});
