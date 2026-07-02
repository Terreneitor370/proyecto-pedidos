import { useState } from "react";
import { useAuth } from "../hooks/useAuth.js";

const DEMO_USERS = [
  { username: "emilys", password: "emilyspass" },
  { username: "michaelw", password: "michaelwpass" },
  { username: "sophiab", password: "sophiabpass" },
];

export default function LoginForm() {
  const { login, isLoading, error, clearError } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const canSubmit = username.trim() && password.trim();

  const handleSubmit = async (event) => {
    event.preventDefault();
    clearError();

    try {
      await login(username, password);
      setUsername("");
      setPassword("");
    } catch {
      // El error ya queda en el contexto.
    }
  };

  const fillDemo = (demoUser) => {
    clearError();
    setUsername(demoUser.username);
    setPassword(demoUser.password);
  };

  return (
    <div className="auth-page">
      <div className="auth-page__glow auth-page__glow--left" aria-hidden="true" />
      <div className="auth-page__glow auth-page__glow--right" aria-hidden="true" />

      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-panel__brand">
          <span className="auth-panel__logo" aria-hidden="true">
            🍔
          </span>
          <div>
            <p className="auth-panel__eyebrow">Fast Food · Pedidos</p>
            <h1 id="auth-title" className="auth-panel__title">
              Bienvenido
            </h1>
          </div>
        </div>

        <p className="auth-panel__subtitle">
          Inicia sesión para ver el menú, agregar al carrito y finalizar tu pedido.
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-form__field">
            <label className="auth-form__label" htmlFor="username">
              Usuario
            </label>
            <input
              id="username"
              name="username"
              type="text"
              className="auth-form__input"
              placeholder="Ej: emilys"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              disabled={isLoading}
              required
            />
          </div>

          <div className="auth-form__field">
            <label className="auth-form__label" htmlFor="password">
              Contraseña
            </label>
            <div className="auth-form__password-wrap">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                className="auth-form__input auth-form__input--password"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className="auth-form__toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                tabIndex={-1}
              >
                {showPassword ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>

          {error ? (
            <div className="auth-form__error" role="alert">
              <span className="auth-form__error-icon" aria-hidden="true">
                !
              </span>
              <p>{error}</p>
            </div>
          ) : null}

          <button
            type="submit"
            className="auth-form__button"
            disabled={isLoading || !canSubmit}
          >
            {isLoading ? (
              <>
                <span className="auth-form__spinner" aria-hidden="true" />
                Validando credenciales...
              </>
            ) : (
              "Iniciar sesión"
            )}
          </button>
        </form>

        <div className="auth-panel__demo">
          <p className="auth-panel__demo-title">Cuentas de prueba</p>
          <div className="auth-panel__demo-list">
            {DEMO_USERS.map((demo) => (
              <button
                key={demo.username}
                type="button"
                className="auth-panel__demo-chip"
                onClick={() => fillDemo(demo)}
                disabled={isLoading}
              >
                <strong>{demo.username}</strong>
                <span>{demo.password}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}