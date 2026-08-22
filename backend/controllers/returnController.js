const ReturnService = require('../services/returnService');
const ExportService = require('../services/exportService');

class ReturnController {
  static async getAll(req, res, next) {
    try {
      const data = await ReturnService.getAll(req.query);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async getById(req, res, next) {
    try {
      const data = await ReturnService.getById(req.params.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async create(req, res, next) {
    try {
      const id = await ReturnService.create(req.body, req.user.id);
      res.status(201).json({ success: true, message: 'Devolución registrada', data: { id } });
    } catch (err) { next(err); }
  }

  static async update(req, res, next) {
    try {
      await ReturnService.update(req.params.id, req.body, req.user.id);
      res.json({ success: true, message: 'Devolución actualizada' });
    } catch (err) { next(err); }
  }

  static async delete(req, res, next) {
    try {
      await ReturnService.delete(req.params.id, req.user.id);
      res.json({ success: true, message: 'Devolución eliminada' });
    } catch (err) { next(err); }
  }

  static async export(req, res, next) {
    try {
      const result = await ReturnService.getAll(req.query);
      const columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'EPP', key: 'epp_name', width: 15 },
        { header: 'Talla', key: 'size_name', width: 10 },
        { header: 'Trabajador', key: 'worker_name', width: 25 },
        { header: 'Cantidad', key: 'quantity', width: 12 },
        { header: 'Fecha', key: 'return_date', width: 16 },
        { header: 'Observación', key: 'observation', width: 30 },
        { header: 'Creado por', key: 'created_by_name', width: 20 }
      ];
      const workbook = await ExportService.toExcel(result.data, columns, 'Devoluciones');
      res.setHeader('Content-Type', ExportService.getContentType());
      res.setHeader('Content-Disposition', `attachment; filename=${ExportService.getFilename('devoluciones')}`);
      await workbook.xlsx.write(res);
      res.end();
    } catch (err) { next(err); }
  }
}

module.exports = ReturnController;
