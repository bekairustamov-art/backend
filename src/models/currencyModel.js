import { getPool } from "../config/db.js";

export async function getCurrency() {
  const pool = await getPool();
  const [rows] = await pool.query("SELECT id, rate, updated_at FROM currency WHERE id = 1 LIMIT 1");
  if (rows.length === 0) return { id: 1, rate: 0, updated_at: null };
  return rows[0];
}

export async function upsertCurrency(rate) {
  const pool = await getPool();
  const normalized = Number.isFinite(Number(rate)) ? Number(rate) : 0;
  await pool.query(
    `INSERT INTO currency (id, rate) VALUES (1, ?)
     ON DUPLICATE KEY UPDATE rate = VALUES(rate)`,
    [normalized]
  );
  return { id: 1, rate: normalized };
}


