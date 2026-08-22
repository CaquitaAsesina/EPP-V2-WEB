const DirtyInventoryService = require('../services/dirtyInventoryService');

class DirtyInventoryController {
  static async getMatrix(req, res, next) {
    try {
      const data = await DirtyInventoryService.getMatrix(req.query.period_id, req.query);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async classifyItems(req, res, next) {
    try {
      const { period_id, epp_type_id, size_id, status } = req.body;
      if (!period_id || !epp_type_id || !size_id || !status) {
        return res.status(400).json({ success: false, message: 'Faltan campos requeridos: period_id, epp_type_id, size_id, status' });
      }
      if (!['lavado', 'pendiente', 'sucio'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Status debe ser: lavado, pendiente o sucio' });
      }
      const result = await DirtyInventoryService.classifyItems(
        period_id, epp_type_id, size_id, status, req.user.id
      );
      res.json({ success: true, message: `Items clasificados como ${status}`, data: result });
    } catch (err) { next(err); }
  }
}

module.exports = DirtyInventoryController;
