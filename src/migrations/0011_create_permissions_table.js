export async function up(conn) {
  await conn.query(`CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    is_register TINYINT(1) DEFAULT 1,
    is_usual_order TINYINT(1) DEFAULT 1,
    is_wholesaler_order TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  // Insert default permission row
  await conn.query(`INSERT INTO permissions (is_register, is_usual_order, is_wholesaler_order) VALUES (1, 1, 1)`);
}

export async function down(conn) {
  await conn.query("DROP TABLE IF EXISTS permissions");
}
