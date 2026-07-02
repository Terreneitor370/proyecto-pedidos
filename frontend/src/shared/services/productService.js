// Asegúrate de que la URL sea correcta
const BACKEND_API = 'http://localhost:5000/api/products';

export const fetchProductsFromFakeStore = async () => {
  try {
    console.log('📡 Fetching products from backend...');
    console.log('📡 URL:', BACKEND_API);  // ← Agrega este log
    
    const response = await fetch(BACKEND_API);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log(`📦 ${data.length} products received from backend`);
    return data;
    
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    throw new Error('No se pudieron cargar los productos. Verifica tu conexión.');
  }
};