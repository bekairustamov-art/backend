export async function up(conn) {
  await conn.query(`CREATE TABLE IF NOT EXISTS banners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    banner_image VARCHAR(255) NOT NULL,
    priority INT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);
}

export async function down(conn) {
  await conn.query("DROP TABLE IF EXISTS banners");
}
