export default function SortControls({ value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="sort-controls">
      <option value="default">Sin ordenar</option>
      <option value="price-asc">Precio: menor a mayor</option>
      <option value="price-desc">Precio: mayor a menor</option>
      <option value="name-asc">Nombre: A-Z</option>
      <option value="name-desc">Nombre: Z-A</option>
    </select>
  );
}
