const { ValidationError } = require("./cart.errors");

function assertCartId(cartId) {
  if (typeof cartId !== "string" || cartId.trim().length === 0) {
    throw new ValidationError("cartId es obligatorio y debe ser un string no vacio");
  }
}

function assertProductId(productId) {
  const parsedId = Number(productId);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new ValidationError("productId debe ser un entero positivo");
  }
  return parsedId;
}

function assertUserId(userId) {
  const parsedUserId = Number(userId);
  if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
    throw new ValidationError("userId debe ser un entero positivo");
  }
  return parsedUserId;
}

function assertQuantity(quantity, { allowZero = false } = {}) {
  const parsedQuantity = Number(quantity);
  const validNumber = Number.isInteger(parsedQuantity);
  const validRange = allowZero ? parsedQuantity >= 0 : parsedQuantity > 0;

  if (!validNumber || !validRange) {
    const message = allowZero
      ? "quantity debe ser un entero mayor o igual a 0"
      : "quantity debe ser un entero mayor a 0";
    throw new ValidationError(message);
  }

  return parsedQuantity;
}

function assertUnitPrice(unitPrice) {
  const parsedPrice = Number(unitPrice);
  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    throw new ValidationError("unitPrice debe ser un numero mayor o igual a 0");
  }
  return roundMoney(parsedPrice);
}

function assertTitle(title) {
  if (typeof title !== "string" || title.trim().length === 0) {
    throw new ValidationError("title es obligatorio y debe ser un string no vacio");
  }
  return title.trim();
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

module.exports = {
  assertCartId,
  assertProductId,
  assertUserId,
  assertQuantity,
  assertUnitPrice,
  assertTitle,
  roundMoney,
};