import { useAuth } from "../hooks/useAuth.js";

export default function LoginStatus() {
  const { user, logout, isLoading } = useAuth();

  if (!user) return null;

  const displayName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.username;

  return (
    <div className="auth-status">
      <div className="auth-status__info">
        {user.image ? (
          <img
            className="auth-status__avatar"
            src={user.image}
            alt={`Avatar de ${displayName}`}
          />
        ) : null}
        <div>
          <p className="auth-status__label">Sesión activa</p>
          <p className="auth-status__name">{displayName}</p>
          <p className="auth-status__username">@{user.username}</p>
        </div>
      </div>
      <button
        type="button"
        className="auth-status__logout"
        onClick={() => logout()}
        disabled={isLoading}
      >
        Cerrar sesión
      </button>
    </div>
  );
}