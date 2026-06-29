import { ProductsProvider } from "./shared/context/ProductsContext";
import Catalog from "./modules/catalog/index";
import "./App.css";

function App() {
  return (
    <ProductsProvider>
      <Catalog />
    </ProductsProvider>
  );
}

export default App;
