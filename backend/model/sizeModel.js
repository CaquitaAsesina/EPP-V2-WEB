const db = require('../config/db');

class SizeModel {
  static async findAll() {
    const [rows] = await db.query('SELECT * FROM sizes ORDER BY name');
    return rows;
  }

  static async findActive() {
    const [rows] = await db.query('SELECT * FROM sizes WHERE is_active = 1 ORDER BY name');
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM sizes WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async create({ name, description }) {
    const [result] = await db.query(
      'INSERT INTO sizes (name, description) VALUES (?, ?)',
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
    await db.query(`UPDATE sizes SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  }

  static async delete(id) {
    await db.query('DELETE FROM sizes WHERE id = ?', [id]);
  }

  static async findByEppType(eppTypeId) {
    const [rows] = await db.query(
      `SELECT s.* FROM sizes s 
       JOIN epp_type_sizes ets ON s.id = ets.size_id 
       WHERE ets.epp_type_id = ? AND ets.is_active = 1 AND s.is_active = 1 
       ORDER BY s.name`,
      [eppTypeId]
    );
    return rows;
  }

  static async associateEppType(eppTypeId, sizeId) {
    const [existing] = await db.query(
      'SELECT id FROM epp_type_sizes WHERE epp_type_id = ? AND size_id = ?',
      [eppTypeId, sizeId]
    );
    if (existing.length > 0) {
      await db.query('UPDATE epp_type_sizes SET is_active = 1 WHERE epp_type_id = ? AND size_id = ?', [eppTypeId, sizeId]);
      return existing[0].id;
    }
    const [result] = await db.query(
      'INSERT INTO epp_type_sizes (epp_type_id, size_id) VALUES (?, ?)',
      [eppTypeId, sizeId]
    );
    return result.insertId;
  }

  static async dissociateEppType(eppTypeId, sizeId) {
    await db.query(
      'UPDATE epp_type_sizes SET is_active = 0 WHERE epp_type_id = ? AND size_id = ?',
      [eppTypeId, sizeId]
    );
  }
}

module.exports = SizeModel;
