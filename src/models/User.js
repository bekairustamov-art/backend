import { getPool } from '../config/db.js';

const User = {
  getAll: async () => {
    const pool = await getPool();
    const [rows] = await pool.query('SELECT * FROM users');
    return rows;
  },

  create: async (user) => {
    const pool = await getPool();
    const { name, phone, password, is_wholesaler } = user;
    const [result] = await pool.query(
      'INSERT INTO users (name, phone, password, is_wholesaler) VALUES (?, ?, ?, ?)',
      [name, phone, password, is_wholesaler]
    );
    return { id: result.insertId, ...user };
  },

  update: async (id, updates) => {
    const pool = await getPool();
    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    
    const query = `UPDATE users SET ${setClause} WHERE id = ?`;
    const params = [...values, id];
    
    await pool.query(query, params);
    
    const [updatedUser] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return updatedUser[0];
  },

  delete: async (id) => {
    const pool = await getPool();
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    return true;
  },

  getById: async (id) => {
    const pool = await getPool();
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  },

  findByPhone: async (phone) => {
    const pool = await getPool();
    const [rows] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
    return rows[0];
  },

  searchUsers: async (searchTerm = '', limit = 10, offset = 0, filterWholesaler = false) => {
    const pool = await getPool();
    let query = 'SELECT * FROM users WHERE 1=1';
    const params = [];

    if (searchTerm) {
      query += ' AND (name LIKE ? OR phone LIKE ?)';
      params.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }

    if (filterWholesaler) {
      query += ' AND is_wholesaler = ?';
      params.push(true);
    }

    query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    return rows;
  },

  getUsersCount: async (searchTerm = '', filterWholesaler = false) => {
    const pool = await getPool();
    let query = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
    const params = [];

    if (searchTerm) {
      query += ' AND (name LIKE ? OR phone LIKE ?)';
      params.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }

    if (filterWholesaler) {
      query += ' AND is_wholesaler = ?';
      params.push(true);
    }

    const [rows] = await pool.query(query, params);
    return rows[0].count;
  }
};

export default User;
