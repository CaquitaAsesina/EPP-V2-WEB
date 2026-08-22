const SizeService = require('../services/sizeService');

class SizeController {
  static async getAll(req, res, next) {
    try { res.json({ success: true, data: await SizeService.getAll() }); } catch (err) { next(err); }
  }
  static async getActive(req, res, next) {
    try { res.json({ success: true, data: await SizeService.getActive() }); } catch (err) { next(err); }
  }
  static async getById(req, res, next) {
    try { res.json({ success: true, data: await SizeService.getById(req.params.id) }); } catch (err) { next(err); }
  }
  static async getByEppType(req, res, next) {
    try { res.json({ success: true, data: await SizeService.getByEppType(req.params.eppTypeId) }); } catch (err) { next(err); }
  }
  static async create(req, res, next) {
    try {
      const id = await SizeService.create(req.body, req.user.id);
      res.status(201).json({ success: true, message: 'Talla creada', data: { id } });
    } catch (err) { next(err); }
  }
  static async update(req, res, next) {
    try {
      await SizeService.update(req.params.id, req.body, req.user.id);
      res.json({ success: true, message: 'Talla actualizada' });
    } catch (err) { next(err); }
  }
  static async delete(req, res, next) {
    try {
      await SizeService.delete(req.params.id, req.user.id);
      res.json({ success: true, message: 'Talla eliminada' });
    } catch (err) { next(err); }
  }
  static async associateEppType(req, res, next) {
    try {
      await SizeService.associateEppType(req.body.epp_type_id, req.body.size_id, req.user.id);
      res.json({ success: true, message: 'Asociación creada' });
    } catch (err) { next(err); }
  }
  static async dissociateEppType(req, res, next) {
    try {
      await SizeService.dissociateEppType(req.body.epp_type_id, req.body.size_id, req.user.id);
      res.json({ success: true, message: 'Asociación eliminada' });
    } catch (err) { next(err); }
  }
}

module.exports = SizeController;
