import { getPool } from "../config/db.js";

export async function listCategoriesOrdered() {
  const pool = await getPool();
  const [rows] = await pool.query(
    "SELECT id, image_path, category_name FROM categories ORDER BY id DESC"
  );
  return rows;
}

export async function createCategory(imagePath, categoryName) {
  const pool = await getPool();
  const [result] = await pool.query(
    "INSERT INTO categories (image_path, category_name) VALUES (?, ?)",
    [imagePath, categoryName]
  );
  return result.insertId;
}

export async function getCategoryById(id) {
  const pool = await getPool();
  const [rows] = await pool.query(
    "SELECT id, image_path, category_name FROM categories WHERE id = ?",
    [id]
  );
  return rows[0] ?? null;
}

export async function updateCategoryFields(id, fields) {
  const pool = await getPool();
  const keys = Object.keys(fields);
  if (keys.length === 0) return;
  const setSql = keys.map((k) => `${k} = ?`).join(", ");
  const params = [...keys.map((k) => fields[k]), id];
  await pool.query(`UPDATE categories SET ${setSql} WHERE id = ?`, params);
}

export async function deleteCategoryById(id) {
  const pool = await getPool();
  const [result] = await pool.query("DELETE FROM categories WHERE id = ?", [id]);
  return result.affectedRows;
}

export async function findCategoryById(id) {
  const pool = await getPool();
  const [rows] = await pool.query("SELECT id FROM categories WHERE id = ?", [id]);
  return rows[0] ?? null;
}
