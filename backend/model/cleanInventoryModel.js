const db = require('../config/db');

class CleanInventoryModel {
  static async getMatrix(periodId, filters = {}) {
    let query = `
      SELECT 
        et.id as epp_type_id,
        et.name as epp_type,
        s.id as size_id,
        s.name as size,
        pi.id as physical_inventory_id,
        COALESCE(cis.quantity, 0) as initial_stock,
        COALESCE(inc.total, 0) as incomes,
        COALESCE(del.total, 0) as deliveries,
        COALESCE(lau.total, 0) as laundry_received,
        (COALESCE(cis.quantity, 0) + COALESCE(inc.total, 0) + COALESCE(lau.total, 0) - COALESCE(del.total, 0)) as systematic_stock,
        COALESCE(pi.quantity, 0) as physical_quantity,
        CASE 
          WHEN pi.id IS NOT NULL THEN 
            (COALESCE(pi.quantity, 0) - (COALESCE(cis.quantity, 0) + COALESCE(inc.total, 0) + COALESCE(lau.total, 0) - COALESCE(del.total, 0)))
          ELSE NULL
        END as difference,
        CASE 
          WHEN pi.id IS NULL THEN 'Sin inventario'
          WHEN (COALESCE(pi.quantity, 0) - (COALESCE(cis.quantity, 0) + COALESCE(inc.total, 0) + COALESCE(lau.total, 0) - COALESCE(del.total, 0))) = 0 THEN 'Coincide'
          WHEN (COALESCE(pi.quantity, 0) - (COALESCE(cis.quantity, 0) + COALESCE(inc.total, 0) + COALESCE(lau.total, 0) - COALESCE(del.total, 0))) < 0 THEN 'Pérdida'
          ELSE 'Sobrante'
        END as status,
        pi.inventory_date as inventory_date,
        pi.observation as observation
      FROM epp_type_sizes ets
      JOIN epp_types et ON ets.epp_type_id = et.id
      JOIN sizes s ON ets.size_id = s.id
      LEFT JOIN clean_inventory_initial_stock cis ON cis.period_id = ? AND cis.epp_type_id = et.id AND cis.size_id = s.id
      LEFT JOIN (SELECT epp_type_id, size_id, SUM(quantity) as total FROM incomes WHERE period_id = ? GROUP BY epp_type_id, size_id) inc ON inc.epp_type_id = et.id AND inc.size_id = s.id
      LEFT JOIN (SELECT epp_type_id, size_id, SUM(quantity) as total FROM deliveries WHERE period_id = ? GROUP BY epp_type_id, size_id) del ON del.epp_type_id = et.id AND del.size_id = s.id
      LEFT JOIN (SELECT epp_type_id, size_id, SUM(quantity) as total FROM laundry_movements WHERE period_id = ? AND status = 'lavado' GROUP BY epp_type_id, size_id) lau ON lau.epp_type_id = et.id AND lau.size_id = s.id
      LEFT JOIN physical_inventories pi ON pi.period_id = ? AND pi.epp_type_id = et.id AND pi.size_id = s.id
      WHERE ets.is_active = 1 AND et.is_active = 1 AND s.is_active = 1
    `;
    const params = [periodId, periodId, periodId, periodId, periodId];

    if (filters.epp_type_id) { query += ' AND et.id = ?'; params.push(filters.epp_type_id); }
    if (filters.size_id) { query += ' AND s.id = ?'; params.push(filters.size_id); }
    if (filters.estado_conciliacion) {
      if (filters.estado_conciliacion === 'sin_inventario') {
        query += ' AND pi.id IS NULL';
      } else if (filters.estado_conciliacion === 'coincide') {
        query += ' AND pi.id IS NOT NULL AND (pi.quantity - (COALESCE(cis.quantity, 0) + COALESCE(inc.total, 0) + COALESCE(lau.total, 0) - COALESCE(del.total, 0))) = 0';
      } else if (filters.estado_conciliacion === 'perdida') {
        query += ' AND pi.id IS NOT NULL AND (pi.quantity - (COALESCE(cis.quantity, 0) + COALESCE(inc.total, 0) + COALESCE(lau.total, 0) - COALESCE(del.total, 0))) < 0';
      } else if (filters.estado_conciliacion === 'sobrante') {
        query += ' AND pi.id IS NOT NULL AND (pi.quantity - (COALESCE(cis.quantity, 0) + COALESCE(inc.total, 0) + COALESCE(lau.total, 0) - COALESCE(del.total, 0))) > 0';
      }
    }
    if (filters.date_from) { query += ' AND (pi.inventory_date >= ? OR pi.inventory_date IS NULL)'; params.push(filters.date_from); }
    if (filters.date_to) { query += ' AND (pi.inventory_date <= ? OR pi.inventory_date IS NULL)'; params.push(filters.date_to); }

    query += ' ORDER BY et.name, s.name';

    const [rows] = await db.query(query, params);
    return rows;
  }

  static async setInitialStock(periodId, eppTypeId, sizeId, quantity, userId) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [existing] = await conn.query(
        'SELECT * FROM clean_inventory_initial_stock WHERE period_id = ? AND epp_type_id = ? AND size_id = ?',
        [periodId, eppTypeId, sizeId]
      );

      let oldValues = null;
      if (existing[0]) {
        oldValues = { quantity: existing[0].quantity };
        await conn.query(
          'UPDATE clean_inventory_initial_stock SET quantity = ?, created_by = ? WHERE id = ?',
          [quantity, userId, existing[0].id]
        );
      } else {
        await conn.query(
          'INSERT INTO clean_inventory_initial_stock (period_id, epp_type_id, size_id, quantity, created_by) VALUES (?, ?, ?, ?, ?)',
          [periodId, eppTypeId, sizeId, quantity, userId]
        );
      }

      // Register kardex
      await conn.query(
        `INSERT INTO inventory_movements (period_id, movement_type, epp_type_id, size_id, quantity, direction, reference_type, observation, created_by)
         VALUES (?, 'stock_inicial', ?, ?, ?, 'in', 'initial_stock', ?, ?)`,
        [periodId, eppTypeId, sizeId, quantity, `Stock inicial establecido: ${quantity}`, userId]
      );

      await conn.commit();
      return { oldValues, quantity };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}

module.exports = CleanInventoryModel;
