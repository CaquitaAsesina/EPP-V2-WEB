const EppTypeService = require('../services/eppTypeService');

class EppTypeController {
  static async getAll(req, res, next) {
    try { res.json({ success: true, data: await EppTypeService.getAll() }); } catch (err) { next(err); }
  }
  static async getActive(req, res, next) {
    try { res.json({ success: true, data: await EppTypeService.getActive() }); } catch (err) { next(err); }
  }
  static async getById(req, res, next) {
    try { res.json({ success: true, data: await EppTypeService.getById(req.params.id) }); } catch (err) { next(err); }
  }
  static async create(req, res, next) {
    try {
      const id = await EppTypeService.create(req.body, req.user.id);
      res.status(201).json({ success: true, message: 'Tipo de EPP creado', data: { id } });
    } catch (err) { next(err); }
  }
  static async update(req, res, next) {
    try {
      await EppTypeService.update(req.params.id, req.body, req.user.id);
      res.json({ success: true, message: 'Tipo de EPP actualizado' });
    } catch (err) { next(err); }
  }
  static async getSizes(req, res, next) {
    try { res.json({ success: true, data: await EppTypeService.getSizes(req.params.id) }); } catch (err) { next(err); }
  }
  static async delete(req, res, next) {
    try {
      await EppTypeService.delete(req.params.id, req.user.id);
      res.json({ success: true, message: 'Tipo de EPP eliminado' });
    } catch (err) { next(err); }
  }
}

module.exports = EppTypeController;
