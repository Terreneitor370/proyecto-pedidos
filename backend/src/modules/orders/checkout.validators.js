const { ValidationError } = require("./checkout.errors");

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function assertString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(`${fieldName} es obligatorio y debe ser un string no vacio`);
  }
  return value.trim();
}

function assertPositiveInteger(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError(`${fieldName} debe ser un entero positivo`);
  }
  return parsed;
}

function assertCartId(cartId) {
  return assertString(cartId, "cartId");
}

function assertUserId(userId) {
  return assertPositiveInteger(userId, "userId");
}

function normalizeUser(input) {
  if (!input || typeof input !== "object") {
    throw new ValidationError("El usuario autenticado es obligatorio para checkout");
  }

  const id = assertUserId(input.id || input.userId);
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim() : "";

  return {
    id,
    name,
    email,
  };
}

function normalizeCartItem(item, index) {
  if (!item || typeof item !== "object") {
    throw new ValidationError("Item de carrito invalido", { index });
  }

  const productId = assertPositiveInteger(item.productId, "productId");
  const quantity = assertPositiveInteger(item.quantity, "quantity");
  const title = assertString(item.title, "title");
  const unitPriceNumber = Number(item.unitPrice);

  if (!Number.isFinite(unitPriceNumber) || unitPriceNumber < 0) {
    throw new ValidationError("unitPrice debe ser un numero mayor o igual a 0", { index });
  }

  const unitPrice = roundMoney(unitPriceNumber);

  return {
    productId,
    title,
    quantity,
    unitPrice,
    lineTotal: roundMoney(unitPrice * quantity),
  };
}

function normalizeCartItems(items) {
  if (!Array.isArray(items)) {
    throw new ValidationError("items debe ser un arreglo");
  }

  if (items.length === 0) {
    throw new ValidationError("El carrito esta vacio");
  }

  return items.map((item, index) => normalizeCartItem(item, index));
}

module.exports = {
  roundMoney,
  assertString,
  assertPositiveInteger,
  assertCartId,
  assertUserId,
  normalizeUser,
  normalizeCartItems,
};