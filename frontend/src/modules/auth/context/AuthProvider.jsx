import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext.jsx";
import { loginWithCredentials } from "../services/authService.js";
import {
  clearSession,
  getSession,
  saveSession,
} from "../services/sessionService.js";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const restoreSession = async () => {
      const session = getSession();
      setUser(session?.user ?? null);
      setIsLoading(false);
    };

    restoreSession();
  }, []);

  const login = useCallback(async (username, password) => {
    setIsLoading(true);
    setError(null);

    try {
      const authenticatedUser = await loginWithCredentials(username, password);
      const session = saveSession(authenticatedUser);
      setUser(session.user);
      return session.user;
    } catch (loginError) {
      const message =
        loginError instanceof Error
          ? loginError.message
          : "No se pudo iniciar sesión.";
      setError(message);
      throw loginError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    clearSession();
    setUser(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      error,
      login,
      logout,
      clearError,
    }),
    [user, isLoading, error, login, logout, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}