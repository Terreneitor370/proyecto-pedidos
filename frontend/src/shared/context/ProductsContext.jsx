import React, { createContext, useState, useEffect, useContext } from 'react';
import { fetchProductsFromFakeStore } from '../services/productService';

export const ProductsContext = createContext();

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts debe usarse dentro de ProductsProvider');
  }
  return context;
};

export const ProductsProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading products from FakeStore...');
      const realProducts = await fetchProductsFromFakeStore();
      
      console.log(`✅ ${realProducts.length} products loaded`);
      setProducts(realProducts);
      setLoading(false);
      
    } catch (err) {
      console.error('❌ Error loading products:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const value = {
    products,
    loading,
    error,
    reloadProducts: loadProducts
  };

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
};