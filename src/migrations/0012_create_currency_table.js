export async function up(conn) {
  // Single-row table to store USD→UZS conversion rate
  await conn.query(`
    CREATE TABLE IF NOT EXISTS currency (
      id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
      rate DECIMAL(18,6) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_single_row (id)
    ) ENGINE=InnoDB
  `);

  // Ensure exactly one row with id=1 exists
  await conn.query(
    `INSERT INTO currency (id, rate) VALUES (1, 0)
     ON DUPLICATE KEY UPDATE rate = rate`
  );
}

export async function down(conn) {
  await conn.query("DROP TABLE IF EXISTS currency");
}


