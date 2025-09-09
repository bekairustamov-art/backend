import { getPool } from "../config/db.js";

export async function listProducts() {
  const pool = await getPool();
  const [rows] = await pool.query(`
    SELECT
      p.*,
      c.category_name,
      s.name as sub_category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN subcategories s ON p.sub_category_id = s.id
    ORDER BY p.id DESC
  `);
  return rows;
}

export async function createProduct(productData) {
  const pool = await getPool();
  const {
    name,
    description,
    category_id,
    sub_category_id,
    first_price,
    discount1_price,
    second_price,
    discount2_price,
    thumb_image_path,
    detail_image_path,
    ispopular = false
  } = productData;

  const [result] = await pool.query(`
    INSERT INTO products (
      name, description, category_id, sub_category_id,
      first_price, discount1_price, second_price, discount2_price,
      thumb_image_path, detail_image_path, ispopular, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [name, description, category_id, sub_category_id,
     first_price, discount1_price || null, second_price, discount2_price || null,
     thumb_image_path, detail_image_path, ispopular]
  );
  return result.insertId;
}

export async function getProductById(id) {
  const pool = await getPool();
  const [rows] = await pool.query(`
    SELECT
      p.*,
      c.category_name,
      s.name as sub_category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN subcategories s ON p.sub_category_id = s.id
    WHERE p.id = ?`,
    [id]
  );
  return rows[0] ?? null;
}

export async function updateProductFields(id, fields) {
  const pool = await getPool();
  const keys = Object.keys(fields);
  if (keys.length === 0) return;
  const setSql = keys.map((k) => `${k} = ?`).join(", ");
  const params = [...keys.map((k) => fields[k]), id];
  await pool.query(`UPDATE products SET ${setSql} WHERE id = ?`, params);
}

export async function deleteProductById(id) {
  const pool = await getPool();
  const [result] = await pool.query("DELETE FROM products WHERE id = ?", [id]);
  return result.affectedRows;
}

export async function findProductById(id) {
  const pool = await getPool();
  const [rows] = await pool.query("SELECT id FROM products WHERE id = ?", [id]);
  return rows[0] ?? null;
}

export async function listProductsWithFilter({ categoryId, subCategoryId, name, isPopular, page = 1, limit = 10 }) {
  const pool = await getPool();
  let sql = `SELECT
    p.*,
    c.category_name,
    s.name as sub_category_name
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN subcategories s ON p.sub_category_id = s.id
  WHERE 1=1`;

  const params = [];

  if (categoryId) {
    sql += " AND p.category_id = ?";
    params.push(categoryId);
  }

  if (subCategoryId) {
    sql += " AND p.sub_category_id = ?";
    params.push(subCategoryId);
  }

  if (name) {
    sql += " AND p.name LIKE ?";
    params.push(`%${name}%`);
  }

  if (isPopular !== undefined) {
    sql += " AND p.ispopular = ?";
    params.push(isPopular);
  }

  sql += " ORDER BY p.id DESC";

  if (limit && page) {
    sql += " LIMIT ? OFFSET ?";
    params.push(limit, (page - 1) * limit);
  }

  const [rows] = await pool.query(sql, params);

  // Get total count
  let countSql = "SELECT COUNT(*) as total FROM products p WHERE 1=1";
  const countParams = [];

  if (categoryId) {
    countSql += " AND category_id = ?";
    countParams.push(categoryId);
  }

  if (subCategoryId) {
    countSql += " AND sub_category_id = ?";
    countParams.push(subCategoryId);
  }

  if (name) {
    countSql += " AND name LIKE ?";
    countParams.push(`%${name}%`);
  }

  if (isPopular !== undefined) {
    countSql += " AND ispopular = ?";
    countParams.push(isPopular);
  }

  const [countRows] = await pool.query(countSql, countParams);

  return { items: rows, total: countRows[0].total };
}
