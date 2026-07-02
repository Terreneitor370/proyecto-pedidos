import { useState, useMemo } from "react";
import { filterProducts, getCategories } from "../utils/filterProducts";

export function useProductFilters(products) {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("default");

  const categories = useMemo(() => getCategories(products), [products]);

  const filtered = useMemo(
    () => filterProducts(products, { searchTerm, category, sortBy }),
    [products, searchTerm, category, sortBy]
  );

  return {
    filtered,
    categories,
    searchTerm,
    setSearchTerm,
    category,
    setCategory,
    sortBy,
    setSortBy,
  };
}
