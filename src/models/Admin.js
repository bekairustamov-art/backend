import { pool } from '../config/db.js';
import bcrypt from 'bcrypt';

const Admin = {
  getAdmin: async () => {
    const [rows] = await pool.query('SELECT * FROM admins LIMIT 1');
    return rows[0];
  },

  createAdmin: async (admin) => {
    const { username, password } = admin;
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO admins (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );
    return { id: result.insertId, username };
  },

  updateAdmin: async (id, updates) => {
    const keys = Object.keys(updates);
    let values = Object.values(updates);
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
      values = Object.values(updates);
    }
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    
    const query = `UPDATE admins SET ${setClause} WHERE id = ?`;
    const params = [...values, id];
    
    await pool.query(query, params);
    
    const [updatedAdmin] = await pool.query('SELECT id, username FROM admins WHERE id = ?', [id]);
    return updatedAdmin[0];
  },

  findByUsername: async (username) => {
    const [rows] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);
    return rows[0];
  }
};

export default Admin;
