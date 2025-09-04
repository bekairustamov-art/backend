import mysql from "mysql2/promise";

const poolConfig = {
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  ssl: process.env.MYSQL_SSL === 'true',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

export async function getPool() {
  if (!pool) {
    pool = await mysql.createPool(poolConfig);
    
    // Test the connection
    try {
      const conn = await pool.getConnection();
      console.log('Database connection successful!');
      conn.release();
    } catch (err) {
      console.error('Database connection failed:', err);
      process.exit(1);
    }
  }
  return pool;
}
