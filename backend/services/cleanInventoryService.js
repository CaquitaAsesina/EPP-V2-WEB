const db = require('../config/db');
const CleanInventoryModel = require('../model/cleanInventoryModel');
const AuditModel = require('../model/auditModel');

class CleanInventoryService {
  static async getMatrix(periodId, filters) {
    if (!periodId) {
      const [rows] = await db.query('SELECT id FROM periods WHERE is_active = 1 LIMIT 1');
      if (rows.length) periodId = rows[0].id;
      else throw Object.assign(new Error('Se requiere un período activo'), { statusCode: 400 });
    }
    return CleanInventoryModel.getMatrix(periodId, filters);
  }

  static async setInitialStock(data, userId) {
    const result = await CleanInventoryModel.setInitialStock(
      data.period_id, data.epp_type_id, data.size_id, data.quantity, userId
    );
    await AuditModel.log({
      user_id: userId,
      action: result.oldValues ? 'editar' : 'crear',
      module: 'inventario_limpio',
      entity: 'clean_inventory_initial_stock',
      new_values: { period_id: data.period_id, epp_type_id: data.epp_type_id, size_id: data.size_id, quantity: data.quantity },
      old_values: result.oldValues
    });
    return true;
  }
}

module.exports = CleanInventoryService;
