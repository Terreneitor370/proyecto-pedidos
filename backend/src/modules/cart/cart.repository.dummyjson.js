const { ExternalServiceError, ValidationError } = require("./cart.errors");
const { assertProductId, assertQuantity, assertUserId, roundMoney } = require("./cart.validators");

class DummyJsonCartRepository {
  constructor({
    baseUrl = "https://dummyjson.com",
    fetchImpl = globalThis.fetch,
    timeoutMs = 10000,
    defaultUserId = 1,
  } = {}) {
    if (typeof fetchImpl !== "function") {
      throw new ExternalServiceError("fetch no esta disponible para consumir DummyJSON");
    }

    this.baseUrl = String(baseUrl).replace(/\/+$/, "");
    this.fetchImpl = fetchImpl;
    this.timeoutMs = Number(timeoutMs) || 10000;
    this.defaultUserId = Number(defaultUserId) || 1;
  }

  async getById(cartId) {
    const normalizedCartId = this.#normalizeCartId(cartId);
    const cart = await this.#request({
      method: "GET",
      path: `/carts/${normalizedCartId}`,
      allowNotFound: true,
    });

    if (!cart) {
      return null;
    }

    return this.#toInternalCart(cart);
  }

  async create({ userId = this.defaultUserId, items = [] } = {}) {
    const products = this.#toDummyProducts(items);
    const body = {
      userId: assertUserId(userId),
      products,
    };

    const created = await this.#request({
      method: "POST",
      path: "/carts/add",
      body,
    });

    return this.#toInternalCart(created);
  }

  async save(cart) {
    const normalizedCartId = this.#normalizeCartId(cart.cartId);
    const body = {
      merge: true,
      products: this.#toDummyProducts(cart.items || []),
    };

    const updated = await this.#request({
      method: "PUT",
      path: `/carts/${normalizedCartId}`,
      body,
    });

    return this.#toInternalCart(updated);
  }

  async clear(cartId) {
    const normalizedCartId = this.#normalizeCartId(cartId);
    await this.#request({
      method: "DELETE",
      path: `/carts/${normalizedCartId}`,
      allowNotFound: true,
    });
  }

  #normalizeCartId(cartId) {
    const normalizedCartId = Number(cartId);
    if (!Number.isInteger(normalizedCartId) || normalizedCartId <= 0) {
      throw new ValidationError("cartId debe ser un entero positivo para DummyJSON", { cartId });
    }
    return normalizedCartId;
  }

  #toDummyProducts(items) {
    if (!Array.isArray(items)) {
      return [];
    }

    return items.map((item) => ({
      id: assertProductId(item.productId),
      quantity: assertQuantity(item.quantity),
    }));
  }

  #toInternalCart(remoteCart) {
    const remoteProducts = Array.isArray(remoteCart.products) ? remoteCart.products : [];

    return {
      cartId: String(remoteCart.id),
      userId: Number(remoteCart.userId) || null,
      items: remoteProducts
        .map((product) => ({
          productId: Number(product.id),
          title:
            typeof product.title === "string" && product.title.trim().length > 0
              ? product.title.trim()
              : `Producto ${product.id}`,
          unitPrice: roundMoney(Number(product.price) || 0),
          quantity: Number(product.quantity) || 0,
        }))
        .filter((item) => item.quantity > 0),
    };
  }

  async #request({ method, path, body = undefined, allowNotFound = false }) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (allowNotFound && response.status === 404) {
        return null;
      }

      const responseBody = await this.#readJson(response);
      if (!response.ok) {
        throw new ExternalServiceError("Error al consumir DummyJSON carts", {
          status: response.status,
          path,
          response: responseBody,
        });
      }

      return responseBody;
    } catch (error) {
      if (error instanceof ExternalServiceError) {
        throw error;
      }

      if (error && error.name === "AbortError") {
        throw new ExternalServiceError("Tiempo de espera agotado al consumir DummyJSON carts", {
          path,
          timeoutMs: this.timeoutMs,
        });
      }

      throw new ExternalServiceError("Fallo de red al consumir DummyJSON carts", {
        path,
        cause: error.message,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  async #readJson(response) {
    try {
      return await response.json();
    } catch (_error) {
      return null;
    }
  }
}

module.exports = {
  DummyJsonCartRepository,
};