import express from 'express';
import cors from 'cors';  // ← Asegúrate que esto está importado
import productsRoutes from './modules/catalog/products.routes.js';

const app = express();

// Middlewares
app.use(cors());  // ← Asegúrate que esto está aquí
app.use(express.json());

// Rutas
app.use('/api/products', productsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

export default app;