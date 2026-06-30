const { NotFoundError, ValidationError } = require("./cart.errors");
const {
  assertCartId,
  assertProductId,
  assertUserId,
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
    const cart = await this.repository.getById(cartId);
    if (!cart) {
      throw new NotFoundError("El carrito no existe", { cartId });
    }
    return this.#toResponse(cart);
  }

  async addItem(cartId, payload) {
    assertCartId(cartId);
    const productId = assertProductId(payload.productId);
    const quantity = assertQuantity(payload.quantity);
    const userId =
      payload.userId === undefined || payload.userId === null ? null : assertUserId(payload.userId);
    const title =
      payload.title === undefined || payload.title === null ? null : assertTitle(payload.title);
    const unitPrice =
      payload.unitPrice === undefined || payload.unitPrice === null
        ? null
        : assertUnitPrice(payload.unitPrice);

    if (this.stockGateway && typeof this.stockGateway.ensureAvailable === "function") {
      await this.stockGateway.ensureAvailable({ productId, quantity });
    }

    let cart = await this.repository.getById(cartId);
    if (!cart) {
      if (typeof this.repository.create !== "function") {
        throw new NotFoundError("El carrito no existe", { cartId });
      }

      if (!userId) {
        throw new ValidationError(
          "El carrito no existe en DummyJSON. Envia userId para crearlo al agregar el primer item",
          { cartId }
        );
      }

      cart = await this.repository.create({
        userId,
        items: [
          {
            productId,
            quantity,
            title: title || `Producto ${productId}`,
            unitPrice: unitPrice === null ? 0 : unitPrice,
          },
        ],
      });

      return this.#toResponse(cart);
    }

    const existingItem = cart.items.find((item) => item.productId === productId);

    if (existingItem) {
      const nextQuantity = existingItem.quantity + quantity;
      if (this.stockGateway && typeof this.stockGateway.ensureAvailable === "function") {
        await this.stockGateway.ensureAvailable({ productId, quantity: nextQuantity });
      }

      existingItem.quantity = nextQuantity;
      if (unitPrice !== null) {
        existingItem.unitPrice = unitPrice;
      }
      if (title !== null) {
        existingItem.title = title;
      }
    } else {
      cart.items.push({
        productId,
        title: title || `Producto ${productId}`,
        unitPrice: unitPrice === null ? 0 : unitPrice,
        quantity,
      });
    }

    if (userId && !cart.userId) {
      cart.userId = userId;
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

      if (cart.items.length === 0) {
        await this.repository.clear(cartId);
        return this.#toResponse({ cartId: String(cartId), items: [] });
      }
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

    if (cart.items.length === 0) {
      await this.repository.clear(cartId);
      return this.#toResponse({ cartId: String(cartId), items: [] });
    }

    const saved = await this.repository.save(cart);
    return this.#toResponse(saved);
  }

  async clearCart(cartId) {
    assertCartId(cartId);
    await this.repository.clear(cartId);
    return this.#toResponse({ cartId: String(cartId), items: [] });
  }

  async #getExistingCart(cartId) {
    const existing = await this.repository.getById(cartId);
    if (!existing) {
      throw new NotFoundError("El carrito no existe", { cartId });
    }
    return existing;
  }

  async #toResponse(cart) {
    const sourceItems = Array.isArray(cart.items) ? cart.items : [];
    const items = sourceItems.map((item) => {
      const normalizedPrice = roundMoney(Number(item.unitPrice) || 0);
      const normalizedQuantity = Number(item.quantity) || 0;

      return {
        productId: Number(item.productId),
        title:
          typeof item.title === "string" && item.title.trim().length > 0
            ? item.title.trim()
            : `Producto ${item.productId}`,
        unitPrice: normalizedPrice,
        quantity: normalizedQuantity,
        lineTotal: roundMoney(normalizedPrice * normalizedQuantity),
      };
    });

    const subtotal = roundMoney(items.reduce((acc, item) => acc + item.lineTotal, 0));
    const discountRaw = await this.discountPolicy.calculate({
      cartId: String(cart.cartId),
      userId: cart.userId || null,
      items,
      subtotal,
    });
    const discount = roundMoney(Math.max(0, Number(discountRaw) || 0));
    const taxableAmount = roundMoney(Math.max(0, subtotal - discount));
    const tax = roundMoney(taxableAmount * this.taxRate);
    const total = roundMoney(taxableAmount + tax);
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

    return {
      cartId: String(cart.cartId),
      userId: cart.userId || null,
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