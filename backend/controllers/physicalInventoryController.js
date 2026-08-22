const PhysicalInventoryService = require('../services/physicalInventoryService');

class PhysicalInventoryController {
  static async getAll(req, res, next) {
    try {
      const data = await PhysicalInventoryService.getAll(req.query);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async createOrUpdate(req, res, next) {
    try {
      const id = await PhysicalInventoryService.createOrUpdate(req.body, req.user.id);
      res.status(201).json({ success: true, message: 'Inventario físico registrado', data: { id } });
    } catch (err) { next(err); }
  }

  static async delete(req, res, next) {
    try {
      await PhysicalInventoryService.delete(req.params.id, req.user.id);
      res.json({ success: true, message: 'Registro eliminado' });
    } catch (err) { next(err); }
  }
}

module.exports = PhysicalInventoryController;
