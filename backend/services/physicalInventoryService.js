const PhysicalInventoryModel = require('../model/physicalInventoryModel');
const AuditModel = require('../model/auditModel');

class PhysicalInventoryService {
  static async getAll(filters) {
    if (!filters.period_id) throw Object.assign(new Error('Se requiere un período activo'), { statusCode: 400 });
    return PhysicalInventoryModel.findAll(filters);
  }

  static async createOrUpdate(data, userId) {
    if (!data.period_id) throw Object.assign(new Error('Se requiere un período activo'), { statusCode: 400 });
    const id = await PhysicalInventoryModel.createOrUpdate({ ...data, observed_by: userId });
    await AuditModel.log({
      user_id: userId, action: 'registrar_inventario_fisico', module: 'inventario_fisico', entity: 'physical_inventory', entity_id: id,
      new_values: { epp_type_id: data.epp_type_id, size_id: data.size_id, quantity: data.quantity, inventory_date: data.inventory_date }
    });
    return id;
  }

  static async delete(id, userId) {
    const existing = await PhysicalInventoryModel.delete(id);
    if (!existing) throw Object.assign(new Error('Registro no encontrado'), { statusCode: 404 });
    await AuditModel.log({
      user_id: userId, action: 'eliminar', module: 'inventario_fisico', entity: 'physical_inventory', entity_id: id,
      old_values: existing
    });
  }
}

module.exports = PhysicalInventoryService;
