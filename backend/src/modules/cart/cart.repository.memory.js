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

  async clear(cartId) {
    this.carts.delete(cartId);
  }
}

module.exports = {
  InMemoryCartRepository,
};