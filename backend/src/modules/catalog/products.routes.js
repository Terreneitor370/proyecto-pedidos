import express from 'express';
import pool from '../../shared/db/connection.js';

const router = express.Router();
const FAKE_STORE_API = 'https://fakestoreapi.com/products';

// GET /api/products - Combina FakeStore + stock de MySQL
router.get('/', async (req, res) => {
  try {
    console.log('📡 Fetching products from FakeStore...');
    
    // 1. Obtener productos de FakeStore
    const response = await fetch(FAKE_STORE_API);
    
    if (!response.ok) {
      throw new Error(`Error en FakeStore: ${response.status}`);
    }
    
    const products = await response.json();
    console.log(`📦 ${products.length} products from FakeStore`);
    
    // 2. Obtener stock desde MySQL
    console.log('📊 Consulting MySQL for stock...');
    const [stockData] = await pool.query('SELECT product_id, quantity FROM stock');
    console.log(`📊 ${stockData.length} stock records found`);
    
    // 3. Crear mapa de stock
    const stockMap = {};
    stockData.forEach(item => {
      stockMap[item.product_id] = item.quantity;
    });
    
    // 4. Combinar productos con stock
    const combinedProducts = products.map(product => ({
      id: product.id,
      title: product.title,
      price: product.price,
      description: product.description,
      category: product.category,
      image: product.image,
      rating: {
        rate: product.rating?.rate || 0,
        count: product.rating?.count || 0
      },
      stock: stockMap[product.id] !== undefined ? stockMap[product.id] : 0
    }));
    
    console.log(`✅ ${combinedProducts.length} products combined with stock`);
    res.json(combinedProducts);
    
  } catch (error) {
    console.error('❌ Error en GET /api/products:', error);
    res.status(500).json({ 
      error: 'Error al obtener productos',
      message: error.message 
    });
  }
});

export default router;