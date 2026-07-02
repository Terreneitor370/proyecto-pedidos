import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

console.log('Conectando a MySQL con:');
console.log('Host:', process.env.DB_HOST);
console.log('Port:', process.env.DB_PORT);
console.log('User:', process.env.DB_USER);
console.log('Database:', process.env.DB_NAME);

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3307,  // ← IMPORTANTE: parsear a número
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'proyecto_pedidos',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;