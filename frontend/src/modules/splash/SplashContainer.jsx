import React, { useState, useEffect } from 'react';
import { useProducts } from '../../shared/context/ProductsContext';
import SplashScreen from './SplashScreen';
import LoadingScreen from './LoadingScreen';
import ErrorScreen from './ErrorScreen';
import './splash.css';

const SplashContainer = ({ children }) => {
  const [showSplash, setShowSplash] = useState(true);
  const { loading, error, reloadProducts } = useProducts();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  if (error) {
    return <ErrorScreen error={error} onRetry={reloadProducts} />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return children;
};

export default SplashContainer;