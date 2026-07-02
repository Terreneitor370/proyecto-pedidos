const CART_PREFIX = "fastfood_cart_user_";

function getCartKey(userId) {
  return `${CART_PREFIX}${userId}`;
}

export function loadUserCart(userId) {
  if (!userId) return [];

  const raw = localStorage.getItem(getCartKey(userId));
  if (!raw) return [];

  try {
    const items = JSON.parse(raw);
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export function saveUserCart(userId, items) {
  if (!userId) return;
  localStorage.setItem(getCartKey(userId), JSON.stringify(items));
}