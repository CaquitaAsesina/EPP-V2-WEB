const PeriodService = require('../services/periodService');

class PeriodController {
  static async getAll(req, res, next) {
    try {
      const periods = await PeriodService.getAll();
      res.json({ success: true, data: periods });
    } catch (err) { next(err); }
  }

  static async getActive(req, res, next) {
    try {
      const period = await PeriodService.getActive();
      res.json({ success: true, data: period });
    } catch (err) { next(err); }
  }

  static async getById(req, res, next) {
    try {
      const period = await PeriodService.getById(req.params.id);
      res.json({ success: true, data: period });
    } catch (err) { next(err); }
  }

  static async create(req, res, next) {
    try {
      const id = await PeriodService.create(req.body, req.user.id);
      res.status(201).json({ success: true, message: 'Período creado', data: { id } });
    } catch (err) { next(err); }
  }

  static async update(req, res, next) {
    try {
      await PeriodService.update(req.params.id, req.body, req.user.id);
      res.json({ success: true, message: 'Período actualizado' });
    } catch (err) { next(err); }
  }

  static async setActive(req, res, next) {
    try {
      await PeriodService.setActive(req.params.id, req.user.id);
      res.json({ success: true, message: 'Período activado' });
    } catch (err) { next(err); }
  }

  static async closePeriod(req, res, next) {
    try {
      await PeriodService.closePeriod(req.params.id, req.user.id);
      res.json({ success: true, message: 'Período cerrado correctamente' });
    } catch (err) { next(err); }
  }

  static async delete(req, res, next) {
    try {
      await PeriodService.delete(req.params.id, req.user.id);
      res.json({ success: true, message: 'Período eliminado' });
    } catch (err) { next(err); }
  }
}

module.exports = PeriodController;
