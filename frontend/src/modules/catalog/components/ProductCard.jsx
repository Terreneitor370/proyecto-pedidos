export default function ProductCard({ product }) {
  const { title, price, category, image, rating, stock } = product;

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
      {/* TODO: conectar con addToCart del CartContext cuando Jeshua termine Modulo 3 */}
      <button className="product-card__button">Agregar al carrito</button>
    </div>
  );
}
