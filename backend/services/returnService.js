const db = require('../config/db');
const ReturnModel = require('../model/returnModel');
const AuditModel = require('../model/auditModel');

class ReturnService {
  static async getAll(filters) {
    if (!filters.period_id) {
      const [rows] = await db.query('SELECT id FROM periods WHERE is_active = 1 LIMIT 1');
      if (rows.length) filters.period_id = rows[0].id;
      else throw Object.assign(new Error('Se requiere un período activo'), { statusCode: 400 });
    }
    const result = await ReturnModel.findAll(filters);
    return result.data || result;
  }

  static async getById(id) {
    const item = await ReturnModel.findById(id);
    if (!item) throw Object.assign(new Error('Devolución no encontrada'), { statusCode: 404 });
    return item;
  }

  static async create(data, userId) {
    const id = await ReturnModel.create({ ...data, created_by: userId });
    await AuditModel.log({
      user_id: userId, action: 'crear', module: 'devoluciones', entity: 'return', entity_id: id,
      new_values: { epp_type_id: data.epp_type_id, size_id: data.size_id, worker_id: data.worker_id, quantity: data.quantity }
    });
    return id;
  }

  static async update(id, data, userId) {
    const existing = await ReturnModel.findById(id);
    if (!existing) throw Object.assign(new Error('Devolución no encontrada'), { statusCode: 404 });
    await ReturnModel.update(id, data, userId);
    await AuditModel.log({
      user_id: userId, action: 'editar', module: 'devoluciones', entity: 'return', entity_id: id,
      old_values: existing, new_values: data
    });
  }

  static async delete(id, userId) {
    const existing = await ReturnModel.findById(id);
    if (!existing) throw Object.assign(new Error('Devolución no encontrada'), { statusCode: 404 });
    await ReturnModel.delete(id, userId);
    await AuditModel.log({
      user_id: userId, action: 'eliminar', module: 'devoluciones', entity: 'return', entity_id: id,
      old_values: existing
    });
  }
}

module.exports = ReturnService;
