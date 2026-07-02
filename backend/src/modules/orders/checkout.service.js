const crypto = require("crypto");
const {
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  StockUnavailableError,
  PaymentError,
  IntegrationError,
} = require("./checkout.errors");
const { roundMoney, assertCartId, assertUserId, normalizeUser, normalizeCartItems } = require("./checkout.validators");

class CheckoutService {
  constructor({
    orderRepository,
    cartGateway,
    stockGateway,
    authGateway = null,
    paymentGateway = null,
    discountPolicy = null,
    taxRate = 0.16,
    orderNumberGenerator = null,
    clock = () => new Date(),
  }) {
    this.orderRepository = orderRepository;
    this.cartGateway = cartGateway;
    this.stockGateway = stockGateway;
    this.authGateway = authGateway;
    this.paymentGateway = paymentGateway || {
      charge: async () => ({ status: "APPROVED", transactionId: `txn_${Date.now()}` }),
    };
    this.discountPolicy = discountPolicy || { calculate: async () => 0 };
    this.taxRate = Number(taxRate);
    this.clock = clock;
    this.orderNumberGenerator =
      orderNumberGenerator ||
      (() => {
        const stamp = this.clock().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
        const suffix = Math.floor(Math.random() * 9000 + 1000);
        return `ORD-${stamp}-${suffix}`;
      });
  }

