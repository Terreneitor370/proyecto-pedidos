import React, { useState, useEffect } from 'react';
import './splash.css';

const LoadingScreen = () => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const animateDots = async () => {
      while (true) {
        await new Promise(resolve => setTimeout(resolve, 400));
        setDots(prev => {
          if (prev.length >= 3) return '';
          return prev + '.';
        });
      }
    };

    animateDots();
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