const db = require('../config/db');

class EppTypeModel {
  static async findAll() {
    const [rows] = await db.query('SELECT * FROM epp_types ORDER BY name');
    return rows;
  }

  static async findActive() {
    const [rows] = await db.query('SELECT * FROM epp_types WHERE is_active = 1 ORDER BY name');
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM epp_types WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async create({ name, description }) {
    const [result] = await db.query(
      'INSERT INTO epp_types (name, description) VALUES (?, ?)',
      [name, description || null]
    );
    return result.insertId;
  }

  static async update(id, { name, description, is_active }) {
    const fields = [];
    const values = [];
    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active); }
    if (fields.length === 0) return false;
    values.push(id);
    await db.query(`UPDATE epp_types SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  }

  static async delete(id) {
    await db.query('DELETE FROM epp_types WHERE id = ?', [id]);
  }
}

module.exports = EppTypeModel;
