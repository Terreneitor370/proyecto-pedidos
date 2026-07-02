-- ============================================
-- Seed: stock inicial para los 20 productos de FakeStore API
-- Ejecutar en phpMyAdmin o MySQL Workbench
-- ============================================

USE proyecto_pedidos;

INSERT INTO stock (product_id, quantity) VALUES
  (1,  15),
  (2,  30),
  (3,  12),
  (4,  25),
  (5,   8),
  (6,   5),
  (7,  20),
  (8,  18),
  (9,   7),
  (10, 10),
  (11, 14),
  (12,  6),
  (13,  3),
  (14,  2),
  (15, 22),
  (16, 17),
  (17, 11),
  (18, 35),
  (19, 40),
  (20, 28)
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity);
