import mysql from "mysql2/promise";

const {
  MYSQL_HOST = "localhost",
  MYSQL_PORT = 3306,
  MYSQL_DATABASE = "ecommerce",
  MYSQL_USER = "root",
  MYSQL_PASSWORD = "",
  DATABASE_URL,
  MYSQL_SSL
} = process.env;

const useSSL = String(MYSQL_SSL).toLowerCase() === "true";

let poolConfig;
if (DATABASE_URL) {
  // If using a connection string, pass it directly. SSL can be encoded in the URL if needed.
  poolConfig = DATABASE_URL;
} else {
  poolConfig = {
    host: MYSQL_HOST,
    port: Number(MYSQL_PORT),
    database: MYSQL_DATABASE,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    ssl: useSSL ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
}

console.log('Attempting to connect to MySQL with config:', {
  host: MYSQL_HOST,
  user: MYSQL_USER,
  database: MYSQL_DATABASE
});

export const pool = await mysql.createPool(poolConfig);
