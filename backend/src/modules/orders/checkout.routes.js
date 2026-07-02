const express = require("express");
const { toHttpErrorPayload } = require("./checkout.errors");

function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

function createCheckoutRouter({ controller }) {
  const router = express.Router();

  router.post("/checkout", asyncHandler(controller.checkout));
  router.get("/orders/:orderId", asyncHandler(controller.getOrder));
  router.get("/users/:userId/orders", asyncHandler(controller.listOrdersByUser));

  router.use((error, req, res, next) => {
    const { statusCode, payload } = toHttpErrorPayload(error);
    res.status(statusCode).json(payload);
  });

  return router;
}

module.exports = {
  createCheckoutRouter,
};