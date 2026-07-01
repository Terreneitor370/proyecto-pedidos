import { useMemo, useState } from "react";
import { ProductsProvider } from "./shared/context/ProductsContext";
import { CartProvider, useCart } from "./shared/context/CartContext";
import SplashContainer from "./modules/splash/SplashContainer";
import Catalog from "./modules/catalog/index";
import CartPage from "./modules/cart/index";
import CheckoutPage from "./modules/checkout/index";
import "./App.css";

function AppContent() {
  const [activeView, setActiveView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout")) {
      return "checkout";
    }
    return "catalog";
  });
  const { items } = useCart();

  const cartCount = useMemo(
    () => items.reduce((acc, item) => acc + Number(item.quantity || 0), 0),
    [items]
  );

  return (
    <SplashContainer>
    <div className="app-shell">
      <header className="app-shell__header">
        <div>
          <h1 className="app-shell__title">Proyecto Pedidos</h1>
          <p className="app-shell__subtitle">Comida rapida | Catalogo y carrito</p>
        </div>

        <nav className="app-shell__tabs" aria-label="Navegacion principal">
          <button
            type="button"
            className={`app-shell__tab ${activeView === "catalog" ? "is-active" : ""}`}
            onClick={() => setActiveView("catalog")}
          >
            Catalogo
          </button>

          <button
            type="button"
            className={`app-shell__tab ${activeView === "cart" ? "is-active" : ""}`}
            onClick={() => setActiveView("cart")}
          >
            Carrito ({cartCount})
          </button>
        </nav>
      </header>

      <main className="app-shell__content">
        <section className={activeView === "catalog" ? "app-view app-view--active" : "app-view"}>
          <Catalog />
        </section>

        <section className={activeView === "cart" ? "app-view app-view--active" : "app-view"}>
          <CartPage onCheckout={() => setActiveView("checkout")} />
        </section>

        <section className={activeView === "checkout" ? "app-view app-view--active" : "app-view"}>
          <CheckoutPage
            onBackToCart={() => setActiveView("cart")}
            onGoCatalog={() => setActiveView("catalog")}
          />
        </section>
      </main>
    </div>
    </SplashContainer>
  );
}

function App() {
  return (
    <ProductsProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </ProductsProvider>
  );
}

export default App;
