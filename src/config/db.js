import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS || '', // En caso de que esté vacía
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error('❌ Error de conexión a la base de datos:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos MySQL');
});

export default db;
