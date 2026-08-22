const CleanInventoryService = require('../services/cleanInventoryService');

class CleanInventoryController {
  static async getMatrix(req, res, next) {
    try {
      const data = await CleanInventoryService.getMatrix(req.query.period_id, req.query);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async setInitialStock(req, res, next) {
    try {
      await CleanInventoryService.setInitialStock(req.body, req.user.id);
      res.json({ success: true, message: 'Stock inicial registrado' });
    } catch (err) { next(err); }
  }

  static async updateInitialStock(req, res, next) {
    try {
      const { id } = req.params;
      const { initial_stock } = req.body;
      // id format: eppTypeId-sizeId
      const [eppTypeId, sizeId] = id.split('-');
      // We need period_id from query or body
      const periodId = req.query.period_id || req.body.period_id;
      if (!periodId) return res.status(400).json({ success: false, message: 'Se requiere period_id' });
      await CleanInventoryService.setInitialStock({
        period_id: periodId,
        epp_type_id: parseInt(eppTypeId),
        size_id: parseInt(sizeId),
        quantity: parseInt(initial_stock) || 0
      }, req.user.id);
      res.json({ success: true, message: 'Stock inicial actualizado' });
    } catch (err) { next(err); }
  }
}

module.exports = CleanInventoryController;
