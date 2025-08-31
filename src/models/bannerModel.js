import { pool } from "../config/db.js";

// Read-only helpers (use pool directly)
export async function listBannersOrdered() {
  const [rows] = await pool.query(
    "SELECT id, banner_image, priority FROM banners ORDER BY priority ASC"
  );
  return rows;
}

export async function getMaxPriority(conn) {
  const executor = conn ?? pool;
  const [rows] = await executor.query(
    "SELECT COALESCE(MAX(priority), 0) AS maxp FROM banners"
  );
  return rows?.[0]?.maxp ?? 0;
}

// Transactional helpers (pass a connection when part of a transaction)
export async function addOffsetAtOrAbove(conn, atPriority, offset) {
  await conn.query(
    "UPDATE banners SET priority = priority + ? WHERE priority >= ?",
    [offset, atPriority]
  );
}

export async function insertBanner(conn, imagePath, priority) {
  const [result] = await conn.query(
    "INSERT INTO banners (banner_image, priority) VALUES (?, ?)",
    [imagePath, priority]
  );
  return result.insertId;
}

export async function normalizeAfterInsert(conn, desired, offset) {
  await conn.query(
    "UPDATE banners SET priority = priority - ? WHERE priority >= ?",
    [offset - 1, desired + offset]
  );
}

export async function findById(conn, id) {
  const [rows] = await conn.query(
    "SELECT id, banner_image, priority FROM banners WHERE id = ?",
    [id]
  );
  return rows[0];
}

export async function setPriorityZero(conn, id) {
  await conn.query("UPDATE banners SET priority = 0 WHERE id = ?", [id]);
}

export async function shiftUpBetween(conn, startInclusive, endExclusive) {
  await conn.query(
    "UPDATE banners SET priority = priority + 1 WHERE priority >= ? AND priority < ?",
    [startInclusive, endExclusive]
  );
}

export async function shiftDownBetween(conn, endInclusive, startExclusive) {
  await conn.query(
    "UPDATE banners SET priority = priority - 1 WHERE priority <= ? AND priority > ?",
    [endInclusive, startExclusive]
  );
}

export async function updateFields(conn, id, fields) {
  const keys = Object.keys(fields);
  if (keys.length === 0) return;
  const setSql = keys.map((k) => `${k} = ?`).join(", ");
  const params = [...keys.map((k) => fields[k]), id];
  await conn.query(`UPDATE banners SET ${setSql} WHERE id = ?`, params);
}

export async function deleteById(conn, id) {
  const [result] = await conn.query("DELETE FROM banners WHERE id = ?", [id]);
  return result.affectedRows;
}

export async function shiftAfterDelete(conn, deletedPriority) {
  await conn.query(
    "UPDATE banners SET priority = priority - 1 WHERE priority > ?",
    [deletedPriority]
  );
}
