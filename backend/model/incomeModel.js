const db = require('../config/db');

class IncomeModel {
  static async findAll(filters = {}) {
    let query = `
      SELECT i.*, 
        et.name as epp_type_name, s.name as size_name, 
        u.full_name as created_by_name
      FROM incomes i
      JOIN epp_types et ON i.epp_type_id = et.id
      JOIN sizes s ON i.size_id = s.id
      LEFT JOIN users u ON i.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.period_id) { query += ' AND i.period_id = ?'; params.push(filters.period_id); }
    if (filters.epp_type_id) { query += ' AND i.epp_type_id = ?'; params.push(filters.epp_type_id); }
    if (filters.size_id) { query += ' AND i.size_id = ?'; params.push(filters.size_id); }
    if (filters.date_from) { query += ' AND i.reception_date >= ?'; params.push(filters.date_from); }
    if (filters.date_to) { query += ' AND i.reception_date <= ?'; params.push(filters.date_to); }
    if (filters.search) {
      query += ' AND (i.provider LIKE ? OR i.document_number LIKE ? OR i.observation LIKE ?)';
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }

    const [countResult] = await db.query(
      query.replace(/SELECT i\.\*[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM'),
      params
    );
    const total = countResult[0].total;

    const page = parseInt(filters.page, 10) || 1;
    const limit = parseInt(filters.limit, 10) || 20;
    const offset = (page - 1) * limit;

    query += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await db.query(query, params);
    return { data: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async findById(id) {
    const [rows] = await db.query(
      `       SELECT i.*, et.name as epp_type_name, s.name as size_name, u.full_name as created_by_name
       FROM incomes i
       JOIN epp_types et ON i.epp_type_id = et.id
       JOIN sizes s ON i.size_id = s.id
       LEFT JOIN users u ON i.created_by = u.id
       WHERE i.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async create(data) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        `INSERT INTO incomes (period_id, epp_type_id, size_id, quantity, reception_date, provider, document_number, observation, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.period_id, data.epp_type_id, data.size_id, data.quantity, data.reception_date, data.provider || null, data.document_number || null, data.observation || null, data.created_by]
      );

      // Register kardex movement
      await conn.query(
        `INSERT INTO inventory_movements (period_id, movement_type, epp_type_id, size_id, quantity, direction, reference_id, reference_type, observation, created_by)
         VALUES (?, 'ingreso', ?, ?, ?, 'in', ?, 'income', ?, ?)`,
        [data.period_id, data.epp_type_id, data.size_id, data.quantity, result.insertId, data.observation || null, data.created_by]
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

      const [existing] = await conn.query('SELECT * FROM incomes WHERE id = ?', [id]);
      if (!existing[0]) { await conn.rollback(); return null; }

      const fields = [];
      const values = [];
      if (data.epp_type_id !== undefined) { fields.push('epp_type_id = ?'); values.push(data.epp_type_id); }
      if (data.size_id !== undefined) { fields.push('size_id = ?'); values.push(data.size_id); }
      if (data.quantity !== undefined) { fields.push('quantity = ?'); values.push(data.quantity); }
      if (data.reception_date !== undefined) { fields.push('reception_date = ?'); values.push(data.reception_date); }
      if (data.provider !== undefined) { fields.push('provider = ?'); values.push(data.provider); }
      if (data.document_number !== undefined) { fields.push('document_number = ?'); values.push(data.document_number); }
      if (data.observation !== undefined) { fields.push('observation = ?'); values.push(data.observation); }

      if (fields.length > 0) {
        values.push(id);
        await conn.query(`UPDATE incomes SET ${fields.join(', ')} WHERE id = ?`, values);

        // Update kardex
        if (data.quantity !== undefined || data.epp_type_id !== undefined || data.size_id !== undefined) {
          const updated = existing[0];
          await conn.query(
            `INSERT INTO inventory_movements (period_id, movement_type, epp_type_id, size_id, quantity, direction, reference_id, reference_type, observation, created_by)
             VALUES (?, 'ingreso_editado', ?, ?, ?, 'in', ?, 'income', ?, ?)`,
            [
              updated.period_id,
              data.epp_type_id || updated.epp_type_id,
              data.size_id || updated.size_id,
              data.quantity || updated.quantity,
              id,
              `Edición de ingreso #${id}`,
              userId
            ]
          );
        }
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

      const [existing] = await conn.query('SELECT * FROM incomes WHERE id = ?', [id]);
      if (!existing[0]) { await conn.rollback(); return null; }

      await conn.query('DELETE FROM incomes WHERE id = ?', [id]);

      // Register reversal in kardex
      await conn.query(
        `INSERT INTO inventory_movements (period_id, movement_type, epp_type_id, size_id, quantity, direction, reference_id, reference_type, observation, created_by)
         VALUES (?, 'ingreso_eliminado', ?, ?, ?, 'out', ?, 'income', ?, ?)`,
        [existing[0].period_id, existing[0].epp_type_id, existing[0].size_id, existing[0].quantity, id, `Eliminación de ingreso #${id}`, userId]
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
       FROM incomes WHERE period_id = ? 
       GROUP BY epp_type_id, size_id`,
      [periodId]
    );
    return rows;
  }
}

module.exports = IncomeModel;
