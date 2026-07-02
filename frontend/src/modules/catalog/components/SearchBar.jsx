import { useState, useEffect } from "react";

export default function SearchBar({ value, onChange }) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(localValue);
    }, 300);
    return () => clearTimeout(timeout);
  }, [localValue]);

  return (
    <input
      type="text"
      placeholder="Buscar producto..."
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      className="search-bar"
    />
  );
}
