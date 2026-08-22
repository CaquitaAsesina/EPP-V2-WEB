const db = require('../config/db');

class DashboardModel {
  static async getKPIs(periodId) {
    if (!periodId) return null;

    const [cleanStock] = await db.query(`
      SELECT COALESCE(SUM(ci.quantity + inc.total + lau.total - del.total), 0) as total
      FROM epp_type_sizes ets
      JOIN epp_types et ON ets.epp_type_id = et.id
      JOIN sizes s ON ets.size_id = s.id
      LEFT JOIN clean_inventory_initial_stock ci ON ci.period_id = ? AND ci.epp_type_id = et.id AND ci.size_id = s.id
      LEFT JOIN (SELECT epp_type_id, size_id, SUM(quantity) as total FROM incomes WHERE period_id = ? GROUP BY epp_type_id, size_id) inc ON inc.epp_type_id = et.id AND inc.size_id = s.id
      LEFT JOIN (SELECT epp_type_id, size_id, SUM(quantity) as total FROM deliveries WHERE period_id = ? GROUP BY epp_type_id, size_id) del ON del.epp_type_id = et.id AND del.size_id = s.id
      LEFT JOIN (SELECT epp_type_id, size_id, SUM(quantity) as total FROM laundry_movements WHERE period_id = ? AND status = 'lavado' GROUP BY epp_type_id, size_id) lau ON lau.epp_type_id = et.id AND lau.size_id = s.id
      WHERE ets.is_active = 1 AND et.is_active = 1 AND s.is_active = 1
    `, [periodId, periodId, periodId, periodId]);

    const [dirtyStock] = await db.query(`
      SELECT COALESCE(SUM(pl.total), 0) as total
      FROM (SELECT epp_type_id, size_id, SUM(quantity) as total FROM laundry_movements WHERE period_id = ? AND status = 'para_lavar' GROUP BY epp_type_id, size_id) pl
    `, [periodId]);

    const [washingStock] = await db.query(`
      SELECT COALESCE(SUM(ml.total), 0) as total
      FROM (SELECT epp_type_id, size_id, SUM(quantity) as total FROM laundry_movements WHERE period_id = ? AND status = 'mandado_lavar' GROUP BY epp_type_id, size_id) ml
    `, [periodId]);

    const [totalDeliveries] = await db.query(
      'SELECT COALESCE(SUM(quantity), 0) as total FROM deliveries WHERE period_id = ?', [periodId]
    );

    const [totalIncomes] = await db.query(
      'SELECT COALESCE(SUM(quantity), 0) as total FROM incomes WHERE period_id = ?', [periodId]
    );

    const [totalReturns] = await db.query(
      'SELECT COALESCE(SUM(quantity), 0) as total FROM returns WHERE period_id = ?', [periodId]
    );

    // Calculate losses from physical inventory comparisons
    const [losses] = await db.query(`
      SELECT COALESCE(ABS(SUM(
        CASE WHEN (pi.quantity - (COALESCE(cis.quantity, 0) + COALESCE(inc.total, 0) + COALESCE(lau.total, 0) - COALESCE(del.total, 0))) < 0
        THEN (pi.quantity - (COALESCE(cis.quantity, 0) + COALESCE(inc.total, 0) + COALESCE(lau.total, 0) - COALESCE(del.total, 0)))
        ELSE 0 END
      )), 0) as total
      FROM physical_inventories pi
      LEFT JOIN clean_inventory_initial_stock cis ON cis.period_id = pi.period_id AND cis.epp_type_id = pi.epp_type_id AND cis.size_id = pi.size_id
      LEFT JOIN (SELECT period_id, epp_type_id, size_id, SUM(quantity) as total FROM incomes WHERE period_id = ? GROUP BY period_id, epp_type_id, size_id) inc ON inc.period_id = pi.period_id AND inc.epp_type_id = pi.epp_type_id AND inc.size_id = pi.size_id
      LEFT JOIN (SELECT period_id, epp_type_id, size_id, SUM(quantity) as total FROM deliveries WHERE period_id = ? GROUP BY period_id, epp_type_id, size_id) del ON del.period_id = pi.period_id AND del.epp_type_id = pi.epp_type_id AND del.size_id = pi.size_id
      LEFT JOIN (SELECT period_id, epp_type_id, size_id, SUM(quantity) as total FROM laundry_movements WHERE period_id = ? AND status = 'lavado' GROUP BY period_id, epp_type_id, size_id) lau ON lau.period_id = pi.period_id AND lau.epp_type_id = pi.epp_type_id AND lau.size_id = pi.size_id
      WHERE pi.period_id = ?
    `, [periodId, periodId, periodId, periodId]);

    return {
      clean_stock: cleanStock[0].total,
      dirty_stock: dirtyStock[0].total,
      washing_stock: washingStock[0].total,
      total_deliveries: totalDeliveries[0].total,
      total_incomes: totalIncomes[0].total,
      total_returns: totalReturns[0].total,
      losses: Math.abs(losses[0].total)
    };
  }

