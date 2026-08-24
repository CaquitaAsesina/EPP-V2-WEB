const db = require('../config/db');

class LaundryModel {
  static async findAll(filters = {}) {
    let query = `
      SELECT lm.*, 
        et.name as epp_type_name, s.name as size_name,
        u.full_name as created_by_name
      FROM laundry_movements lm
      JOIN epp_types et ON lm.epp_type_id = et.id
      JOIN sizes s ON lm.size_id = s.id
      LEFT JOIN users u ON lm.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.period_id) { query += ' AND lm.period_id = ?'; params.push(filters.period_id); }
    if (filters.epp_type_id) { query += ' AND lm.epp_type_id = ?'; params.push(filters.epp_type_id); }
    if (filters.size_id) { query += ' AND lm.size_id = ?'; params.push(filters.size_id); }
    if (filters.status) { query += ' AND lm.status = ?'; params.push(filters.status); }
    if (filters.date_from) { query += ' AND lm.movement_date >= ?'; params.push(filters.date_from); }
    if (filters.date_to) { query += ' AND lm.movement_date <= ?'; params.push(filters.date_to); }
    if (filters.search) {
      query += ' AND (lm.observation LIKE ?)';
      params.push(`%${filters.search}%`);
    }

    const [countResult] = await db.query(
      query.replace(/SELECT lm\.[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM'),
      params
    );
    const total = countResult[0].total;

    const page = parseInt(filters.page, 10) || 1;
    const limit = parseInt(filters.limit, 10) || 20;
    const offset = (page - 1) * limit;

    query += ' ORDER BY lm.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await db.query(query, params);
    return { data: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async findById(id) {
    const [rows] = await db.query(
      `       SELECT lm.*, et.name as epp_type_name, s.name as size_name, u.full_name as created_by_name
       FROM laundry_movements lm
       JOIN epp_types et ON lm.epp_type_id = et.id
       JOIN sizes s ON lm.size_id = s.id
       LEFT JOIN users u ON lm.created_by = u.id
       WHERE lm.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async getAvailableForWashing(periodId, eppTypeId, sizeId) {
    const [[row]] = await db.query(
      `SELECT COALESCE(SUM(quantity), 0) as available
       FROM laundry_movements 
       WHERE period_id = ? AND epp_type_id = ? AND size_id = ? AND status = 'para_lavar'`,
      [periodId, eppTypeId, sizeId]
    );
    return row.available;
  }

  static async getAvailableForMarkingWashed(periodId, eppTypeId, sizeId) {
    const [[row]] = await db.query(
      `SELECT COALESCE(SUM(quantity), 0) as available
       FROM laundry_movements 
       WHERE period_id = ? AND epp_type_id = ? AND size_id = ? AND status = 'mandado_lavar'`,
      [periodId, eppTypeId, sizeId]
    );
    return row.available;
  }

  static async create(data) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      if (data.status === 'mandado_lavar') {
        // Transition para_lavar → mandado_lavar
        const available = await this.getAvailableForWashing(data.period_id, data.epp_type_id, data.size_id);
        if (available < data.quantity) {
          throw new Error(`Stock para lavar insuficiente. Disponible: ${available}, Solicitado: ${data.quantity}`);
        }
        await this._transitionRecords(conn, data.period_id, data.epp_type_id, data.size_id, 'para_lavar', 'mandado_lavar', data.quantity, data.created_by);

      } else if (data.status === 'lavado') {
        // Transition mandado_lavar → lavado
        const available = await this.getAvailableForMarkingWashed(data.period_id, data.epp_type_id, data.size_id);
        if (available < data.quantity) {
          throw new Error(`Stock en proceso insuficiente. Disponible: ${available}, Solicitado: ${data.quantity}`);
        }
        await this._transitionRecords(conn, data.period_id, data.epp_type_id, data.size_id, 'mandado_lavar', 'lavado', data.quantity, data.created_by);

      } else {
        // para_lavar: direct insert (from returns classification)
        await conn.query(
          `INSERT INTO laundry_movements (period_id, epp_type_id, size_id, quantity, status, movement_date, observation, created_by)
           VALUES (?, ?, ?, ?, ?, CURDATE(), ?, ?)`,
          [data.period_id, data.epp_type_id, data.size_id, data.quantity, data.status, data.observation || null, data.created_by]
        );
      }

      // Register kardex movement
      await conn.query(
        `INSERT INTO inventory_movements (period_id, movement_type, epp_type_id, size_id, quantity, direction, reference_id, reference_type, observation, created_by)
         VALUES (?, ?, ?, ?, ?, ?, NULL, 'laundry', ?, ?)`,
        [data.period_id, `lavado_${data.status}`, data.epp_type_id, data.size_id, data.quantity,
         data.status === 'lavado' ? 'in' : 'out', data.observation || null, data.created_by]
      );

      await conn.commit();
      return true;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async _transitionRecords(conn, periodId, eppTypeId, sizeId, fromStatus, toStatus, quantity, userId) {
    const [records] = await conn.query(
      `SELECT id, quantity FROM laundry_movements 
       WHERE period_id = ? AND epp_type_id = ? AND size_id = ? AND status = ? 
       ORDER BY movement_date ASC, id ASC`,
      [periodId, eppTypeId, sizeId, fromStatus]
    );

    let remaining = quantity;
    for (const rec of records) {
      if (remaining <= 0) break;
      const take = Math.min(rec.quantity, remaining);
      if (take === rec.quantity) {
        await conn.query('UPDATE laundry_movements SET status = ?, observation = ? WHERE id = ?',
          [toStatus, `Transición ${fromStatus} → ${toStatus}`, rec.id]);
      } else {
        await conn.query('UPDATE laundry_movements SET quantity = quantity - ? WHERE id = ?', [take, rec.id]);
        await conn.query(
          `INSERT INTO laundry_movements (period_id, epp_type_id, size_id, quantity, status, movement_date, observation, created_by)
           VALUES (?, ?, ?, ?, ?, CURDATE(), ?, ?)`,
          [periodId, eppTypeId, sizeId, take, toStatus, `Transición ${fromStatus} → ${toStatus}`, userId]
        );
      }
      remaining -= take;
    }
  }

  static async updateStatus(id, newStatus, observation, userId) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [existing] = await conn.query('SELECT * FROM laundry_movements WHERE id = ?', [id]);
      if (!existing[0]) { await conn.rollback(); return null; }

      const record = existing[0];

      // Validate: can only go para_lavar -> mandado_lavar -> lavado
      if (newStatus === 'mandado_lavar' && record.status !== 'para_lavar') {
        throw new Error('Solo se puede cambiar de "Para lavar" a "Mandado a lavar"');
      }
      if (newStatus === 'lavado' && record.status !== 'mandado_lavar') {
        throw new Error('Solo se puede cambiar de "Mandado a lavar" a "Lavado"');
      }
      if (newStatus === 'para_lavar' && record.status !== 'para_lavar') {
        throw new Error('No se puede regresar a "Para lavar" desde este estado');
      }

      await conn.query(
        'UPDATE laundry_movements SET status = ?, observation = ? WHERE id = ?',
        [newStatus, observation || record.observation, id]
      );

      await conn.query(
        `INSERT INTO inventory_movements (period_id, movement_type, epp_type_id, size_id, quantity, direction, reference_id, reference_type, observation, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'laundry', ?, ?)`,
        [record.period_id, `lavado_${newStatus}`, record.epp_type_id, record.size_id, record.quantity,
         newStatus === 'lavado' ? 'in' : 'out', id, `Cambio de estado a ${newStatus} - ID #${id}`, userId]
      );

      await conn.commit();
      return record;
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

      const [existing] = await conn.query('SELECT * FROM laundry_movements WHERE id = ?', [id]);
      if (!existing[0]) { await conn.rollback(); return null; }

      await conn.query('DELETE FROM laundry_movements WHERE id = ?', [id]);

      const record = existing[0];
      await conn.query(
        `INSERT INTO inventory_movements (period_id, movement_type, epp_type_id, size_id, quantity, direction, reference_id, reference_type, observation, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'laundry', ?, ?)`,
        [record.period_id, `lavado_${record.status}_eliminado`, record.epp_type_id, record.size_id, record.quantity,
         record.status === 'lavado' ? 'out' : 'in', id, `Eliminación de movimiento de lavado #${id}`, userId]
      );

      await conn.commit();
      return record;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async getSummaryByPeriod(periodId) {
    const [rows] = await db.query(
      `SELECT epp_type_id, size_id, status, SUM(quantity) as total 
       FROM laundry_movements WHERE period_id = ? 
       GROUP BY epp_type_id, size_id, status`,
      [periodId]
    );
    return rows;
  }
}

module.exports = LaundryModel;
