const db = require('../config/db');

class MovementModel {
  static async findAll(filters = {}) {
    let query = `
      SELECT im.*, 
        et.name as epp_name, s.name as size_name,
        w.full_name as worker_name,
        u.full_name as created_by_name
      FROM inventory_movements im
      JOIN epp_types et ON im.epp_type_id = et.id
      JOIN sizes s ON im.size_id = s.id
      LEFT JOIN workers w ON im.worker_id = w.id
      LEFT JOIN users u ON im.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.period_id) { query += ' AND im.period_id = ?'; params.push(filters.period_id); }
    if (filters.movement_type) { query += ' AND im.movement_type = ?'; params.push(filters.movement_type); }
    if (filters.epp_type_id) { query += ' AND im.epp_type_id = ?'; params.push(filters.epp_type_id); }
    if (filters.size_id) { query += ' AND im.size_id = ?'; params.push(filters.size_id); }
    if (filters.worker_id) { query += ' AND im.worker_id = ?'; params.push(filters.worker_id); }
    if (filters.created_by) { query += ' AND im.created_by = ?'; params.push(filters.created_by); }
    if (filters.direction) { query += ' AND im.direction = ?'; params.push(filters.direction); }
    if (filters.date_from) { query += ' AND im.movement_date >= ?'; params.push(filters.date_from); }
    if (filters.date_to) { query += ' AND im.movement_date <= ?'; params.push(filters.date_to + ' 23:59:59'); }
    if (filters.quantity_min) { query += ' AND im.quantity >= ?'; params.push(filters.quantity_min); }
    if (filters.quantity_max) { query += ' AND im.quantity <= ?'; params.push(filters.quantity_max); }
    if (filters.search) {
      query += ' AND (im.observation LIKE ? OR im.movement_type LIKE ? OR et.name LIKE ? OR w.full_name LIKE ?)';
      const s = `%${filters.search}%`;
      params.push(s, s, s, s);
    }

    const [countResult] = await db.query(
      query.replace(/SELECT im\.[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM'),
      params
    );
    const total = countResult[0].total;

    const page = parseInt(filters.page, 10) || 1;
    const limit = parseInt(filters.limit, 10) || 20;
    const offset = (page - 1) * limit;

    query += ' ORDER BY im.movement_date DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await db.query(query, params);
    return { data: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

module.exports = MovementModel;