  async processCheckout(payload = {}) {
    const cartId = assertCartId(payload.cartId);
    const user = await this.#resolveUser(payload);
    const cart = await this.#resolveCart(cartId, user);
    const items = normalizeCartItems(cart.items);

    await this.#validateStockAvailability(items);

    const summary = await this.#calculateSummary({
      user,
      cartId,
      items,
      couponCode: payload.couponCode || null,
    });

    const payment = await this.#chargePayment({
      amount: summary.total,
      currency: payload.currency || "MXN",
      payment: payload.payment || {},
      user,
      cartId,
    });

    const processingOrder = this.#buildOrder({
      cartId,
      user,
      items,
      summary,
      payment,
      status: "PROCESSING",
      metadata: payload.metadata || null,
    });

    await this.orderRepository.save(processingOrder);

    try {
      await this.#commitStock(items);
      await this.#clearCart(cartId, user);

      const confirmedOrder = {
        ...processingOrder,
        status: "CONFIRMED",
        confirmedAt: this.clock().toISOString(),
      };

      await this.orderRepository.save(confirmedOrder);
      return this.#toTicketResponse(confirmedOrder);
    } catch (error) {
      const failedOrder = {
        ...processingOrder,
        status: "FAILED",
        failureReason: error.message,
      };

      await this.orderRepository.save(failedOrder);

      throw new IntegrationError(
        "Checkout cobrado con error posterior de integracion. Revisar orden para compensacion manual.",
        {
          orderId: processingOrder.orderId,
          rootCause: error.message,
        }
      );
    }
  }

  async getOrder(orderId) {
    if (typeof orderId !== "string" || orderId.trim().length === 0) {
      throw new ValidationError("orderId es obligatorio");
    }

    const order = await this.orderRepository.getById(orderId.trim());
    if (!order) {
      throw new NotFoundError("Pedido no encontrado", { orderId });
    }

    return order;
  }

  async listOrdersByUser(userIdParam) {
    const userId = assertUserId(userIdParam);
    const orders = await this.orderRepository.listByUserId(userId);
    return {
      userId,
      count: orders.length,
      orders,
    };
  }

  async #resolveUser(payload) {
    if (this.authGateway && typeof this.authGateway.verifyCheckoutAccess === "function") {
      const authResult = await this.authGateway.verifyCheckoutAccess({
        authToken: payload.authToken || null,
        userId: payload.userId || payload.user?.id || payload.user?.userId || null,
      });

      if (!authResult || authResult.authorized === false) {
        throw new UnauthorizedError("Usuario no autorizado para checkout");
      }

      return normalizeUser(authResult.user || authResult);
    }

    if (payload.user) {
      return normalizeUser(payload.user);
    }

    if (payload.userId) {
      return normalizeUser({ userId: payload.userId });
    }

    throw new UnauthorizedError(
      "No se pudo autenticar el usuario para checkout. Proporciona user o configura authGateway."
    );
  }

  async #resolveCart(cartId, user) {
    if (!this.cartGateway || typeof this.cartGateway.getCart !== "function") {
      throw new IntegrationError("cartGateway.getCart no esta configurado");
    }

    const cart = await this.cartGateway.getCart({ cartId, userId: user.id });

    if (!cart || typeof cart !== "object") {
      throw new NotFoundError("Carrito no encontrado", { cartId });
    }

    if (!Array.isArray(cart.items)) {
      throw new IntegrationError("El carrito recibido no contiene items validos", { cartId });
    }

    return {
      cartId,
      items: cart.items,
    };
  }

  async #validateStockAvailability(items) {
    if (!this.stockGateway || typeof this.stockGateway.checkAvailability !== "function") {
      throw new IntegrationError("stockGateway.checkAvailability no esta configurado");
    }

    for (const item of items) {
      const result = await this.stockGateway.checkAvailability({
        productId: item.productId,
        quantity: item.quantity,
      });

      const unavailable =
        result === false ||
        (result && typeof result === "object" && result.available === false);

      if (unavailable) {
        const availableQuantity =
          result && typeof result === "object" && Number.isFinite(result.availableQuantity)
            ? result.availableQuantity
            : 0;

        throw new StockUnavailableError("Stock insuficiente para uno o mas productos", {
          productId: item.productId,
          requested: item.quantity,
          available: availableQuantity,
        });
      }
    }
  }

  async #calculateSummary({ user, cartId, items, couponCode }) {
    const subtotal = roundMoney(items.reduce((acc, item) => acc + item.lineTotal, 0));

    const discountRaw = await this.discountPolicy.calculate({
      user,
      cartId,
      items,
      subtotal,
      couponCode,
    });

    const discount = roundMoney(Math.max(0, Number(discountRaw) || 0));
    const taxableAmount = roundMoney(Math.max(0, subtotal - discount));
    const tax = roundMoney(taxableAmount * this.taxRate);
    const total = roundMoney(taxableAmount + tax);
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

    return {
      subtotal,
      discount,
      taxRate: this.taxRate,
      tax,
      total,
      itemCount,
      distinctItems: items.length,
    };
  }

  async #chargePayment({ amount, currency, payment, user, cartId }) {
    if (!this.paymentGateway || typeof this.paymentGateway.charge !== "function") {
      throw new IntegrationError("paymentGateway.charge no esta configurado");
    }

    const result = await this.paymentGateway.charge({
      amount,
      currency,
      payment,
      user,
      cartId,
    });

    if (!result || result.status !== "APPROVED") {
      throw new PaymentError("El pago fue rechazado", {
        amount,
        currency,
        reason: result?.reason || "UNKNOWN",
      });
    }

    return {
      status: result.status,
      transactionId: result.transactionId || `txn_${Date.now()}`,
      provider: result.provider || "mock",
    };
  }

  async #commitStock(items) {
    if (!this.stockGateway || typeof this.stockGateway.decrementStock !== "function") {
      throw new IntegrationError("stockGateway.decrementStock no esta configurado");
    }

    for (const item of items) {
      await this.stockGateway.decrementStock({
        productId: item.productId,
        quantity: item.quantity,
      });
    }
  }

  async #clearCart(cartId, user) {
    if (!this.cartGateway || typeof this.cartGateway.clearCart !== "function") {
      throw new IntegrationError("cartGateway.clearCart no esta configurado");
    }

    await this.cartGateway.clearCart({
      cartId,
      userId: user.id,
    });
  }

  #buildOrder({ cartId, user, items, summary, payment, status, metadata }) {
    const orderId = crypto.randomUUID();
    const createdAt = this.clock().toISOString();

    return {
      orderId,
      orderNumber: this.orderNumberGenerator(),
      cartId,
      status,
      createdAt,
      user,
      items: items.map((item) => ({
        productId: item.productId,
        title: item.title,
        quantity: item.quantity,
        priceAtPurchase: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
      summary,
      payment,
      metadata,
    };
  }

  #toTicketResponse(order) {
    return {
      ticket: {
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
        confirmedAt: order.confirmedAt || null,
        customer: order.user,
        items: order.items,
        summary: order.summary,
        payment: order.payment,
      },
    };
  }
}

module.exports = {
  CheckoutService,
};