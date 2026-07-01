import React from 'react';
import { ProductsProvider } from './shared/context/ProductsContext';
import { CartProvider } from './shared/context/CartContext';
import { AuthProvider } from './shared/context/AuthContext';
import SplashContainer from './modules/splash/SplashContainer';  // ← Importar Splash
import Catalog from './modules/catalog/index';
import './shared/styles.css';  // ← Usar styles.css en lugar de App.css

function App() {
  return (
    <ProductsProvider>
      <CartProvider>
        <AuthProvider>
          <SplashContainer>  {/* ← Splash envuelve TODO */}
            <div className="app-container">
              <h1>Fast Food - Sistema de Pedidos</h1>
              <Catalog />  {/* ← Catálogo de Isa */}
            </div>
          </SplashContainer>
        </AuthProvider>
      </CartProvider>
    </ProductsProvider>
  );
}

export default App;