import { useCart } from "../../../shared/context/CartContext";

export default function ProductCard({ product }) {
  const { title, price, category, image, rating, stock } = product;
  const { items, addToCart } = useCart();

  const cartItem = items.find((i) => i.id === product.id);
  const cartQty = cartItem ? cartItem.quantity : 0;

  const sinStock = stock === 0;
  const limiteAlcanzado = cartQty >= stock;

  function handleAgregar() {
    if (!sinStock && !limiteAlcanzado) {
      addToCart(product, 1);
    }
  }

  function getButtonLabel() {
    if (sinStock) return "Sin stock";
    if (limiteAlcanzado) return `Limite alcanzado (${cartQty}/${stock})`;
    if (cartQty > 0) return `Agregar (${cartQty} en carrito)`;
    return "Agregar al carrito";
  }

  return (
    <div className="product-card">
      <img src={image} alt={title} className="product-card__image" />
      <h3 className="product-card__title">{title}</h3>
      <p className="product-card__category">{category}</p>
      <p className="product-card__price">${price.toFixed(2)}</p>
      <p className="product-card__rating">
        Rating: {rating?.rate ?? "N/A"} ({rating?.count ?? 0})
      </p>
      <p className="product-card__stock">Stock: {stock ?? "N/A"}</p>
      <button
        className="product-card__button"
        onClick={handleAgregar}
        disabled={sinStock || limiteAlcanzado}
      >
        {getButtonLabel()}
      </button>
    </div>
  );
}