  static async getCleanStockByType(periodId) {
    const [rows] = await db.query(`
      SELECT et.name as epp_name,
        COALESCE(SUM(ci.quantity + inc.total + lau.total - del.total), 0) as stock
      FROM epp_types et
      LEFT JOIN clean_inventory_initial_stock ci ON ci.period_id = ? AND ci.epp_type_id = et.id
      LEFT JOIN (SELECT epp_type_id, SUM(quantity) as total FROM incomes WHERE period_id = ? GROUP BY epp_type_id) inc ON inc.epp_type_id = et.id
      LEFT JOIN (SELECT epp_type_id, SUM(quantity) as total FROM deliveries WHERE period_id = ? GROUP BY epp_type_id) del ON del.epp_type_id = et.id
      LEFT JOIN (SELECT epp_type_id, SUM(quantity) as total FROM laundry_movements WHERE period_id = ? AND status = 'lavado' GROUP BY epp_type_id) lau ON lau.epp_type_id = et.id
      WHERE et.is_active = 1
      GROUP BY et.id, et.name
      ORDER BY et.name
    `, [periodId, periodId, periodId, periodId]);
    return rows;
  }

  static async getStockBySize(periodId) {
    const [rows] = await db.query(`
      SELECT s.name as size_name,
        COALESCE(SUM(ci.quantity + inc.total + lau.total - del.total), 0) as stock
      FROM sizes s
      LEFT JOIN clean_inventory_initial_stock ci ON ci.period_id = ? AND ci.size_id = s.id
      LEFT JOIN (SELECT size_id, SUM(quantity) as total FROM incomes WHERE period_id = ? GROUP BY size_id) inc ON inc.size_id = s.id
      LEFT JOIN (SELECT size_id, SUM(quantity) as total FROM deliveries WHERE period_id = ? GROUP BY size_id) del ON del.size_id = s.id
      LEFT JOIN (SELECT size_id, SUM(quantity) as total FROM laundry_movements WHERE period_id = ? AND status = 'lavado' GROUP BY size_id) lau ON lau.size_id = s.id
      WHERE s.is_active = 1
      GROUP BY s.id, s.name
      ORDER BY s.name
    `, [periodId, periodId, periodId, periodId]);
    return rows;
  }

  static async getDeliveriesAndIncomesByDate(periodId) {
    const [rows] = await db.query(`
      SELECT date_range.delivery_date as date,
        COALESCE(d.total, 0) as entregas,
        COALESCE(i.total, 0) as ingresos
      FROM (
        SELECT delivery_date as date FROM deliveries WHERE period_id = ?
        UNION
        SELECT reception_date as date FROM incomes WHERE period_id = ?
      ) date_range
      LEFT JOIN (SELECT delivery_date, SUM(quantity) as total FROM deliveries WHERE period_id = ? GROUP BY delivery_date) d ON d.delivery_date = date_range.date
      LEFT JOIN (SELECT reception_date, SUM(quantity) as total FROM incomes WHERE period_id = ? GROUP BY reception_date) i ON i.reception_date = date_range.date
      GROUP BY date_range.date
      ORDER BY date_range.date
    `, [periodId, periodId, periodId, periodId]);
    return rows;
  }

  static async getDirtyStatusByType(periodId) {
    const [rows] = await db.query(`
      SELECT et.name as epp_name,
        COALESCE(pl.total, 0) as para_lavar,
        COALESCE(ml.total, 0) as en_proceso,
        COALESCE(lv.total, 0) as lavados
      FROM epp_types et
      LEFT JOIN (SELECT epp_type_id, SUM(quantity) as total FROM laundry_movements WHERE period_id = ? AND status = 'para_lavar' GROUP BY epp_type_id) pl ON pl.epp_type_id = et.id
      LEFT JOIN (SELECT epp_type_id, SUM(quantity) as total FROM laundry_movements WHERE period_id = ? AND status = 'mandado_lavar' GROUP BY epp_type_id) ml ON ml.epp_type_id = et.id
      LEFT JOIN (SELECT epp_type_id, SUM(quantity) as total FROM laundry_movements WHERE period_id = ? AND status = 'lavado' GROUP BY epp_type_id) lv ON lv.epp_type_id = et.id
      WHERE et.is_active = 1
      GROUP BY et.id, et.name
      ORDER BY et.name
    `, [periodId, periodId, periodId]);
    return rows;
  }
}

module.exports = DashboardModel;
