import "./catalog.css";
import { useProducts } from "../../shared/context/ProductsContext";
import { useProductFilters } from "./hooks/useProductFilters";
import SearchBar from "./components/SearchBar";
import CategoryFilter from "./components/CategoryFilter";
import SortControls from "./components/SortControls";
import ProductGrid from "./components/ProductGrid";
import EmptyState from "./components/EmptyState";

export default function Catalog() {
  const { products, loading, error } = useProducts();
  const {
    filtered,
    categories,
    searchTerm,
    setSearchTerm,
    category,
    setCategory,
    sortBy,
    setSortBy,
  } = useProductFilters(products);

  if (loading) return <p>Cargando productos...</p>;
  if (error) return <p>Error al cargar productos: {error}</p>;

  return (
    <div className="catalog">
      <div className="catalog__controls">
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
        <CategoryFilter categories={categories} value={category} onChange={setCategory} />
        <SortControls value={sortBy} onChange={setSortBy} />
      </div>

      {filtered.length === 0 ? <EmptyState /> : <ProductGrid products={filtered} />}
    </div>
  );
}
