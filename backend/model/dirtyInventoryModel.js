const db = require('../config/db');

class DirtyInventoryModel {
  static async getMatrix(periodId, filters = {}) {
    let query = `
      SELECT 
        et.id as epp_type_id,
        et.name as epp_type_name,
        s.id as size_id,
        s.name as size_name,
        COALESCE(ret.total, 0) as returned,
        COALESCE(pl.total, 0) as pending_laundry,
        COALESCE(ml.total, 0) as in_process,
        COALESCE(lv.total, 0) as washed,
        GREATEST(0, COALESCE(ret.total, 0) - COALESCE(pl.total, 0) - COALESCE(ml.total, 0) - COALESCE(lv.total, 0)) as unclassified,
        CASE
          WHEN GREATEST(0, COALESCE(ret.total, 0) - COALESCE(pl.total, 0) - COALESCE(ml.total, 0) - COALESCE(lv.total, 0)) > 0 THEN 'sucio'
          WHEN COALESCE(pl.total, 0) > 0 THEN 'pendiente'
          WHEN COALESCE(ml.total, 0) > 0 THEN 'pendiente'
          WHEN COALESCE(lv.total, 0) > 0 THEN 'lavado'
          ELSE NULL
        END as classification
      FROM epp_type_sizes ets
      JOIN epp_types et ON ets.epp_type_id = et.id
      JOIN sizes s ON ets.size_id = s.id
      LEFT JOIN (
        SELECT epp_type_id, size_id, SUM(quantity) as total 
        FROM returns WHERE period_id = ? 
        GROUP BY epp_type_id, size_id
      ) ret ON ret.epp_type_id = et.id AND ret.size_id = s.id
      LEFT JOIN (
        SELECT epp_type_id, size_id, SUM(quantity) as total 
        FROM laundry_movements WHERE period_id = ? AND status = 'para_lavar'
        GROUP BY epp_type_id, size_id
      ) pl ON pl.epp_type_id = et.id AND pl.size_id = s.id
      LEFT JOIN (
        SELECT epp_type_id, size_id, SUM(quantity) as total 
        FROM laundry_movements WHERE period_id = ? AND status = 'mandado_lavar'
        GROUP BY epp_type_id, size_id
      ) ml ON ml.epp_type_id = et.id AND ml.size_id = s.id
      LEFT JOIN (
        SELECT epp_type_id, size_id, SUM(quantity) as total 
        FROM laundry_movements WHERE period_id = ? AND status = 'lavado'
        GROUP BY epp_type_id, size_id
      ) lv ON lv.epp_type_id = et.id AND lv.size_id = s.id
      WHERE ets.is_active = 1 AND et.is_active = 1 AND s.is_active = 1
    `;
    const params = [periodId, periodId, periodId, periodId];

    if (filters.epp_type_id) { query += ' AND et.id = ?'; params.push(filters.epp_type_id); }
    if (filters.size_id) { query += ' AND s.id = ?'; params.push(filters.size_id); }

    query += ' ORDER BY et.name, s.name';

    const [rows] = await db.query(query, params);
    return rows;
  }

  static async classifyItems(periodId, eppTypeId, sizeId, status, userId) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Calculate unclassified items for this row
      const [retResult] = await conn.query(
        'SELECT COALESCE(SUM(quantity), 0) as total FROM returns WHERE period_id = ? AND epp_type_id = ? AND size_id = ?',
        [periodId, eppTypeId, sizeId]
      );
      const returned = retResult[0].total;

      const [plResult] = await conn.query(
        "SELECT COALESCE(SUM(quantity), 0) as total FROM laundry_movements WHERE period_id = ? AND epp_type_id = ? AND size_id = ? AND status = 'para_lavar'",
        [periodId, eppTypeId, sizeId]
      );
      const pendingLaundry = plResult[0].total;

      const [mlResult] = await conn.query(
        "SELECT COALESCE(SUM(quantity), 0) as total FROM laundry_movements WHERE period_id = ? AND epp_type_id = ? AND size_id = ? AND status = 'mandado_lavar'",
        [periodId, eppTypeId, sizeId]
      );
      const inProcess = mlResult[0].total;

      const [lvResult] = await conn.query(
        "SELECT COALESCE(SUM(quantity), 0) as total FROM laundry_movements WHERE period_id = ? AND epp_type_id = ? AND size_id = ? AND status = 'lavado'",
        [periodId, eppTypeId, sizeId]
      );
      const washed = lvResult[0].total;

      const unclassified = Math.max(0, returned - pendingLaundry - inProcess - washed);

      if (unclassified <= 0) {
        await conn.rollback();
        throw Object.assign(new Error('No hay elementos sin clasificar para este EPP y talla'), { statusCode: 400 });
      }

      // Create laundry_movement with the selected status
      const laundryStatus = status === 'lavado' ? 'lavado' : status === 'pendiente' ? 'para_lavar' : 'para_lavar';

      const [result] = await conn.query(
        `INSERT INTO laundry_movements (period_id, epp_type_id, size_id, quantity, status, movement_date, observation, created_by)
         VALUES (?, ?, ?, ?, ?, CURDATE(), ?, ?)`,
        [periodId, eppTypeId, sizeId, unclassified, laundryStatus,
         status === 'sucio' ? 'Marcado como sucio - sin procesar' : `Clasificado como ${status}`, userId]
      );

      // Register kardex movement
      await conn.query(
        `INSERT INTO inventory_movements (period_id, movement_type, epp_type_id, size_id, quantity, direction, reference_id, reference_type, observation, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'laundry', ?, ?)`,
        [periodId, `clasificacion_${status}`, eppTypeId, sizeId, unclassified,
         status === 'lavado' ? 'in' : 'out', result.insertId,
         `Clasificación: ${status} - ${unclassified} unidades`, userId]
      );

      await conn.commit();
      return { unclassified, status: laundryStatus };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}

module.exports = DirtyInventoryModel;
