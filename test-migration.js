import "dotenv/config";
import mysql from "mysql2/promise";
import { fileURLToPath, pathToFileURL } from "url";
import path from "path";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testInfoMigration() {
  let conn;

  try {
    console.log("🔍 Testing 0004_create_info_table.js migration...");

    // Connect to database
    conn = await mysql.createConnection({
      host: process.env.MYSQL_HOST || "localhost",
      port: process.env.MYSQL_PORT || 3306,
      database: process.env.MYSQL_DATABASE || "ecommerce",
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || ""
    });

    console.log("✅ Connected to database");

    // Import the migration file
    const migrationPath = path.join(__dirname, "src", "migrations", "0004_create_info_table.js");
    console.log("📁 Migration file path:", migrationPath);

    const mod = await import(pathToFileURL(migrationPath).href);
    console.log("✅ Migration file imported");

    // Check if up function exists
    if (typeof mod.up !== "function") {
      console.log("❌ Migration file does not export 'up' function");
      return;
    }

    console.log("✅ 'up' function found");

    // Test the up function
    console.log("🚀 Executing migration up function...");
    await conn.beginTransaction();

    try {
      await mod.up(conn);
      console.log("✅ Migration up function executed successfully");

      await conn.commit();
      console.log("✅ Transaction committed");

      // Verify table was created
      const [tables] = await conn.query('SHOW TABLES LIKE "info"');
      if (tables.length > 0) {
        console.log("✅ SUCCESS: Info table was created");
      } else {
        console.log("❌ FAILED: Info table was not created");
      }

    } catch (err) {
      await conn.rollback();
      console.log("❌ Migration failed, transaction rolled back");
      console.error("Error:", err.message);
      console.error("Full error:", err);
    }

  } catch (err) {
    console.error("❌ Test failed:", err.message);
  } finally {
    if (conn) await conn.end();
  }
}

testInfoMigration();
