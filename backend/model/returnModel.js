const db = require('../config/db');

class ReturnModel {
  static async findAll(filters = {}) {
    let query = `
      SELECT r.*, 
        et.name as epp_type_name, s.name as size_name,
        w.full_name as worker_name,
        u.full_name as created_by_name
      FROM returns r
      JOIN epp_types et ON r.epp_type_id = et.id
      JOIN sizes s ON r.size_id = s.id
      JOIN workers w ON r.worker_id = w.id
      LEFT JOIN users u ON r.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.period_id) { query += ' AND r.period_id = ?'; params.push(filters.period_id); }
    if (filters.epp_type_id) { query += ' AND r.epp_type_id = ?'; params.push(filters.epp_type_id); }
    if (filters.size_id) { query += ' AND r.size_id = ?'; params.push(filters.size_id); }
    if (filters.worker_id) { query += ' AND r.worker_id = ?'; params.push(filters.worker_id); }
    if (filters.date_from) { query += ' AND r.return_date >= ?'; params.push(filters.date_from); }
    if (filters.date_to) { query += ' AND r.return_date <= ?'; params.push(filters.date_to); }
    if (filters.search) {
      query += ' AND (w.full_name LIKE ? OR r.observation LIKE ?)';
      const s = `%${filters.search}%`;
      params.push(s, s);
    }

    const [countResult] = await db.query(
      query.replace(/SELECT r\.[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM'),
      params
    );
    const total = countResult[0].total;

    const page = parseInt(filters.page, 10) || 1;
    const limit = parseInt(filters.limit, 10) || 20;
    const offset = (page - 1) * limit;

    query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await db.query(query, params);
    return { data: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async findById(id) {
    const [rows] = await db.query(
      `       SELECT r.*, et.name as epp_type_name, s.name as size_name, w.full_name as worker_name, u.full_name as created_by_name
       FROM returns r
       JOIN epp_types et ON r.epp_type_id = et.id
       JOIN sizes s ON r.size_id = s.id
       JOIN workers w ON r.worker_id = w.id
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async create(data) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        `INSERT INTO returns (period_id, epp_type_id, size_id, worker_id, quantity, return_date, observation, created_by)
         VALUES (?, ?, ?, ?, ?, CURDATE(), ?, ?)`,
        [data.period_id, data.epp_type_id, data.size_id, data.worker_id, data.quantity, data.observation || null, data.created_by]
      );

      // Register in laundry_movements as para_lavar
      await conn.query(
        `INSERT INTO laundry_movements (period_id, epp_type_id, size_id, quantity, status, movement_date, observation, created_by)
         VALUES (?, ?, ?, ?, 'para_lavar', CURDATE(), ?, ?)`,
        [data.period_id, data.epp_type_id, data.size_id, data.quantity, data.observation || null, data.created_by]
      );

      // Register kardex
      await conn.query(
        `INSERT INTO inventory_movements (period_id, movement_type, epp_type_id, size_id, quantity, direction, reference_id, reference_type, worker_id, observation, created_by)
         VALUES (?, 'devolucion', ?, ?, ?, 'in', ?, 'return', ?, ?, ?)`,
        [data.period_id, data.epp_type_id, data.size_id, data.quantity, result.insertId, data.worker_id, data.observation || null, data.created_by]
      );

      await conn.commit();
      return result.insertId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async update(id, data, userId) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [existing] = await conn.query('SELECT * FROM returns WHERE id = ?', [id]);
      if (!existing[0]) { await conn.rollback(); return null; }

      const fields = [];
      const values = [];
      if (data.epp_type_id !== undefined) { fields.push('epp_type_id = ?'); values.push(data.epp_type_id); }
      if (data.size_id !== undefined) { fields.push('size_id = ?'); values.push(data.size_id); }
      if (data.worker_id !== undefined) { fields.push('worker_id = ?'); values.push(data.worker_id); }
      if (data.quantity !== undefined) { fields.push('quantity = ?'); values.push(data.quantity); }
      if (data.observation !== undefined) { fields.push('observation = ?'); values.push(data.observation); }

      if (fields.length > 0) {
        values.push(id);
        await conn.query(`UPDATE returns SET ${fields.join(', ')} WHERE id = ?`, values);

        const updated = existing[0];
        await conn.query(
          `INSERT INTO inventory_movements (period_id, movement_type, epp_type_id, size_id, quantity, direction, reference_id, reference_type, worker_id, observation, created_by)
           VALUES (?, 'devolucion_editada', ?, ?, ?, 'in', ?, 'return', ?, ?, ?)`,
          [updated.period_id, data.epp_type_id || updated.epp_type_id, data.size_id || updated.size_id, data.quantity || updated.quantity, id, data.worker_id || updated.worker_id, `Edición de devolución #${id}`, userId]
        );
      }

      await conn.commit();
      return existing[0];
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async delete(id, userId) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [existing] = await conn.query('SELECT * FROM returns WHERE id = ?', [id]);
      if (!existing[0]) { await conn.rollback(); return null; }

      await conn.query('DELETE FROM returns WHERE id = ?', [id]);

      // Also delete corresponding laundry movements (para_lavar) created by this return
      await conn.query(
        `DELETE FROM laundry_movements WHERE period_id = ? AND epp_type_id = ? AND size_id = ? AND quantity = ? AND status = 'para_lavar' AND created_by = ? LIMIT 1`,
        [existing[0].period_id, existing[0].epp_type_id, existing[0].size_id, existing[0].quantity, userId]
      );

      await conn.query(
        `INSERT INTO inventory_movements (period_id, movement_type, epp_type_id, size_id, quantity, direction, reference_id, reference_type, worker_id, observation, created_by)
         VALUES (?, 'devolucion_eliminada', ?, ?, ?, 'out', ?, 'return', ?, ?, ?)`,
        [existing[0].period_id, existing[0].epp_type_id, existing[0].size_id, existing[0].quantity, id, existing[0].worker_id, `Eliminación de devolución #${id}`, userId]
      );

      await conn.commit();
      return existing[0];
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async getSummaryByPeriod(periodId) {
    const [rows] = await db.query(
      `SELECT epp_type_id, size_id, SUM(quantity) as total 
       FROM returns WHERE period_id = ? 
       GROUP BY epp_type_id, size_id`,
      [periodId]
    );
    return rows;
  }
}

module.exports = ReturnModel;
