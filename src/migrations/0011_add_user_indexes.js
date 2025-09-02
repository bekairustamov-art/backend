export async function up(conn) {
  await conn.query("CREATE INDEX idx_users_name ON users(name)");
  await conn.query("CREATE INDEX idx_users_phone ON users(phone)");
  await conn.query("CREATE INDEX idx_users_name_phone ON users(name, phone)");
  await conn.query("CREATE INDEX idx_users_wholesaler ON users(is_wholesaler)");
  await conn.query("CREATE INDEX idx_users_wholesaler_name_phone ON users(is_wholesaler, name, phone)");
}

export async function down(conn) {
  await conn.query("DROP INDEX idx_users_name ON users");
  await conn.query("DROP INDEX idx_users_phone ON users");
  await conn.query("DROP INDEX idx_users_name_phone ON users");
  await conn.query("DROP INDEX idx_users_wholesaler ON users");
  await conn.query("DROP INDEX idx_users_wholesaler_name_phone ON users");
}
