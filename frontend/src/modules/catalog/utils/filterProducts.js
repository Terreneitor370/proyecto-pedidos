export function filterProducts(products, { searchTerm = "", category = "all", sortBy = "default" } = {}) {
  let result = [...products];

  if (searchTerm.trim() !== "") {
    const term = searchTerm.toLowerCase();
    result = result.filter((p) => p.title.toLowerCase().includes(term));
  }

  if (category !== "all") {
    result = result.filter((p) => p.category === category);
  }

  if (sortBy === "price-asc") {
    result.sort((a, b) => a.price - b.price);
  } else if (sortBy === "price-desc") {
    result.sort((a, b) => b.price - a.price);
  } else if (sortBy === "name-asc") {
    result.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortBy === "name-desc") {
    result.sort((a, b) => b.title.localeCompare(a.title));
  }

  return result;
}

export function getCategories(products) {
  return [...new Set(products.map((p) => p.category))];
}
