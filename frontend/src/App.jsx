import { ProductsProvider } from "./shared/context/ProductsContext";
import { CartProvider } from "./shared/context/CartContext";
import Catalog from "./modules/catalog/index";
import "./App.css";

function App() {
  return (
    <ProductsProvider>
      <CartProvider>
        <Catalog />
      </CartProvider>
    </ProductsProvider>
  );
}

export default App;
