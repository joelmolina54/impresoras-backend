// src/config/db.js
import mysql from 'mysql2';  // o 'mysql2/promise' si quieres async/await en todos lados

const dbConfig = process.env.DATABASE_URL 
  ? process.env.DATABASE_URL   // ← Railway lo usa directamente
  : {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'tu_base_local',
    };

// Usa createPool (mejor para producción: maneja conexiones automáticas)
const db = mysql.createPool(dbConfig);

db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Error al crear el pool de conexión a MySQL:', err.message);
    return;
  }
  console.log('✅ Pool de conexión a MySQL creado exitosamente');
  if (connection) connection.release(); // Libera la conexión de prueba
});

export default db;