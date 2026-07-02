const { IntegrationError } = require("./checkout.errors");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

class InMemoryOrderRepository {
  constructor() {
    this.orders = new Map();
  }

  async save(order) {
    this.orders.set(order.orderId, clone(order));
    return this.getById(order.orderId);
  }

  async getById(orderId) {
    const order = this.orders.get(orderId);
    return order ? clone(order) : null;
  }

  async listByUserId(userId) {
    const orders = [];

    for (const order of this.orders.values()) {
      if (Number(order.user.id) === Number(userId)) {
        orders.push(clone(order));
      }
    }

    return orders.sort((a, b) => {
      if (a.createdAt < b.createdAt) {
        return 1;
      }
      if (a.createdAt > b.createdAt) {
        return -1;
      }
      return 0;
    });
  }
}

class InMemoryCartGateway {
  constructor() {
    this.carts = new Map();
  }

  async getCart({ cartId }) {
    const cart = this.carts.get(cartId);

    if (!cart) {
      throw new IntegrationError("Carrito no encontrado en InMemoryCartGateway", { cartId });
    }

    return clone(cart);
  }

  async clearCart({ cartId }) {
    this.carts.set(cartId, {
      cartId,
      items: [],
    });
  }

  async seedCart(cart) {
    if (!cart || typeof cart !== "object" || !Array.isArray(cart.items)) {
      throw new IntegrationError("Cart invalido para seedCart");
    }

    this.carts.set(cart.cartId, clone(cart));
  }
}

class InMemoryStockGateway {
  constructor() {
    this.stockByProductId = new Map();
  }

  async checkAvailability({ productId, quantity }) {
    const available = Number(this.stockByProductId.get(productId) || 0);
    return {
      available: available >= quantity,
      availableQuantity: available,
    };
  }

  async decrementStock({ productId, quantity }) {
    const current = Number(this.stockByProductId.get(productId) || 0);

    if (current < quantity) {
      throw new IntegrationError("Stock insuficiente al decrementar", {
        productId,
        requested: quantity,
        available: current,
      });
    }

    this.stockByProductId.set(productId, current - quantity);
  }

  async seedStock(productId, quantity) {
    this.stockByProductId.set(Number(productId), Number(quantity));
  }
}

module.exports = {
  InMemoryOrderRepository,
  InMemoryCartGateway,
  InMemoryStockGateway,
};