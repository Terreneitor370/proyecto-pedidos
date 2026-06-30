-- ============================================
-- Esquema de base de datos: proyecto_pedidos
-- ============================================

CREATE DATABASE IF NOT EXISTS proyecto_pedidos;
USE proyecto_pedidos;

-- Tabla de stock (sincronizada con IDs de FakeStore API, productos 1-20)
CREATE TABLE IF NOT EXISTS stock (
  product_id INT PRIMARY KEY,
  quantity   INT NOT NULL DEFAULT 0
);

-- Tabla de órdenes
CREATE TABLE IF NOT EXISTS orders (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  total      DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de items por orden (snapshot de precio al momento de compra)
CREATE TABLE IF NOT EXISTS order_items (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  order_id          INT NOT NULL,
  product_id        INT NOT NULL,
  title             VARCHAR(255) NOT NULL,
  price_at_purchase DECIMAL(10, 2) NOT NULL,
  quantity          INT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
