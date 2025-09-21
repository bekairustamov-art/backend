export async function up(conn) {
  // Add is_available column with default FALSE and an index for filtering
  await conn.query(`ALTER TABLE products ADD COLUMN is_available BOOLEAN NOT NULL DEFAULT FALSE`);
  await conn.query(`CREATE INDEX idx_products_is_available ON products (is_available)`);
}

export async function down(conn) {
  // Drop index then column (MySQL requires removing index before column if named)
  try { await conn.query(`DROP INDEX idx_products_is_available ON products`); } catch {}
  await conn.query(`ALTER TABLE products DROP COLUMN is_available`);
}


