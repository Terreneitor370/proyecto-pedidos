export default function CartItemRow({ item, formatMoney, onUpdateQuantity, onRemove }) {
  const quantity = Number(item.quantity || 0);
  const unitPrice = Number(item.price || 0);
  const stock = Number(item.stock);
  const hasStockLimit = Number.isFinite(stock) && stock >= 0;
  const reachedStockLimit = hasStockLimit ? quantity >= stock : false;
  const lineTotal = unitPrice * quantity;

  function decrease() {
    onUpdateQuantity(item.id, quantity - 1);
  }

  function increase() {
    if (reachedStockLimit) {
      return;
    }
    onUpdateQuantity(item.id, quantity + 1);
  }

  function handleQuantityInput(event) {
    const nextQuantity = Number(event.target.value);
    if (Number.isNaN(nextQuantity)) {
      return;
    }
    onUpdateQuantity(item.id, nextQuantity);
  }

  return (
    <article className="cart-item">
      <img src={item.image} alt={item.title} className="cart-item__image" />

      <div className="cart-item__content">
        <h3 className="cart-item__title">{item.title}</h3>
        <p className="cart-item__meta">{item.category || "Sin categoria"}</p>
        <p className="cart-item__meta">Precio unitario: {formatMoney(unitPrice)}</p>
        {hasStockLimit && <p className="cart-item__meta">Stock disponible: {stock}</p>}
      </div>

      <div className="cart-item__actions">
        <div className="quantity-control" role="group" aria-label={`Cantidad de ${item.title}`}>
          <button type="button" onClick={decrease} aria-label={`Reducir cantidad de ${item.title}`}>
            -
          </button>

          <input
            type="number"
            min="0"
            max={hasStockLimit ? stock : undefined}
            value={quantity}
            onChange={handleQuantityInput}
            aria-label={`Cantidad actual de ${item.title}`}
          />

          <button
            type="button"
            onClick={increase}
            disabled={reachedStockLimit}
            aria-label={`Aumentar cantidad de ${item.title}`}
          >
            +
          </button>
        </div>

        <p className="cart-item__line-total">{formatMoney(lineTotal)}</p>

        <button
          type="button"
          className="cart-item__remove"
          onClick={() => onRemove(item.id)}
        >
          Quitar
        </button>
      </div>
    </article>
  );
}