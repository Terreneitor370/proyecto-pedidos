import React, { useState } from 'react';
import './splash.css';

const ErrorScreen = ({ error, onRetry }) => {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    try {
      setRetrying(true);
      await onRetry();
      setRetrying(false);
    } catch (err) {
      console.error('Error en reintento:', err);
      setRetrying(false);
    }
  };

  return (
    <div className="error-container">
      <div className="error-content">
        <h2>¡Oops! Algo salió mal</h2>
        <p className="error-message">
          {error || 'No pudimos cargar los productos'}
        </p>

        <div className="error-details">
          <p>Posibles soluciones:</p>
          <ul>
            <li>Verifica tu conexión a internet</li>
            <li>La API podría estar temporalmente caída</li>
            <li>Intenta nuevamente más tarde</li>
          </ul>
        </div>

        <button
          className="retry-button"
          onClick={handleRetry}
          disabled={retrying}
        >
          {retrying ? 'Reintentando...' : 'Reintentar'}
        </button>
      </div>
    </div>
  );
};

export default ErrorScreen;
