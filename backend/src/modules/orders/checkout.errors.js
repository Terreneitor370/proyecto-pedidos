class CheckoutError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
  }
}

class ValidationError extends CheckoutError {
  constructor(message, details = null) {
    super(message, 400, details);
  }
}

class UnauthorizedError extends CheckoutError {
  constructor(message, details = null) {
    super(message, 401, details);
  }
}

class NotFoundError extends CheckoutError {
  constructor(message, details = null) {
    super(message, 404, details);
  }
}

class StockUnavailableError extends CheckoutError {
  constructor(message, details = null) {
    super(message, 409, details);
  }
}

class PaymentError extends CheckoutError {
  constructor(message, details = null) {
    super(message, 402, details);
  }
}

class IntegrationError extends CheckoutError {
  constructor(message, details = null) {
    super(message, 500, details);
  }
}

function toHttpErrorPayload(error) {
  const statusCode = error.statusCode || 500;
  const payload = {
    error: {
      code: error.name || "InternalServerError",
      message: error.message || "Error interno del servidor",
    },
  };

  if (error.details) {
    payload.error.details = error.details;
  }

  return { statusCode, payload };
}

module.exports = {
  CheckoutError,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  StockUnavailableError,
  PaymentError,
  IntegrationError,
  toHttpErrorPayload,
};