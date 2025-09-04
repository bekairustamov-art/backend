import { getPool } from '../config/db.js';
import bcrypt from 'bcrypt';

const Admin = {
  async getAdmin() {
    const pool = await getPool();
    const [rows] = await pool.query('SELECT * FROM admins LIMIT 1');
    return rows[0];
  },

  async createAdmin(admin) {
    const pool = await getPool();
    const { username, password } = admin;
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO admins (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );
    return { id: result.insertId, username };
  },

  async updateAdmin(id, updates) {
    const pool = await getPool();
    
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    
    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    
    const [result] = await pool.query(
      `UPDATE admins SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
    return result.affectedRows > 0;
  },
  
  async findByUsername(username) {
    const pool = await getPool();
    const [rows] = await pool.query(
      'SELECT * FROM admins WHERE username = ?', 
      [username]
    );
    return rows[0];
  }
};

export default Admin;
