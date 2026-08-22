const LaundryModel = require('../model/laundryModel');
const AuditModel = require('../model/auditModel');

class LaundryService {
  static async getAll(filters) {
    if (!filters.period_id) {
      const db = require('../config/db');
      const [rows] = await db.query('SELECT id FROM periods WHERE is_active = 1 LIMIT 1');
      if (rows.length) filters.period_id = rows[0].id;
      else throw Object.assign(new Error('Se requiere un período activo'), { statusCode: 400 });
    }
    const result = await LaundryModel.findAll(filters);
    return result.data || result;
  }

  static async getById(id) {
    const item = await LaundryModel.findById(id);
    if (!item) throw Object.assign(new Error('Movimiento de lavado no encontrado'), { statusCode: 404 });
    return item;
  }

  static async create(data, userId) {
    const id = await LaundryModel.create({ ...data, created_by: userId });
    await AuditModel.log({
      user_id: userId, action: 'crear', module: 'lavado', entity: 'laundry_movement', entity_id: id,
      new_values: { epp_type_id: data.epp_type_id, size_id: data.size_id, quantity: data.quantity, status: data.status }
    });
    return id;
  }

  static async updateStatus(id, newStatus, observation, userId) {
    const existing = await LaundryModel.findById(id);
    if (!existing) throw Object.assign(new Error('Movimiento de lavado no encontrado'), { statusCode: 404 });
    await LaundryModel.updateStatus(id, newStatus, observation, userId);
    await AuditModel.log({
      user_id: userId, action: 'cambiar_estado', module: 'lavado', entity: 'laundry_movement', entity_id: id,
      old_values: { status: existing.status }, new_values: { status: newStatus }
    });
  }

  static async delete(id, userId) {
    const existing = await LaundryModel.findById(id);
    if (!existing) throw Object.assign(new Error('Movimiento de lavado no encontrado'), { statusCode: 404 });
    await LaundryModel.delete(id, userId);
    await AuditModel.log({
      user_id: userId, action: 'eliminar', module: 'lavado', entity: 'laundry_movement', entity_id: id,
      old_values: existing
    });
  }
}

module.exports = LaundryService;
