const db = require('../config/db');

class AuditModel {
  static async log({ user_id, action, module, entity, entity_id, old_values, new_values, ip_address }) {
    await db.query(
      `INSERT INTO audit_logs (user_id, action, module, entity, entity_id, old_values, new_values, ip_address) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id || null,
        action,
        module,
        entity || null,
        entity_id || null,
        old_values ? JSON.stringify(old_values) : null,
        new_values ? JSON.stringify(new_values) : null,
        ip_address || null
      ]
    );
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT al.*, u.full_name as user_name 
      FROM audit_logs al 
      LEFT JOIN users u ON al.user_id = u.id 
      WHERE 1=1
    `;
    const params = [];

    if (filters.module) { query += ' AND al.module = ?'; params.push(filters.module); }
    if (filters.entity) { query += ' AND al.entity = ?'; params.push(filters.entity); }
    if (filters.action) { query += ' AND al.action = ?'; params.push(filters.action); }
    if (filters.user_id) { query += ' AND al.user_id = ?'; params.push(filters.user_id); }
    if (filters.date_from) { query += ' AND al.created_at >= ?'; params.push(filters.date_from); }
    if (filters.date_to) { query += ' AND al.created_at <= ?'; params.push(filters.date_to + ' 23:59:59'); }
    if (filters.search) {
      query += ' AND (al.entity LIKE ? OR al.action LIKE ? OR u.full_name LIKE ?)';
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }

    // Count total
    const [countResult] = await db.query(
      query.replace('SELECT al.*, u.full_name as user_name', 'SELECT COUNT(*) as total'),
      params
    );
    const total = countResult[0].total;

    // Pagination
    const page = parseInt(filters.page, 10) || 1;
    const limit = parseInt(filters.limit, 10) || 20;
    const offset = (page - 1) * limit;

    query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await db.query(query, params);

    return { data: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

module.exports = AuditModel;
