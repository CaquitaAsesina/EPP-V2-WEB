const db = require('../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const env = require('../config/env');

class UserModel {
  static async findByUsername(username) {
    const [rows] = await db.query(
      'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.username = ? AND u.is_active = 1',
      [username]
    );
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await db.query(
      'SELECT u.id, u.username, u.full_name, u.email, u.role_id, r.name as role_name, u.is_active, u.photo_url, u.created_at FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async findByIdWithHash(id) {
    const [rows] = await db.query(
      'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async updateUsername(id, username) {
    await db.query('UPDATE users SET username = ? WHERE id = ?', [username, id]);
  }

  static async usernameExists(username, excludeId) {
    const [rows] = await db.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, excludeId]);
    return rows.length > 0;
  }

  static async findAll() {
    const [rows] = await db.query(
      'SELECT u.id, u.username, u.full_name, u.email, u.role_id, r.name as role_name, u.is_active, u.created_at FROM users u JOIN roles r ON u.role_id = r.id ORDER BY u.created_at DESC'
    );
    return rows;
  }

  static async create({ username, password, full_name, email, role_id }) {
    const rounds = env.bcryptRounds || 10;
    const password_hash = await bcrypt.hash(password, rounds);
    const [result] = await db.query(
      'INSERT INTO users (username, password_hash, full_name, email, role_id) VALUES (?, ?, ?, ?, ?)',
      [username, password_hash, full_name, email || null, role_id]
    );
    return result.insertId;
  }

  static async update(id, { full_name, email, role_id, is_active }) {
    const fields = [];
    const values = [];
    if (full_name !== undefined) { fields.push('full_name = ?'); values.push(full_name); }
    if (email !== undefined) { fields.push('email = ?'); values.push(email); }
    if (role_id !== undefined) { fields.push('role_id = ?'); values.push(role_id); }
    if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active); }
    if (fields.length === 0) return false;
    values.push(id);
    await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  }

  static async updatePassword(id, newPassword) {
    const rounds = env.bcryptRounds || 10;
    const password_hash = await bcrypt.hash(newPassword, rounds);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, id]);
  }

  static async updatePhoto(id, photoUrl) {
    await db.query('UPDATE users SET photo_url = ? WHERE id = ?', [photoUrl, id]);
  }

  static async delete(id) {
    await db.query('DELETE FROM users WHERE id = ?', [id]);
  }

  static async comparePassword(plainPassword, hash) {
    return bcrypt.compare(plainPassword, hash);
  }
}

module.exports = UserModel;
