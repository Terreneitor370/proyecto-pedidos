import React from 'react';
import { useProducts } from '../../shared/context/ProductsContext';

const ProductGrid = () => {
  const { products, loading, error } = useProducts();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <p>⏳ Cargando productos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
        <p>❌ Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 0' }}>
      <h2 style={{ marginBottom: '20px' }}>
        🛒 Productos disponibles ({products.length})
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        {products.map(product => (
          <div
            key={product.id}
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '15px',
              textAlign: 'center',
              backgroundColor: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              transition: 'transform 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <img
              src={product.image}
              alt={product.title}
              style={{
                width: '120px',
                height: '120px',
                objectFit: 'contain',
                marginBottom: '10px'
              }}
            />
            <h4 style={{
              fontSize: '14px',
              margin: '10px 0',
              height: '40px',
              overflow: 'hidden'
            }}>
              {product.title.substring(0, 40)}...
            </h4>
            <p style={{ fontWeight: 'bold', fontSize: '18px', color: '#ff6b35' }}>
              ${product.price}
            </p>
            <p style={{
              fontSize: '13px',
              color: product.stock > 0 ? '#4CAF50' : '#f44336',
              fontWeight: 'bold'
            }}>
              {product.stock > 0 ? `✅ Stock: ${product.stock}` : '❌ Sin stock'}
            </p>
            <button
              style={{
                backgroundColor: product.stock > 0 ? '#ff6b35' : '#ccc',
                color: 'white',
                border: 'none',
                padding: '8px 20px',
                borderRadius: '4px',
                cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
                marginTop: '10px',
                width: '100%'
              }}
              disabled={product.stock === 0}
            >
              {product.stock > 0 ? '🛒 Agregar al carrito' : '❌ Agotado'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;