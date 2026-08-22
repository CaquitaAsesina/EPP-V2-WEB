const db = require('../config/db');
const DeliveryModel = require('../model/deliveryModel');
const AuditModel = require('../model/auditModel');

class DeliveryService {
  static async getAll(filters) {
    if (!filters.period_id) {
      const [rows] = await db.query('SELECT id FROM periods WHERE is_active = 1 LIMIT 1');
      if (rows.length) filters.period_id = rows[0].id;
      else throw Object.assign(new Error('Se requiere un período activo'), { statusCode: 400 });
    }
    const result = await DeliveryModel.findAll(filters);
    return result.data || result;
  }

  static async getById(id) {
    const item = await DeliveryModel.findById(id);
    if (!item) throw Object.assign(new Error('Entrega no encontrada'), { statusCode: 404 });
    return item;
  }

  static async create(data, userId) {
    const id = await DeliveryModel.create({ ...data, created_by: userId });
    await AuditModel.log({
      user_id: userId, action: 'crear', module: 'entregas', entity: 'delivery', entity_id: id,
      new_values: { epp_type_id: data.epp_type_id, size_id: data.size_id, worker_id: data.worker_id, quantity: data.quantity }
    });
    return id;
  }

  static async update(id, data, userId) {
    const existing = await DeliveryModel.findById(id);
    if (!existing) throw Object.assign(new Error('Entrega no encontrada'), { statusCode: 404 });
    await DeliveryModel.update(id, data, userId);
    await AuditModel.log({
      user_id: userId, action: 'editar', module: 'entregas', entity: 'delivery', entity_id: id,
      old_values: existing, new_values: data
    });
  }

  static async delete(id, userId) {
    const existing = await DeliveryModel.findById(id);
    if (!existing) throw Object.assign(new Error('Entrega no encontrada'), { statusCode: 404 });
    await DeliveryModel.delete(id, userId);
    await AuditModel.log({
      user_id: userId, action: 'eliminar', module: 'entregas', entity: 'delivery', entity_id: id,
      old_values: existing
    });
  }
}

module.exports = DeliveryService;
