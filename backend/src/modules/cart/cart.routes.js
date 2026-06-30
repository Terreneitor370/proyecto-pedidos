const express = require("express");
const { toHttpErrorPayload } = require("./cart.errors");

function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

function createCartRouter({ controller }) {
  const router = express.Router();

  router.get("/:cartId", asyncHandler(controller.getCart));
  router.post("/:cartId/items", asyncHandler(controller.addItem));
  router.patch("/:cartId/items/:productId", asyncHandler(controller.updateItemQuantity));
  router.delete("/:cartId/items/:productId", asyncHandler(controller.removeItem));
  router.delete("/:cartId", asyncHandler(controller.clearCart));

  router.use((error, req, res, next) => {
    const { statusCode, payload } = toHttpErrorPayload(error);
    res.status(statusCode).json(payload);
  });

  return router;
}

module.exports = {
  createCartRouter,
};