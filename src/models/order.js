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

  // Get all orders (for admin) with user and product details.
  // - Paginates by batch_id (each page shows full batches with all products)
  // - Supports export_all to return all filtered rows without pagination
  static async getAllOrders(filters = {}) {
    const { user_id, start_date, end_date, wholesaler_only, page = 1, limit = 10, export_all = false } = filters;
    const pool = await getPool();

    const whereConditions = [];
    const whereParams = [];

    if (user_id) {
      whereConditions.push('o.user_id = ?');
      whereParams.push(user_id);
    }

    if (wholesaler_only) {
      whereConditions.push('u.is_wholesaler = 1');
    }

    if (start_date && end_date) {
      whereConditions.push('DATE(o.created_at) BETWEEN ? AND ?');
      whereParams.push(start_date, end_date);
    } else if (start_date) {
      whereConditions.push('DATE(o.created_at) >= ?');
      whereParams.push(start_date);
    } else if (end_date) {
      whereConditions.push('DATE(o.created_at) <= ?');
      whereParams.push(end_date);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Export mode: return all filtered orders without pagination
    if (export_all) {
      const exportQuery = `
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
        ORDER BY o.created_at DESC, o.id DESC
      `;

      const [allRows] = await pool.execute(exportQuery, whereParams);

      const distinctBatchCount = new Set(allRows.map(r => r.batch_id)).size;
      return {
        orders: allRows,
        pagination: {
          totalItems: distinctBatchCount,
          totalPages: 1,
          currentPage: 1,
          limit: parseInt(limit)
        }
      };
    }

    // Paginate by batch: first get batch_ids for this page ordered by most recent created_at
    const countQuery = `
      SELECT COUNT(DISTINCT o.batch_id) as total
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ${whereClause}
    `;
    const [countRows] = await pool.execute(countQuery, whereParams);
    const totalBatches = countRows[0]?.total || 0;

    if (totalBatches === 0) {
      return {
        orders: [],
        pagination: {
          totalItems: 0,
          totalPages: 0,
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      };
    }

    const offset = (page - 1) * limit;
    const batchIdsQuery = `
      SELECT o.batch_id, MAX(o.created_at) as last_created_at
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ${whereClause}
      GROUP BY o.batch_id
      ORDER BY last_created_at DESC
      LIMIT ? OFFSET ?
    `;
    const batchParams = [...whereParams, parseInt(limit), offset];
    const [batchRows] = await pool.execute(batchIdsQuery, batchParams);
    const batchIds = batchRows.map(r => r.batch_id);

    if (batchIds.length === 0) {
      return {
        orders: [],
        pagination: {
          totalItems: totalBatches,
          totalPages: Math.ceil(totalBatches / limit),
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      };
    }

    const placeholders = batchIds.map(() => '?').join(',');
    const pageOrdersQuery = `
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
      WHERE o.batch_id IN (${placeholders})
      ORDER BY o.batch_id, o.created_at DESC, o.id DESC
    `;
    const [rows] = await pool.execute(pageOrdersQuery, batchIds);

    return {
      orders: rows,
      pagination: {
        totalItems: totalBatches,
        totalPages: Math.ceil(totalBatches / limit),
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