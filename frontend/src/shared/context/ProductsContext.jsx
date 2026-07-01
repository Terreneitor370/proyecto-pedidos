import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const ProductsContext = createContext(null);

// OWASP A05: URL del backend desde variable de entorno, nunca hardcodeada
const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/products`
  : "http://localhost:4000/api/products";

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axios.get(API_URL);
        setProducts(data);
      } catch (err) {
        const mensaje =
          err.response?.data?.error ||
          err.message ||
          "Error desconocido al cargar productos";
        setError(mensaje);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <ProductsContext.Provider value={{ products, loading, error }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error("useProducts debe usarse dentro de ProductsProvider");
  }
  return context;
}
