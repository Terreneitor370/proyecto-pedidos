class CartError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
  }
}

class ValidationError extends CartError {
  constructor(message, details = null) {
    super(message, 400, details);
  }
}

class NotFoundError extends CartError {
  constructor(message, details = null) {
    super(message, 404, details);
  }
}

class ExternalServiceError extends CartError {
  constructor(message, details = null) {
    super(message, 502, details);
  }
}

function toHttpErrorPayload(error) {
  const statusCode = error.statusCode || 500;
  const payload = {
    error: {
      message: error.message || "Error interno del servidor",
      code: error.name || "InternalServerError",
    },
  };

  if (error.details) {
    payload.error.details = error.details;
  }

  return { statusCode, payload };
}

module.exports = {
  CartError,
  ValidationError,
  NotFoundError,
  ExternalServiceError,
  toHttpErrorPayload,
};