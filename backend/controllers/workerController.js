const WorkerService = require('../services/workerService');

class WorkerController {
  static async getAll(req, res, next) {
    try { res.json({ success: true, data: await WorkerService.getAll() }); } catch (err) { next(err); }
  }
  static async getById(req, res, next) {
    try {
      const decrypt = req.user.role === 'admin' && req.query.decrypt === 'true';
      res.json({ success: true, data: await WorkerService.getById(req.params.id, decrypt) });
    } catch (err) { next(err); }
  }
  static async create(req, res, next) {
    try {
      const id = await WorkerService.create(req.body, req.user.id);
      res.status(201).json({ success: true, message: 'Trabajador creado', data: { id } });
    } catch (err) { next(err); }
  }
  static async update(req, res, next) {
    try {
      await WorkerService.update(req.params.id, req.body, req.user.id);
      res.json({ success: true, message: 'Trabajador actualizado' });
    } catch (err) { next(err); }
  }
  static async delete(req, res, next) {
    try {
      await WorkerService.delete(req.params.id, req.user.id);
      res.json({ success: true, message: 'Trabajador eliminado' });
    } catch (err) { next(err); }
  }
}

module.exports = WorkerController;
