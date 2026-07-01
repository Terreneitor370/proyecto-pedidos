import React, { useState, useEffect } from 'react';
import './splash.css';

const LoadingScreen = () => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-container">
      <div className="loading-content">
        <div className="loading-icon">📦</div>
        <h2>Cargando productos{dots}</h2>
        <div className="spinner-container">
          <div className="spinner" />
          <div className="spinner-delayed" />
        </div>
        <p className="loading-hint">Esto puede tomar unos segundos</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
