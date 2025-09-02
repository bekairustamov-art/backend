import mysql from "mysql2/promise";

const poolConfig = {
  host: "localhost",
  port: 3306,
  database: "host7216_ecommerce",
  user: "host7216_ecommerse",
  password: "---bekzod---A1",
  ssl: false,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

export const pool = await mysql.createPool(poolConfig);
