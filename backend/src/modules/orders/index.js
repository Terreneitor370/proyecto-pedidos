const { CheckoutService } = require("./checkout.service");
const { createCheckoutController } = require("./checkout.controller");
const { createCheckoutRouter } = require("./checkout.routes");
const {
  InMemoryOrderRepository,
  InMemoryCartGateway,
  InMemoryStockGateway,
} = require("./checkout.adapters.memory");

function createOrdersModule({
  orderRepository = new InMemoryOrderRepository(),
  cartGateway = new InMemoryCartGateway(),
  stockGateway = new InMemoryStockGateway(),
  authGateway = null,
  paymentGateway = null,
  discountPolicy = null,
  taxRate = 0.16,
} = {}) {
  const service = new CheckoutService({
    orderRepository,
    cartGateway,
    stockGateway,
    authGateway,
    paymentGateway,
    discountPolicy,
    taxRate,
  });

  const controller = createCheckoutController({ service });
  const router = createCheckoutRouter({ controller });

  return {
    router,
    service,
    gateways: {
      cartGateway,
      stockGateway,
    },
    orderRepository,
  };
}

module.exports = {
  createOrdersModule,
  CheckoutService,
  InMemoryOrderRepository,
  InMemoryCartGateway,
  InMemoryStockGateway,
};