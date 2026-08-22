const PeriodModel = require('../model/periodModel');
const AuditModel = require('../model/auditModel');
const db = require('../config/db');

class PeriodService {
  static async getAll() {
    return PeriodModel.findAll();
  }

  static async getActive() {
    return PeriodModel.findActive();
  }

  static async getById(id) {
    const period = await PeriodModel.findById(id);
    if (!period) throw Object.assign(new Error('Período no encontrado'), { statusCode: 404 });
    return period;
  }

  static async create(data, createdBy) {
    // Get active EPP type-size combinations
    const [combinations] = await db.query(
      'SELECT epp_type_id, size_id FROM epp_type_sizes WHERE is_active = 1'
    );

    const id = await PeriodModel.create({ ...data, created_by: createdBy });

    // Initialize all EPP/talla combinations with stock 0
    if (combinations.length > 0) {
      const values = combinations.map(c => `(${id}, ${c.epp_type_id}, ${c.size_id}, 0, ${createdBy})`).join(',');
      await db.query(
        `INSERT INTO clean_inventory_initial_stock (period_id, epp_type_id, size_id, quantity, created_by) VALUES ${values}`
      );
    }

    await AuditModel.log({
      user_id: createdBy,
      action: 'crear',
      module: 'periodos',
      entity: 'period',
      entity_id: id,
      new_values: data
    });

    return id;
  }

  static async update(id, data, userId) {
    const existing = await PeriodModel.findById(id);
    if (!existing) throw Object.assign(new Error('Período no encontrado'), { statusCode: 404 });

    await PeriodModel.update(id, data);

    await AuditModel.log({
      user_id: userId,
      action: 'editar',
      module: 'periodos',
      entity: 'period',
      entity_id: id,
      old_values: existing,
      new_values: data
    });
  }

  static async setActive(id, userId) {
    const existing = await PeriodModel.findById(id);
    if (!existing) throw Object.assign(new Error('Período no encontrado'), { statusCode: 404 });

    await PeriodModel.setActive(id);

    await AuditModel.log({
      user_id: userId,
      action: 'activar',
      module: 'periodos',
      entity: 'period',
      entity_id: id,
      new_values: { is_active: true }
    });
  }

  static async closePeriod(id, userId) {
    const existing = await PeriodModel.closePeriod(id);
    await AuditModel.log({
      user_id: userId,
      action: 'cerrar',
      module: 'periodos',
      entity: 'period',
      entity_id: id,
      old_values: { is_active: existing.is_active, end_date: existing.end_date },
      new_values: { is_active: false, end_date: new Date().toISOString().split('T')[0] }
    });
  }

  static async delete(id, userId) {
    const existing = await PeriodModel.findById(id);
    if (!existing) throw Object.assign(new Error('Período no encontrado'), { statusCode: 404 });

    await PeriodModel.delete(id);

    await AuditModel.log({
      user_id: userId,
      action: 'eliminar',
      module: 'periodos',
      entity: 'period',
      entity_id: id,
      old_values: existing
    });
  }
}

module.exports = PeriodService;
