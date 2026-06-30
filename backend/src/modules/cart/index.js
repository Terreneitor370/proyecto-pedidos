const { CartService } = require("./cart.service");
const { createCartController } = require("./cart.controller");
const { createCartRouter } = require("./cart.routes");
const { InMemoryCartRepository } = require("./cart.repository.memory");

function createCartModule({
  repository = new InMemoryCartRepository(),
  stockGateway = null,
  discountPolicy = null,
  taxRate = 0.16,
} = {}) {
  const service = new CartService({
    repository,
    stockGateway,
    discountPolicy,
    taxRate,
  });

  const controller = createCartController({ service });
  const router = createCartRouter({ controller });

  return {
    router,
    service,
    repository,
  };
}

module.exports = {
  createCartModule,
  CartService,
  InMemoryCartRepository,
};