class InMemoryCartRepository {
  constructor() {
    this.carts = new Map();
  }

  async getById(cartId) {
    const cart = this.carts.get(cartId);
    if (!cart) {
      return null;
    }

    return {
      cartId: cart.cartId,
      items: cart.items.map((item) => ({ ...item })),
    };
  }

  async save(cart) {
    this.carts.set(cart.cartId, {
      cartId: cart.cartId,
      items: cart.items.map((item) => ({ ...item })),
    });

    return this.getById(cart.cartId);
  }

  async create({ cartId, userId = null, items = [] }) {
    const normalizedCartId =
      typeof cartId === "string" && cartId.trim().length > 0
        ? cartId.trim()
        : `local-${Date.now()}`;

    const cart = {
      cartId: normalizedCartId,
      userId,
      items: items.map((item) => ({ ...item })),
    };

    this.carts.set(normalizedCartId, cart);
    return this.getById(normalizedCartId);
  }

  async clear(cartId) {
    this.carts.delete(cartId);
  }
}

module.exports = {
  InMemoryCartRepository,
};