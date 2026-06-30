const { NotFoundError } = require("./cart.errors");
const {
  assertCartId,
  assertProductId,
  assertQuantity,
  assertUnitPrice,
  assertTitle,
  roundMoney,
} = require("./cart.validators");

class CartService {
  constructor({ repository, stockGateway = null, discountPolicy = null, taxRate = 0.16 }) {
    this.repository = repository;
    this.stockGateway = stockGateway;
    this.discountPolicy = discountPolicy || { calculate: async () => 0 };
    this.taxRate = Number(taxRate);
  }

  async getCart(cartId) {
    assertCartId(cartId);
    const cart = await this.#getOrCreateCart(cartId);
    return this.#toResponse(cart);
  }

  async addItem(cartId, payload) {
    assertCartId(cartId);
    const productId = assertProductId(payload.productId);
    const quantity = assertQuantity(payload.quantity);
    const title = assertTitle(payload.title);
    const unitPrice = assertUnitPrice(payload.unitPrice);

    if (this.stockGateway && typeof this.stockGateway.ensureAvailable === "function") {
      await this.stockGateway.ensureAvailable({ productId, quantity });
    }

    const cart = await this.#getOrCreateCart(cartId);
    const existingItem = cart.items.find((item) => item.productId === productId);

    if (existingItem) {
      const nextQuantity = existingItem.quantity + quantity;
      if (this.stockGateway && typeof this.stockGateway.ensureAvailable === "function") {
        await this.stockGateway.ensureAvailable({ productId, quantity: nextQuantity });
      }

      existingItem.quantity = nextQuantity;
      existingItem.unitPrice = unitPrice;
      existingItem.title = title;
    } else {
      cart.items.push({
        productId,
        title,
        unitPrice,
        quantity,
      });
    }

    const saved = await this.repository.save(cart);
    return this.#toResponse(saved);
  }

  async updateItemQuantity(cartId, productIdParam, payload) {
    assertCartId(cartId);
    const productId = assertProductId(productIdParam);
    const quantity = assertQuantity(payload.quantity, { allowZero: true });

    const cart = await this.#getExistingCart(cartId);
    const targetItem = cart.items.find((item) => item.productId === productId);

    if (!targetItem) {
      throw new NotFoundError("El producto no existe en el carrito", { productId });
    }

    if (quantity === 0) {
      cart.items = cart.items.filter((item) => item.productId !== productId);
    } else {
      if (this.stockGateway && typeof this.stockGateway.ensureAvailable === "function") {
        await this.stockGateway.ensureAvailable({ productId, quantity });
      }
      targetItem.quantity = quantity;
    }

    const saved = await this.repository.save(cart);
    return this.#toResponse(saved);
  }

  async removeItem(cartId, productIdParam) {
    assertCartId(cartId);
    const productId = assertProductId(productIdParam);

    const cart = await this.#getExistingCart(cartId);
    const sizeBefore = cart.items.length;
    cart.items = cart.items.filter((item) => item.productId !== productId);

    if (cart.items.length === sizeBefore) {
      throw new NotFoundError("El producto no existe en el carrito", { productId });
    }

    const saved = await this.repository.save(cart);
    return this.#toResponse(saved);
  }

  async clearCart(cartId) {
    assertCartId(cartId);
    await this.repository.clear(cartId);
    return this.#toResponse({ cartId, items: [] });
  }

  async #getOrCreateCart(cartId) {
    const existing = await this.repository.getById(cartId);
    if (existing) {
      return existing;
    }
    return { cartId, items: [] };
  }

  async #getExistingCart(cartId) {
    const existing = await this.repository.getById(cartId);
    if (!existing) {
      throw new NotFoundError("El carrito no existe", { cartId });
    }
    return existing;
  }

  async #toResponse(cart) {
    const items = cart.items.map((item) => ({
      productId: item.productId,
      title: item.title,
      unitPrice: roundMoney(item.unitPrice),
      quantity: item.quantity,
      lineTotal: roundMoney(item.unitPrice * item.quantity),
    }));

    const subtotal = roundMoney(items.reduce((acc, item) => acc + item.lineTotal, 0));
    const discountRaw = await this.discountPolicy.calculate({ cartId: cart.cartId, items, subtotal });
    const discount = roundMoney(Math.max(0, Number(discountRaw) || 0));
    const taxableAmount = roundMoney(Math.max(0, subtotal - discount));
    const tax = roundMoney(taxableAmount * this.taxRate);
    const total = roundMoney(taxableAmount + tax);
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

    return {
      cartId: cart.cartId,
      items,
      summary: {
        subtotal,
        discount,
        taxRate: this.taxRate,
        tax,
        total,
        itemCount,
        distinctItems: items.length,
      },
    };
  }
}

module.exports = {
  CartService,
};