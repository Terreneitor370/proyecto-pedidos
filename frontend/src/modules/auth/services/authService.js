const USERS_API_URL = "https://dummyjson.com/users";

/**
 * Busca un usuario por nombre en DummyJSON (async/await).
 * @param {string} username
 * @returns {Promise<object|null>}
 */
export async function findUserByUsername(username) {
  const normalized = username.trim().toLowerCase();

  if (!normalized) {
    throw new Error("El nombre de usuario es obligatorio.");
  }

  const response = await fetch(
    `${USERS_API_URL}/search?q=${encodeURIComponent(normalized)}`
  );

  if (!response.ok) {
    throw new Error(`No se pudo consultar usuarios (HTTP ${response.status}).`);
  }

  const data = await response.json();
  const users = Array.isArray(data.users) ? data.users : [];

  return (
    users.find((user) => user.username?.toLowerCase() === normalized) ?? null
  );
}

/**
 * Inicia sesión validando usuario y contraseña contra DummyJSON.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<object>}
 */
export async function loginWithCredentials(username, password) {
  if (!password?.trim()) {
    throw new Error("La contraseña es obligatoria.");
  }

  const user = await findUserByUsername(username);

  if (!user) {
    throw new Error("Usuario no encontrado. Verifica el nombre e intenta de nuevo.");
  }

  if (user.password !== password) {
    throw new Error("Contraseña incorrecta. Intenta de nuevo.");
  }

  const { password: _removed, ...safeUser } = user;
  return safeUser;
}