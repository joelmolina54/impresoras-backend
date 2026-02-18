// src/config/db.js
import mysql from 'mysql2';

let db;

try {
  if (process.env.DATABASE_URL) {
    // Railway / producción: usa la URI completa directamente
    db = mysql.createPool(process.env.DATABASE_URL);
    console.log('✅ Usando DATABASE_URL de Railway (pool creado)');
  } else {
    // Local / fallback con variables separadas
    require('dotenv').config();
    db = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'tu_db_local',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 30000, // 30 segundos para conectar
    });
    console.log('✅ Pool creado en modo local');
  }

  // Test inmediato de conexión (no bloquea el startup)
  db.getConnection((err, connection) => {
    if (err) {
      console.error('❌ Error al probar pool de conexión:', err.message);
      console.error('Detalles:', err);
      return;
    }
    console.log('✅ Conexión probada OK desde el pool');
    connection.release();
  });

} catch (err) {
  console.error('🔥 Error fatal al crear el pool de MySQL:', err.message);
  console.error(err.stack);
  process.exit(1); // Salir explícitamente si falla la DB (mejor que crash sucio)
}

export default db;