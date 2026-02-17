import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createConnection(process.env.MYSQL_URL);

db.connect((err) => {
  if (err) {
    console.error("Error MySQL:", err);
    process.exit(1);
  }
  console.log("MySQL conectado");
});

export default db;
