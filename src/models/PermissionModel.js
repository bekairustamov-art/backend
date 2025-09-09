import { getPool } from '../config/db.js';

const PermissionModel = {
  // Get the current permissions (assuming one global row)
  getPermissions: async () => {
    const pool = await getPool();
    const [rows] = await pool.query('SELECT id, is_register, is_usual_order, is_wholesaler_order FROM permissions LIMIT 1');
    return rows[0] || null;
  },

  // Update permissions
  updatePermissions: async (updates) => {
    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map(key => `${key} = ?`).join(', ');

    const pool = await getPool();
    const query = `UPDATE permissions SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = 1`;
    const params = [...values];

    await pool.query(query, params);

    // Return updated permissions
    return await PermissionModel.getPermissions();
  },

  // Create default permissions if not exists
  createDefault: async () => {
    const pool = await getPool();
    const existing = await PermissionModel.getPermissions();
    if (!existing) {
      await pool.query(
        'INSERT INTO permissions (is_register, is_usual_order, is_wholesaler_order) VALUES (?, ?, ?)',
        [1, 1, 1]
      );
      return await PermissionModel.getPermissions();
    }
    return existing;
  }
};

export default PermissionModel;