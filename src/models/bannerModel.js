import { getPool } from "../config/db.js";

// Read-only helpers (use pool directly)
export async function listBannersOrdered() {
  const pool = await getPool();
  const [rows] = await pool.query(
    "SELECT id, banner_image, priority FROM banners ORDER BY priority ASC"
  );
  return rows;
}

export async function getMaxPriority(conn) {
  const executor = conn || await getPool();
  const [rows] = await executor.query(
    "SELECT COALESCE(MAX(priority), 0) AS maxp FROM banners"
  );
  return rows?.[0]?.maxp ?? 0;
}

export async function findById(conn, id) {
  const executor = conn || await getPool();
  const [rows] = await executor.query(
    "SELECT id, banner_image, priority FROM banners WHERE id = ?",
    [id]
  );
  return rows[0];
}

// Transactional helpers (pass a connection when part of a transaction)
export async function addOffsetAtOrAbove(conn, atPriority, offset) {
  const executor = conn || await getPool();
  await executor.query(
    "UPDATE banners SET priority = priority + ? WHERE priority >= ?",
    [offset, atPriority]
  );
}

export async function insertBanner(conn, imagePath, priority) {
  const executor = conn || await getPool();
  const [result] = await executor.query(
    "INSERT INTO banners (banner_image, priority) VALUES (?, ?)",
    [imagePath, priority]
  );
  return result.insertId;
}

export async function normalizeAfterInsert(conn, desired, offset) {
  const executor = conn || await getPool();
  await executor.query(
    "UPDATE banners SET priority = priority - ? WHERE priority >= ?",
    [offset - 1, desired + offset]
  );
}

export async function setPriorityZero(conn, id) {
  const executor = conn || await getPool();
  await executor.query("UPDATE banners SET priority = 0 WHERE id = ?", [id]);
}

export async function shiftUpBetween(conn, startInclusive, endExclusive) {
  const executor = conn || await getPool();
  await executor.query(
    "UPDATE banners SET priority = priority + 1 WHERE priority >= ? AND priority < ?",
    [startInclusive, endExclusive]
  );
}

export async function shiftDownBetween(conn, endInclusive, startExclusive) {
  const executor = conn || await getPool();
  await executor.query(
    "UPDATE banners SET priority = priority - 1 WHERE priority <= ? AND priority > ?",
    [endInclusive, startExclusive]
  );
}

export async function updateFields(conn, id, fields) {
  const executor = conn || await getPool();
  const keys = Object.keys(fields);
  if (keys.length === 0) return;
  const setSql = keys.map((k) => `${k} = ?`).join(", ");
  const params = [...keys.map((k) => fields[k]), id];
  await executor.query(`UPDATE banners SET ${setSql} WHERE id = ?`, params);
}

export async function deleteById(conn, id) {
  const executor = conn || await getPool();
  const [result] = await executor.query("DELETE FROM banners WHERE id = ?", [id]);
  return result.affectedRows;
}

export async function shiftAfterDelete(conn, deletedPriority) {
  const executor = conn || await getPool();
  await executor.query(
    "UPDATE banners SET priority = priority - 1 WHERE priority > ?",
    [deletedPriority]
  );
}

export async function createBanner(conn, bannerData) {
  const executor = conn || await getPool();
  const [result] = await executor.query(
    "INSERT INTO banners SET ?",
    [bannerData]
  );
  return result.insertId;
}

export async function updateBanner(conn, id, updates) {
  const executor = conn || await getPool();
  const [result] = await executor.query(
    "UPDATE banners SET ? WHERE id = ?",
    [updates, id]
  );
  return result.affectedRows > 0;
}

export async function deleteBanner(conn, id) {
  const executor = conn || await getPool();
  const [result] = await executor.query(
    "DELETE FROM banners WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
}
