import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { getPool } from "./config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.resolve(__dirname, "./migrations");

async function ensureMigrationsTable(conn) {
  await conn.query(`CREATE TABLE IF NOT EXISTS migrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
}

async function getApplied(conn) {
  const [rows] = await conn.query("SELECT name FROM migrations ORDER BY name ASC");
  return new Set(rows.map(r => r.name));
}

function loadMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith(".js"))
    .sort();
}

async function applyUp() {
  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    await ensureMigrationsTable(conn);
    const files = loadMigrationFiles();
    const applied = await getApplied(conn);

    for (const file of files) {
      if (applied.has(file)) continue;
      const full = path.join(MIGRATIONS_DIR, file);
      const mod = await import(pathToFileURL(full).href);
      if (typeof mod.up !== "function") continue;

      await conn.beginTransaction();
      try {
        await mod.up(conn);
        await conn.query("INSERT INTO migrations (name) VALUES (?)", [file]);
        await conn.commit();
        console.log(`Applied: ${file}`);
      } catch (err) {
        await conn.rollback();
        console.error(`Failed applying ${file}:`, err.message);
        throw err;
      }
    }
    console.log("Migrations up-to-date.");
  } finally {
    conn.release();
  }
}

async function applyDown() {
  // Revert the most recent migration (if it defines down)
  const conn = await getPool().getConnection();
  try {
    await ensureMigrationsTable(conn);
    const [rows] = await conn.query("SELECT name FROM migrations ORDER BY name DESC LIMIT 1");
    if (rows.length === 0) {
      console.log("No migrations to roll back.");
      return;
    }
    const last = rows[0].name;
    const full = path.join(MIGRATIONS_DIR, last);
    if (!fs.existsSync(full)) {
      console.warn(`Migration file missing for ${last}, removing record only.`);
      await conn.query("DELETE FROM migrations WHERE name = ?", [last]);
      return;
    }

    const mod = await import(pathToFileURL(full).href);
    if (typeof mod.down !== "function") {
      console.warn(`Migration ${last} has no down(). Skipping.`);
      return;
    }

    await conn.beginTransaction();
    try {
      await mod.down(conn);
      await conn.query("DELETE FROM migrations WHERE name = ?", [last]);
      await conn.commit();
      console.log(`Rolled back: ${last}`);
    } catch (err) {
      await conn.rollback();
      console.error(`Failed rolling back ${last}:`, err.message);
      throw err;
    }
  } finally {
    conn.release();
  }
}

const cmd = process.argv[2] || "up";
if (cmd === "up") {
  applyUp()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error("Migration failed:", e?.message || e);
      if (e?.stack) console.error(e.stack);
      process.exit(1);
    });
} else if (cmd === "down") {
  applyDown()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error("Migration (down) failed:", e?.message || e);
      if (e?.stack) console.error(e.stack);
      process.exit(1);
    });
} else {
  console.log("Usage: node src/migrate.js [up|down]");
  process.exit(1);
}
