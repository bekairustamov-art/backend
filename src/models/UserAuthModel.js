import { getPool } from "../config/db.js";
import bcrypt from "bcrypt";

export class UserAuthModel {
  // Create a new user
  static async createUser(userData) {
    const pool = await getPool();
    const { name, phone, password, is_wholesaler = false } = userData;

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const query = `
      INSERT INTO users (name, phone, password, is_wholesaler)
      VALUES (?, ?, ?, ?)
    `;

    try {
      const [result] = await pool.execute(query, [name, phone, hashedPassword, is_wholesaler]);
      return result.insertId;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Phone number already exists');
      }
      throw error;
    }
  }

  // Find user by phone number
  static async findUserByPhone(phone) {
    const pool = await getPool();
    const query = `
      SELECT id, name, phone, password, is_wholesaler, created_at, updated_at
      FROM users
      WHERE phone = ?
    `;

    const [rows] = await pool.execute(query, [phone]);
    return rows[0] || null;
  }

  // Find user by ID
  static async findUserById(id) {
    const pool = await getPool();
    const query = `
      SELECT id, name, phone, is_wholesaler, created_at, updated_at
      FROM users
      WHERE id = ?
    `;

    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  // Update user password
  static async updatePassword(userId, newPassword) {
    const pool = await getPool();
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    const query = `
      UPDATE users
      SET password = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const [result] = await pool.execute(query, [hashedPassword, userId]);
    return result.affectedRows > 0;
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}