import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const db = mysql.createConnection(process.env.MYSQL_URL);

db.connect((err) => {
  if (err) {
    console.error('Error de conexión:', err.message);
    return;
  }
  console.log('Conectado a MySQL en Railway');
});

export default db;