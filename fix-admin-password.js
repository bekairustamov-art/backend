import "dotenv/config";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";

const {
  MYSQL_HOST = "localhost",
  MYSQL_PORT = 3306,
  MYSQL_DATABASE = "ecommerce",
  MYSQL_USER = "root",
  MYSQL_PASSWORD = ""
} = process.env;

async function fixAdminPassword() {
  try {
    console.log("🔧 Fixing admin password to hash...");
    const conn = await mysql.createConnection({
      host: MYSQL_HOST,
      port: Number(MYSQL_PORT),
      database: MYSQL_DATABASE,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD
    });

    // Get current admin
    const [rows] = await conn.query('SELECT id, username, password FROM admins LIMIT 1');
    if (rows.length === 0) {
      console.log("❌ No admin found.");
      await conn.end();
      return;
    }

    const admin = rows[0];
    console.log(`📋 Current admin: ${admin.username}`);

    // Check if password is already hashed (bcrypt hashes start with $2b$ or $2a$)
    if (admin.password.startsWith('$2')) {
      console.log("✅ Password is already hashed.");
    } else {
      console.log("🔄 Password appears plain, hashing it...");
      const hashedPassword = await bcrypt.hash(admin.password, 10);
      await conn.query('UPDATE admins SET password = ? WHERE id = ?', [hashedPassword, admin.id]);
      console.log("✅ Password hashed and updated.");
    }

    await conn.end();
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

fixAdminPassword();
