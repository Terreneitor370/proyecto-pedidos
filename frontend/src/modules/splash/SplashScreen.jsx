import React, { useState, useEffect } from 'react';
import './splash.css';

const SplashScreen = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const animateProgress = async () => {
      try {
        for (let i = 0; i <= 100; i += 5) {
          await new Promise(resolve => setTimeout(resolve, 80));
          setProgress(i);
        }
      } catch (error) {
        console.error('Error en animación:', error);
      }
    };

    animateProgress();
  }, []);

  return (
    <div className="splash-container">
      <div className="splash-content">
        <div className="splash-logo">
          <span className="logo-emoji">🍔</span>
          <h1>Fast Food</h1>
        </div>
        <p className="splash-subtitle">Sistema de Pedidos</p>
        
        <div className="splash-progress">
          <div 
            className="progress-bar" 
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <p className="splash-status">
          {progress < 30 && 'Inicializando...'}
          {progress >= 30 && progress < 60 && 'Preparando todo...'}
          {progress >= 60 && progress < 90 && 'Cargando productos...'}
          {progress >= 90 && '¡Casi listo!'}
        </p>
        
        <div className="splash-loader">
          <div className="loader" />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;