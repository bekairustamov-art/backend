export async function up(conn) {
  await conn.query(`CREATE TABLE IF NOT EXISTS subcategories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (category_id),
    CONSTRAINT fk_subcategories_category
      FOREIGN KEY (category_id) REFERENCES categories(id)
      ON DELETE CASCADE
  )`);
}

export async function down(conn) {
  await conn.query("DROP TABLE IF EXISTS subcategories");
}
