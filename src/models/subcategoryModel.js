import { pool } from "../config/db.js";

export async function listAllWithCategory() {
  const [rows] = await pool.query(
    `SELECT s.id, s.name, s.category_id, c.category_name
     FROM subcategories s
     JOIN categories c ON c.id = s.category_id
     ORDER BY s.id DESC`
  );
  return rows;
}

export async function listByCategoryId(categoryId) {
  const [rows] = await pool.query(
    `SELECT s.id, s.name, s.category_id, c.category_name
     FROM subcategories s
     JOIN categories c ON c.id = s.category_id
     WHERE s.category_id = ?
     ORDER BY s.id DESC`,
    [categoryId]
  );
  return rows;
}

export async function createSubcategory(categoryId, name) {
  const [result] = await pool.query(
    "INSERT INTO subcategories (category_id, name) VALUES (?, ?)",
    [categoryId, name]
  );
  return result.insertId;
}

export async function findSubcategoryById(id) {
  const [rows] = await pool.query("SELECT id FROM subcategories WHERE id = ?", [id]);
  return rows[0] ?? null;
}

export async function updateSubcategoryFields(id, fields) {
  const keys = Object.keys(fields);
  if (keys.length === 0) return;
  const setSql = keys.map((k) => `${k} = ?`).join(", ");
  const params = [...keys.map((k) => fields[k]), id];
  await pool.query(`UPDATE subcategories SET ${setSql} WHERE id = ?`, params);
}

export async function deleteSubcategoryById(id) {
  const [result] = await pool.query("DELETE FROM subcategories WHERE id = ?", [id]);
  return result.affectedRows;
}

export async function listSubcategoriesWithFilter({ categoryId, name, page = 1, limit = 10 }) {
  let sql = `SELECT s.id, s.name, s.category_id, c.category_name
     FROM subcategories s
     JOIN categories c ON c.id = s.category_id
     WHERE 1=1`;

  const params = [];

  if (categoryId) {
    sql += " AND s.category_id = ?";
    params.push(categoryId);
  }

  if (name) {
    sql += " AND s.name LIKE ?";
    params.push(`%${name}%`);
  }

  sql += " ORDER BY s.id DESC";

  if (limit && page) {
    sql += " LIMIT ? OFFSET ?";
    params.push(limit, (page - 1) * limit);
  }

  const [rows] = await pool.query(sql, params);

  // Also get total count
  let countSql = "SELECT COUNT(*) as total FROM subcategories s WHERE 1=1";
  const countParams = [];

  if (categoryId) {
    countSql += " AND category_id = ?";
    countParams.push(categoryId);
  }

  if (name) {
    countSql += " AND name LIKE ?";
    countParams.push(`%${name}%`);
  }

  const [countRows] = await pool.query(countSql, countParams);

  return { items: rows, total: countRows[0].total };
}
