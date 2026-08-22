const MovementService = require('../services/movementService');
const ExportService = require('../services/exportService');

class MovementController {
  static async getAll(req, res, next) {
    try {
      const data = await MovementService.getAll(req.query);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async export(req, res, next) {
    try {
      const result = await MovementService.getAll(req.query);
      const columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Tipo Movimiento', key: 'movement_type', width: 22 },
        { header: 'EPP', key: 'epp_name', width: 15 },
        { header: 'Talla', key: 'size_name', width: 10 },
        { header: 'Cantidad', key: 'quantity', width: 12 },
        { header: 'Dirección', key: 'direction', width: 12 },
        { header: 'Trabajador', key: 'worker_name', width: 25 },
        { header: 'Observación', key: 'observation', width: 30 },
        { header: 'Fecha', key: 'movement_date', width: 22 },
        { header: 'Creado por', key: 'created_by_name', width: 20 }
      ];
      const workbook = await ExportService.toExcel(result.data, columns, 'Kardex');
      res.setHeader('Content-Type', ExportService.getContentType());
      res.setHeader('Content-Disposition', `attachment; filename=${ExportService.getFilename('kardex')}`);
      await workbook.xlsx.write(res);
      res.end();
    } catch (err) { next(err); }
  }
}

module.exports = MovementController;
