const db = require('../config/db');
const DirtyInventoryModel = require('../model/dirtyInventoryModel');
const AuditModel = require('../model/auditModel');

class DirtyInventoryService {
  static async getMatrix(periodId, filters) {
    if (!periodId) {
      const [rows] = await db.query('SELECT id FROM periods WHERE is_active = 1 LIMIT 1');
      if (rows.length) periodId = rows[0].id;
      else throw Object.assign(new Error('Se requiere un período activo'), { statusCode: 400 });
    }
    return DirtyInventoryModel.getMatrix(periodId, filters);
  }

  static async classifyItems(periodId, eppTypeId, sizeId, status, userId) {
    if (!periodId) {
      const [rows] = await db.query('SELECT id FROM periods WHERE is_active = 1 LIMIT 1');
      if (rows.length) periodId = rows[0].id;
      else throw Object.assign(new Error('Se requiere un período activo'), { statusCode: 400 });
    }
    const result = await DirtyInventoryModel.classifyItems(periodId, eppTypeId, sizeId, status, userId);
    await AuditModel.log({
      user_id: userId, action: 'clasificar', module: 'inventario_sucio', entity: 'dirty_inventory',
      new_values: { period_id: periodId, epp_type_id: eppTypeId, size_id: sizeId, status, quantity: result.unclassified }
    });
    return result;
  }
}

module.exports = DirtyInventoryService;
