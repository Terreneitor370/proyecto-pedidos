import React from 'react';
import { ProductsProvider } from './shared/context/ProductsContext';
import { CartProvider } from './shared/context/CartContext';
import { AuthProvider } from './shared/context/AuthContext';
import SplashContainer from './modules/splash/SplashContainer';
import ProductGrid from './modules/splash/ProductGrid';
import './shared/styles.css';

function App() {
  return (
    <ProductsProvider>
      <CartProvider>
        <AuthProvider>
          <SplashContainer>
            <div className="app-container">
              <h1>Fast Food - Sistema de Pedidos</h1>
              <ProductGrid />
            </div>
          </SplashContainer>
        </AuthProvider>
      </CartProvider>
    </ProductsProvider>
  );
}

export default App;