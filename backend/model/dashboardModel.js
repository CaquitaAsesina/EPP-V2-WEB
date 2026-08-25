const db = require('../config/db');

class DashboardModel {

  /* ── KPIs ─────────────────────────────────────── */
  static async getKPIs(periodId) {
    if (!periodId) return null;

    const [[cleanStock]] = await db.query(`
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

    const [[dirtyStock]] = await db.query(
      'SELECT COALESCE(SUM(quantity), 0) as total FROM laundry_movements WHERE period_id = ? AND status = ?',
      [periodId, 'para_lavar']
    );

    const [[washingStock]] = await db.query(
      'SELECT COALESCE(SUM(quantity), 0) as total FROM laundry_movements WHERE period_id = ? AND status = ?',
      [periodId, 'mandado_lavar']
    );

    const [[totalDeliveries]] = await db.query(
      'SELECT COALESCE(SUM(quantity), 0) as total FROM deliveries WHERE period_id = ?', [periodId]
    );

    const [[totalIncomes]] = await db.query(
      'SELECT COALESCE(SUM(quantity), 0) as total FROM incomes WHERE period_id = ?', [periodId]
    );

    const [[totalReturns]] = await db.query(
      'SELECT COALESCE(SUM(quantity), 0) as total FROM returns WHERE period_id = ?', [periodId]
    );

    const [[totalWorkers]] = await db.query(
      'SELECT COUNT(DISTINCT worker_id) as total FROM deliveries WHERE period_id = ?', [periodId]
    );

    const [[losses]] = await db.query(`
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

    const [[surplus]] = await db.query(`
      SELECT COALESCE(SUM(
        CASE WHEN (pi.quantity - (COALESCE(cis.quantity, 0) + COALESCE(inc.total, 0) + COALESCE(lau.total, 0) - COALESCE(del.total, 0))) > 0
        THEN (pi.quantity - (COALESCE(cis.quantity, 0) + COALESCE(inc.total, 0) + COALESCE(lau.total, 0) - COALESCE(del.total, 0)))
        ELSE 0 END
      ), 0) as total
      FROM physical_inventories pi
      LEFT JOIN clean_inventory_initial_stock cis ON cis.period_id = pi.period_id AND cis.epp_type_id = pi.epp_type_id AND cis.size_id = pi.size_id
      LEFT JOIN (SELECT period_id, epp_type_id, size_id, SUM(quantity) as total FROM incomes WHERE period_id = ? GROUP BY period_id, epp_type_id, size_id) inc ON inc.period_id = pi.period_id AND inc.epp_type_id = pi.epp_type_id AND inc.size_id = pi.size_id
      LEFT JOIN (SELECT period_id, epp_type_id, size_id, SUM(quantity) as total FROM deliveries WHERE period_id = ? GROUP BY period_id, epp_type_id, size_id) del ON del.period_id = pi.period_id AND del.epp_type_id = pi.epp_type_id AND del.size_id = pi.size_id
      LEFT JOIN (SELECT period_id, epp_type_id, size_id, SUM(quantity) as total FROM laundry_movements WHERE period_id = ? AND status = 'lavado' GROUP BY period_id, epp_type_id, size_id) lau ON lau.period_id = pi.period_id AND lau.epp_type_id = pi.epp_type_id AND lau.size_id = pi.size_id
      WHERE pi.period_id = ?
    `, [periodId, periodId, periodId, periodId]);

    const totalMovement = Number(totalIncomes.total) + Number(totalReturns.total);
    const lossRate = totalMovement > 0 ? ((Number(losses.total) / totalMovement) * 100).toFixed(1) : '0.0';

    return {
      clean_stock: cleanStock.total,
      dirty_stock: dirtyStock.total,
      washing_stock: washingStock.total,
      total_deliveries: totalDeliveries.total,
      total_incomes: totalIncomes.total,
      total_returns: totalReturns.total,
      total_workers: totalWorkers.total,
      losses: Math.abs(losses.total),
      surplus: Number(surplus.total),
      loss_rate: parseFloat(lossRate)
    };
  }

  /* ── Stock por tipo EPP ───────────────────────── */
  static async getCleanStockByType(periodId) {
    const [rows] = await db.query(`
      SELECT et.name as epp_type,
        COALESCE(SUM(ci.quantity + inc.total + lau.total - del.total), 0) as stock,
        COALESCE(SUM(ci.quantity), 0) as initial,
        COALESCE(SUM(inc.total), 0) as incomes,
        COALESCE(SUM(del.total), 0) as deliveries,
        COALESCE(SUM(lau.total), 0) as laundry
      FROM epp_types et
      LEFT JOIN clean_inventory_initial_stock ci ON ci.period_id = ? AND ci.epp_type_id = et.id
      LEFT JOIN (SELECT epp_type_id, SUM(quantity) as total FROM incomes WHERE period_id = ? GROUP BY epp_type_id) inc ON inc.epp_type_id = et.id
      LEFT JOIN (SELECT epp_type_id, SUM(quantity) as total FROM deliveries WHERE period_id = ? GROUP BY epp_type_id) del ON del.epp_type_id = et.id
      LEFT JOIN (SELECT epp_type_id, SUM(quantity) as total FROM laundry_movements WHERE period_id = ? AND status = 'lavado' GROUP BY epp_type_id) lau ON lau.epp_type_id = et.id
      WHERE et.is_active = 1
      GROUP BY et.id, et.name
      ORDER BY stock DESC
    `, [periodId, periodId, periodId, periodId]);
    return rows;
  }

  /* ── Stock por talla ──────────────────────────── */
  static async getStockBySize(periodId) {
    const [rows] = await db.query(`
      SELECT s.name as size,
        COALESCE(SUM(ci.quantity + inc.total + lau.total - del.total), 0) as stock
      FROM sizes s
      LEFT JOIN clean_inventory_initial_stock ci ON ci.period_id = ? AND ci.size_id = s.id
      LEFT JOIN (SELECT size_id, SUM(quantity) as total FROM incomes WHERE period_id = ? GROUP BY size_id) inc ON inc.size_id = s.id
      LEFT JOIN (SELECT size_id, SUM(quantity) as total FROM deliveries WHERE period_id = ? GROUP BY size_id) del ON del.size_id = s.id
      LEFT JOIN (SELECT size_id, SUM(quantity) as total FROM laundry_movements WHERE period_id = ? AND status = 'lavado' GROUP BY size_id) lau ON lau.size_id = s.id
      WHERE s.is_active = 1
      GROUP BY s.id, s.name
      ORDER BY stock DESC
    `, [periodId, periodId, periodId, periodId]);
    return rows;
  }

  /* ── Timeline Ingresos vs Entregas ────────────── */
  static async getDeliveriesAndIncomesByDate(periodId) {
    const [rows] = await db.query(`
      SELECT date_range.date,
        COALESCE(d.total, 0) as entregas,
        COALESCE(i.total, 0) as ingresos,
        COALESCE(r.total, 0) as devoluciones
      FROM (
        SELECT delivery_date as date FROM deliveries WHERE period_id = ?
        UNION
        SELECT reception_date as date FROM incomes WHERE period_id = ?
        UNION
        SELECT return_date as date FROM returns WHERE period_id = ?
      ) date_range
      LEFT JOIN (SELECT delivery_date, SUM(quantity) as total FROM deliveries WHERE period_id = ? GROUP BY delivery_date) d ON d.delivery_date = date_range.date
      LEFT JOIN (SELECT reception_date, SUM(quantity) as total FROM incomes WHERE period_id = ? GROUP BY reception_date) i ON i.reception_date = date_range.date
      LEFT JOIN (SELECT return_date, SUM(quantity) as total FROM returns WHERE period_id = ? GROUP BY return_date) r ON r.return_date = date_range.date
      GROUP BY date_range.date
      ORDER BY date_range.date
    `, [periodId, periodId, periodId, periodId, periodId, periodId]);
    return rows;
  }

  /* ── Estado EPP Sucio por tipo ────────────────── */
  static async getDirtyStatusByType(periodId) {
    const [rows] = await db.query(`
      SELECT et.name as epp_type,
        COALESCE(pl.total, 0) as para_lavar,
        COALESCE(ml.total, 0) as en_proceso,
        COALESCE(lv.total, 0) as lavados
      FROM epp_types et
      LEFT JOIN (SELECT epp_type_id, SUM(quantity) as total FROM laundry_movements WHERE period_id = ? AND status = 'para_lavar' GROUP BY epp_type_id) pl ON pl.epp_type_id = et.id
      LEFT JOIN (SELECT epp_type_id, SUM(quantity) as total FROM laundry_movements WHERE period_id = ? AND status = 'mandado_lavar' GROUP BY epp_type_id) ml ON ml.epp_type_id = et.id
      LEFT JOIN (SELECT epp_type_id, SUM(quantity) as total FROM laundry_movements WHERE period_id = ? AND status = 'lavado' GROUP BY epp_type_id) lv ON lv.epp_type_id = et.id
      WHERE et.is_active = 1
      GROUP BY et.id, et.name
      ORDER BY (COALESCE(pl.total, 0) + COALESCE(ml.total, 0)) DESC
    `, [periodId, periodId, periodId]);
    return rows;
  }

  /* ── Top trabajadores por entregas ────────────── */
  static async getTopWorkers(periodId) {
    const [rows] = await db.query(`
      SELECT w.full_name as worker_name,
        COUNT(d.id) as delivery_count,
        SUM(d.quantity) as total_units
      FROM deliveries d
      JOIN workers w ON d.worker_id = w.id
      WHERE d.period_id = ?
      GROUP BY d.worker_id, w.full_name
      ORDER BY total_units DESC
      LIMIT 8
    `, [periodId]);
    return rows;
  }

  /* ── Alertas de stock bajo ────────────────────── */
  static async getLowStockAlerts(periodId) {
    const [rows] = await db.query(`
      SELECT et.name as epp_type, s.name as size,
        COALESCE(SUM(ci.quantity + inc.total + lau.total - del.total), 0) as current_stock,
        COALESCE(SUM(del.total), 0) as total_delivered
      FROM epp_type_sizes ets
      JOIN epp_types et ON ets.epp_type_id = et.id
      JOIN sizes s ON ets.size_id = s.id
      LEFT JOIN clean_inventory_initial_stock ci ON ci.period_id = ? AND ci.epp_type_id = et.id AND ci.size_id = s.id
      LEFT JOIN (SELECT epp_type_id, size_id, SUM(quantity) as total FROM incomes WHERE period_id = ? GROUP BY epp_type_id, size_id) inc ON inc.epp_type_id = et.id AND inc.size_id = s.id
      LEFT JOIN (SELECT epp_type_id, size_id, SUM(quantity) as total FROM deliveries WHERE period_id = ? GROUP BY epp_type_id, size_id) del ON del.epp_type_id = et.id AND del.size_id = s.id
      LEFT JOIN (SELECT epp_type_id, size_id, SUM(quantity) as total FROM laundry_movements WHERE period_id = ? AND status = 'lavado' GROUP BY epp_type_id, size_id) lau ON lau.epp_type_id = et.id AND lau.size_id = s.id
      WHERE ets.is_active = 1 AND et.is_active = 1 AND s.is_active = 1
      GROUP BY et.id, et.name, s.id, s.name
      HAVING current_stock <= 2 AND total_delivered > 0
      ORDER BY current_stock ASC, total_delivered DESC
      LIMIT 6
    `, [periodId, periodId, periodId, periodId]);
    return rows;
  }

  /* ── Resumen del flujo de lavado ──────────────── */
  static async getLaundryFlow(periodId) {
    const [[totals]] = await db.query(`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'para_lavar' THEN quantity ELSE 0 END), 0) as pending,
        COALESCE(SUM(CASE WHEN status = 'mandado_lavar' THEN quantity ELSE 0 END), 0) as in_process,
        COALESCE(SUM(CASE WHEN status = 'lavado' THEN quantity ELSE 0 END), 0) as completed
      FROM laundry_movements WHERE period_id = ?
    `, [periodId]);
    return totals;
  }

  /* ── Actividad reciente ──────────────────────── */
  static async getRecentMovements(periodId) {
    const [rows] = await db.query(`
      SELECT
        im.movement_date as created_at,
        im.movement_type,
        im.quantity,
        im.direction,
        et.name as epp_type,
        s.name as size,
        u.full_name as user_name
      FROM inventory_movements im
      LEFT JOIN epp_types et ON im.epp_type_id = et.id
      LEFT JOIN sizes s ON im.size_id = s.id
      LEFT JOIN users u ON im.created_by = u.id
      WHERE im.period_id = ?
      ORDER BY im.id DESC
      LIMIT 20
    `, [periodId]);
    return rows;
  }

  /* ── Pérdidas por tipo EPP ────────────────────── */
  static async getLossesByType(periodId) {
    const [rows] = await db.query(`
      SELECT et.name as epp_type,
        ABS(COALESCE(SUM(
          CASE WHEN (pi.quantity - (COALESCE(cis.quantity, 0) + COALESCE(inc.total, 0) + COALESCE(lau.total, 0) - COALESCE(del.total, 0))) < 0
          THEN (pi.quantity - (COALESCE(cis.quantity, 0) + COALESCE(inc.total, 0) + COALESCE(lau.total, 0) - COALESCE(del.total, 0)))
          ELSE 0 END
        ), 0)) as losses
      FROM physical_inventories pi
      JOIN epp_types et ON pi.epp_type_id = et.id
      LEFT JOIN clean_inventory_initial_stock cis ON cis.period_id = pi.period_id AND cis.epp_type_id = pi.epp_type_id AND cis.size_id = pi.size_id
      LEFT JOIN (SELECT period_id, epp_type_id, size_id, SUM(quantity) as total FROM incomes WHERE period_id = ? GROUP BY period_id, epp_type_id, size_id) inc ON inc.period_id = pi.period_id AND inc.epp_type_id = pi.epp_type_id AND inc.size_id = pi.size_id
      LEFT JOIN (SELECT period_id, epp_type_id, size_id, SUM(quantity) as total FROM deliveries WHERE period_id = ? GROUP BY period_id, epp_type_id, size_id) del ON del.period_id = pi.period_id AND del.epp_type_id = pi.epp_type_id AND del.size_id = pi.size_id
      LEFT JOIN (SELECT period_id, epp_type_id, size_id, SUM(quantity) as total FROM laundry_movements WHERE period_id = ? AND status = 'lavado' GROUP BY period_id, epp_type_id, size_id) lau ON lau.period_id = pi.period_id AND lau.epp_type_id = pi.epp_type_id AND lau.size_id = pi.size_id
      WHERE pi.period_id = ?
      GROUP BY et.id, et.name
      HAVING losses > 0
      ORDER BY losses DESC
    `, [periodId, periodId, periodId, periodId]);
    return rows;
  }

  /* ── Tasa de rotación por tipo EPP ────────────── */
  static async getRotationRate(periodId) {
    const [rows] = await db.query(`
      SELECT et.name as epp_type,
        COALESCE(SUM(del.total), 0) as delivered,
        COALESCE(AVG(ci.quantity), 0) as avg_stock,
        CASE
          WHEN COALESCE(AVG(ci.quantity), 0) > 0
          THEN ROUND(COALESCE(SUM(del.total), 0) / AVG(ci.quantity), 2)
          ELSE 0
        END as turnover_rate
      FROM epp_types et
      LEFT JOIN clean_inventory_initial_stock ci ON ci.period_id = ? AND ci.epp_type_id = et.id
      LEFT JOIN (SELECT epp_type_id, SUM(quantity) as total FROM deliveries WHERE period_id = ? GROUP BY epp_type_id) del ON del.epp_type_id = et.id
      WHERE et.is_active = 1
      GROUP BY et.id, et.name
      HAVING delivered > 0
      ORDER BY turnover_rate DESC
    `, [periodId, periodId]);
    return rows;
  }
}

module.exports = DashboardModel;
