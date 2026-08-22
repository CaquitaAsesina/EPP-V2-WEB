const db = require('../config/db');

class PhysicalInventoryModel {
  static async findAll(filters = {}) {
    let query = `
      SELECT pi.*, 
        et.name as epp_name, s.name as size_name,
        u.full_name as observed_by_name
      FROM physical_inventories pi
      JOIN epp_types et ON pi.epp_type_id = et.id
      JOIN sizes s ON pi.size_id = s.id
      LEFT JOIN users u ON pi.observed_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.period_id) { query += ' AND pi.period_id = ?'; params.push(filters.period_id); }
    if (filters.epp_type_id) { query += ' AND pi.epp_type_id = ?'; params.push(filters.epp_type_id); }
    if (filters.size_id) { query += ' AND pi.size_id = ?'; params.push(filters.size_id); }
    if (filters.date_from) { query += ' AND pi.inventory_date >= ?'; params.push(filters.date_from); }
    if (filters.date_to) { query += ' AND pi.inventory_date <= ?'; params.push(filters.date_to); }

    const [rows] = await db.query(query + ' ORDER BY et.name, s.name', params);
    return rows;
  }

  static async createOrUpdate(data) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [existing] = await conn.query(
        'SELECT * FROM physical_inventories WHERE period_id = ? AND epp_type_id = ? AND size_id = ?',
        [data.period_id, data.epp_type_id, data.size_id]
      );

      let id;
      if (existing[0]) {
        await conn.query(
          'UPDATE physical_inventories SET quantity = ?, inventory_date = ?, observation = ?, observed_by = ? WHERE id = ?',
          [data.quantity, data.inventory_date, data.observation || null, data.observed_by, existing[0].id]
        );
        id = existing[0].id;
      } else {
        const [result] = await conn.query(
          `INSERT INTO physical_inventories (period_id, epp_type_id, size_id, quantity, inventory_date, observation, observed_by)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [data.period_id, data.epp_type_id, data.size_id, data.quantity, data.inventory_date, data.observation || null, data.observed_by]
        );
        id = result.insertId;
      }

      // Register kardex
      await conn.query(
        `INSERT INTO inventory_movements (period_id, movement_type, epp_type_id, size_id, quantity, direction, reference_id, reference_type, observation, created_by)
         VALUES (?, 'inventario_fisico', ?, ?, ?, 'in', ?, 'physical_inventory', ?, ?)`,
        [data.period_id, data.epp_type_id, data.size_id, data.quantity, id, data.observation || null, data.observed_by]
      );

      await conn.commit();
      return id;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async delete(id) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [existing] = await conn.query('SELECT * FROM physical_inventories WHERE id = ?', [id]);
      if (!existing[0]) { await conn.rollback(); return null; }
      await conn.query('DELETE FROM physical_inventories WHERE id = ?', [id]);
      await conn.commit();
      return existing[0];
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}

module.exports = PhysicalInventoryModel;
