const db = require('../config/db');
const IncomeModel = require('../model/incomeModel');
const AuditModel = require('../model/auditModel');

class IncomeService {
  static async getAll(filters) {
    if (!filters.period_id) {
      const [rows] = await db.query('SELECT id FROM periods WHERE is_active = 1 LIMIT 1');
      if (rows.length) filters.period_id = rows[0].id;
      else throw Object.assign(new Error('Se requiere un período activo'), { statusCode: 400 });
    }
    const result = await IncomeModel.findAll(filters);
    return result.data || result;
  }

  static async getById(id) {
    const item = await IncomeModel.findById(id);
    if (!item) throw Object.assign(new Error('Ingreso no encontrado'), { statusCode: 404 });
    return item;
  }

  static async create(data, userId) {
    const id = await IncomeModel.create({ ...data, created_by: userId });
    await AuditModel.log({
      user_id: userId, action: 'crear', module: 'ingresos', entity: 'income', entity_id: id,
      new_values: { epp_type_id: data.epp_type_id, size_id: data.size_id, quantity: data.quantity }
    });
    return id;
  }

  static async update(id, data, userId) {
    const existing = await IncomeModel.findById(id);
    if (!existing) throw Object.assign(new Error('Ingreso no encontrado'), { statusCode: 404 });
    await IncomeModel.update(id, data, userId);
    await AuditModel.log({
      user_id: userId, action: 'editar', module: 'ingresos', entity: 'income', entity_id: id,
      old_values: existing, new_values: data
    });
  }

  static async delete(id, userId) {
    const existing = await IncomeModel.findById(id);
    if (!existing) throw Object.assign(new Error('Ingreso no encontrado'), { statusCode: 404 });
    await IncomeModel.delete(id, userId);
    await AuditModel.log({
      user_id: userId, action: 'eliminar', module: 'ingresos', entity: 'income', entity_id: id,
      old_values: existing
    });
  }
}

module.exports = IncomeService;
