import { getPool } from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

export class OrderModel {
  // Create new orders with a batch_id
  static async createOrders(orderDataArray) {
    if (!Array.isArray(orderDataArray) || orderDataArray.length === 0) {
      throw new Error("Order data must be a non-empty array");
    }

    // Generate a unique batch_id for this order batch
    const batchId = uuidv4();
    const pool = await getPool();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const query = `
        INSERT INTO orders (user_id, product_id, quantity, price, batch_id, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `;

      const results = [];
      for (const orderData of orderDataArray) {
        const { user_id, product_id, quantity, price } = orderData;

        // Validate required fields
        if (!user_id || !product_id || !quantity || !price) {
          throw new Error("user_id, product_id, quantity, and price are required for each order");
        }

        const [result] = await connection.execute(query, [
          user_id,
          product_id,
          quantity,
          price,
          batchId
        ]);

        results.push({
          id: result.insertId,
          ...orderData,
          batch_id: batchId
        });
      }

      await connection.commit();
      return results;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get all orders (for admin) with user and product details with filtering and pagination
  static async getAllOrders(filters = {}) {
    const { user_id, start_date, end_date, wholesaler_only, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;
    const pool = await getPool();

    let whereConditions = [];
    let params = [];

    if (user_id) {
      whereConditions.push('o.user_id = ?');
      params.push(user_id);
    }

    if (wholesaler_only) {
      whereConditions.push('u.is_wholesaler = ?');
      params.push(1);
    }

    if (start_date && end_date) {
      whereConditions.push('DATE(o.created_at) BETWEEN ? AND ?');
      params.push(start_date, end_date);
    } else if (start_date) {
      whereConditions.push('DATE(o.created_at) >= ?');
      params.push(start_date);
    } else if (end_date) {
      whereConditions.push('DATE(o.created_at) <= ?');
      params.push(end_date);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT
        o.id,
        o.user_id,
        o.product_id,
        o.quantity,
        o.price,
        o.batch_id,
        o.created_at,
        u.name as user_name,
        u.is_wholesaler,
        p.name as product_name,
        p.thumb_image_path as product_image
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN products p ON o.product_id = p.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);

    const [rows] = await pool.execute(query, params);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT o.batch_id) as total
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ${whereClause}
    `;

    const [countResult] = await pool.execute(countQuery, params);

    return {
      orders: rows,
      pagination: {
        totalItems: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    };
  }

  // Get order history for a specific user (grouped by batch_id with product details and image versioning)
  static async getOrderHistory(userId) {
    if (!userId) {
      throw new Error("User ID is required");
    }
    
    const pool = await getPool();
    const query = `
      SELECT
        o.batch_id,
        DATE_FORMAT(o.created_at, '%d-%m-%Y') as date,
        o.id as order_id,
        p.name as product_name,
        o.price,
        o.quantity,
        p.thumb_image_path,
        p.updated_at
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.user_id = ?
      ORDER BY o.batch_id, o.created_at DESC
    `;

    const [rows] = await pool.execute(query, [userId]);

    // Group orders by batch_id
    const orderBatches = {};

    rows.forEach(row => {
      const batchId = row.batch_id;

      if (!orderBatches[batchId]) {
        orderBatches[batchId] = {
          orderId: batchId,
          date: row.date,
          items: []
        };
      }

      // Add version parameter to image path
      let thumbImagePath = row.thumb_image_path;
      if (thumbImagePath) {
        // If thumb_image_path doesn't start with /public/thumb/, prepend it
        if (!thumbImagePath.startsWith('/public/thumb/')) {
          thumbImagePath = `/public/thumb/${thumbImagePath}`;
        }
        const versionParam = row.updated_at ? `?v=${row.updated_at.getTime()}` : '';
        thumbImagePath += versionParam;
      }

      orderBatches[batchId].items.push({
        product_name: row.product_name,
        price: parseFloat(row.price),
        quantity: row.quantity,
        thumb_image_path: thumbImagePath
      });
    });

    // Convert to array format and return in expected shape
    const orders = Object.values(orderBatches).sort((a, b) => new Date(b.date) - new Date(a.date));

    return { orders };
  }
}