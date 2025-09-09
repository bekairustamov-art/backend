export async function up(conn) {
  await conn.query(`CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INT NOT NULL,
    sub_category_id INT NOT NULL,
    first_price DECIMAL(10,2) DEFAULT 0.00,
    discount1_price DECIMAL(10,2) DEFAULT 0.00,
    second_price DECIMAL(10,2) DEFAULT 0.00,
    discount2_price DECIMAL(10,2) DEFAULT 0.00,
    thumb_image_path VARCHAR(255),
    detail_image_path VARCHAR(255),
    ispopular BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (category_id),
    INDEX (sub_category_id),
    CONSTRAINT fk_products_category
      FOREIGN KEY (category_id) REFERENCES categories(id)
      ON DELETE CASCADE,
    CONSTRAINT fk_products_subcategory
      FOREIGN KEY (sub_category_id) REFERENCES subcategories(id)
      ON DELETE CASCADE
  )`);
}

export async function down(conn) {
  await conn.query("DROP TABLE IF EXISTS products");
}
