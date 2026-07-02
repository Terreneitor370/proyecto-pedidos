function createCheckoutController({ service }) {
  return {
    checkout: async (req, res) => {
      const result = await service.processCheckout(req.body || {});
      return res.status(201).json(result);
    },

    getOrder: async (req, res) => {
      const order = await service.getOrder(req.params.orderId);
      return res.status(200).json(order);
    },

    listOrdersByUser: async (req, res) => {
      const result = await service.listOrdersByUser(req.params.userId);
      return res.status(200).json(result);
    },
  };
}

module.exports = {
  createCheckoutController,
};