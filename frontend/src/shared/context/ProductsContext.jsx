import { createContext, useContext, useState } from "react";

const ProductsContext = createContext(null);

// TODO: Kassie reemplazara este mock con el fetch real (FakeStore + stock del backend) en Modulo 1
const MOCK_PRODUCTS = [
  {
    id: 1,
    title: "Hamburguesa Clasica",
    price: 89.0,
    description: "Hamburguesa con queso, lechuga y tomate",
    category: "food",
    image: "https://via.placeholder.com/200",
    rating: { rate: 4.5, count: 120 },
    stock: 15,
  },
  {
    id: 2,
    title: "Papas Fritas",
    price: 45.0,
    description: "Papas fritas crujientes",
    category: "food",
    image: "https://via.placeholder.com/200",
    rating: { rate: 4.2, count: 80 },
    stock: 30,
  },
  {
    id: 3,
    title: "Refresco de Cola",
    price: 25.0,
    description: "Refresco 500ml",
    category: "drinks",
    image: "https://via.placeholder.com/200",
    rating: { rate: 4.0, count: 200 },
    stock: 50,
  },
];

export function ProductsProvider({ children }) {
  const [products] = useState(MOCK_PRODUCTS);
  const [loading] = useState(false);
  const [error] = useState(null);

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
