const { CartService } = require("./cart.service");
const { createCartController } = require("./cart.controller");
const { createCartRouter } = require("./cart.routes");
const { InMemoryCartRepository } = require("./cart.repository.memory");
const { DummyJsonCartRepository } = require("./cart.repository.dummyjson");

function createCartModule({
  repository = new DummyJsonCartRepository(),
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
  DummyJsonCartRepository,
  InMemoryCartRepository,
};