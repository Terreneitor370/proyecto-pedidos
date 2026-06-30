const FAKE_STORE_API = '/api/products';

// Función para generar stock aleatorio (se ejecuta UNA SOLA VEZ)
const generateRandomStock = () => {
  return Math.floor(Math.random() * 20) + 5; // 5-25 unidades
};

export const fetchProductsFromFakeStore = async () => {
  try {
    console.log('📡 Fetching products from FakeStore API...');
    
    const response = await fetch(FAKE_STORE_API);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log(`${data.length} products received`);
    
    // ✅ El stock se genera UNA SOLA VEZ al cargar los datos
    const transformedProducts = data.map(product => ({
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
      stock: generateRandomStock() // ✅ Solo se ejecuta en el map, UNA VEZ
    }));
    
    console.log('Products transformed successfully');
    return transformedProducts;
    
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('No se pudieron cargar los productos. Verifica tu conexión.');
  }
};