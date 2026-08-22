const db = require('../config/db');

class PeriodModel {
  static async findAll() {
    const [rows] = await db.query(
      `SELECT p.*, u.full_name as created_by_name 
       FROM periods p 
       LEFT JOIN users u ON p.created_by = u.id 
       ORDER BY p.created_at DESC`
    );
    return rows;
  }

  static async findActive() {
    const [rows] = await db.query(
      'SELECT * FROM periods WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1'
    );
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT p.*, u.full_name as created_by_name 
       FROM periods p 
       LEFT JOIN users u ON p.created_by = u.id 
       WHERE p.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async create({ name, description, start_date, end_date, created_by }) {
    const [result] = await db.query(
      'INSERT INTO periods (name, description, start_date, end_date, created_by) VALUES (?, ?, ?, ?, ?)',
      [name, description || null, start_date, end_date || null, created_by]
    );
    return result.insertId;
  }

  static async update(id, { name, description, start_date, end_date, is_active }) {
    const fields = [];
    const values = [];
    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (start_date !== undefined) { fields.push('start_date = ?'); values.push(start_date); }
    if (end_date !== undefined) { fields.push('end_date = ?'); values.push(end_date); }
    if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active); }
    if (fields.length === 0) return false;
    values.push(id);
    await db.query(`UPDATE periods SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  }

  static async setActive(id) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('UPDATE periods SET is_active = 0');
      await conn.query('UPDATE periods SET is_active = 1 WHERE id = ?', [id]);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async closePeriod(id) {
    const [existing] = await db.query('SELECT * FROM periods WHERE id = ?', [id]);
    if (!existing[0]) throw Object.assign(new Error('Período no encontrado'), { statusCode: 404 });
    if (!existing[0].is_active) throw Object.assign(new Error('El período ya está cerrado'), { statusCode: 400 });
    await db.query(
      'UPDATE periods SET is_active = 0, end_date = CURDATE() WHERE id = ?',
      [id]
    );
    return existing[0];
  }

  static async delete(id) {
    // CASCADE will handle related records
    await db.query('DELETE FROM periods WHERE id = ?', [id]);
  }
}

module.exports = PeriodModel;
