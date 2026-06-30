function createCartController({ service }) {
  return {
    getCart: async (req, res) => {
      const cart = await service.getCart(req.params.cartId);
      return res.status(200).json(cart);
    },

    addItem: async (req, res) => {
      const cart = await service.addItem(req.params.cartId, req.body || {});
      return res.status(200).json(cart);
    },

    updateItemQuantity: async (req, res) => {
      const cart = await service.updateItemQuantity(
        req.params.cartId,
        req.params.productId,
        req.body || {}
      );
      return res.status(200).json(cart);
    },

    removeItem: async (req, res) => {
      const cart = await service.removeItem(req.params.cartId, req.params.productId);
      return res.status(200).json(cart);
    },

    clearCart: async (req, res) => {
      const cart = await service.clearCart(req.params.cartId);
      return res.status(200).json(cart);
    },
  };
}

module.exports = {
  createCartController,
};