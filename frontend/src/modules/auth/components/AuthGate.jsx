import LoginForm from "./LoginForm.jsx";
import { useAuth } from "../hooks/useAuth.js";

export default function AuthGate({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="auth-page auth-page--loading">
        <div className="auth-loading" role="status">
          <span className="auth-form__spinner auth-form__spinner--large" aria-hidden="true" />
          <p>Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return children;
}