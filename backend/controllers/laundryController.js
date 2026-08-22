const LaundryService = require('../services/laundryService');
const ExportService = require('../services/exportService');

class LaundryController {
  static async getAll(req, res, next) {
    try {
      const data = await LaundryService.getAll(req.query);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async getById(req, res, next) {
    try {
      const data = await LaundryService.getById(req.params.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async create(req, res, next) {
    try {
      const id = await LaundryService.create(req.body, req.user.id);
      res.status(201).json({ success: true, message: 'Movimiento registrado', data: { id } });
    } catch (err) { next(err); }
  }

  static async updateStatus(req, res, next) {
    try {
      await LaundryService.updateStatus(req.params.id, req.body.status, req.body.observation, req.user.id);
      res.json({ success: true, message: 'Estado actualizado' });
    } catch (err) { next(err); }
  }

  static async delete(req, res, next) {
    try {
      await LaundryService.delete(req.params.id, req.user.id);
      res.json({ success: true, message: 'Movimiento eliminado' });
    } catch (err) { next(err); }
  }

  static async export(req, res, next) {
    try {
      const result = await LaundryService.getAll(req.query);
      const statusLabels = { para_lavar: 'Para Lavado', mandado_lavar: 'Mandado a Lavar', lavado: 'Lavado' };
      const columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'EPP', key: 'epp_name', width: 15 },
        { header: 'Talla', key: 'size_name', width: 10 },
        { header: 'Cantidad', key: 'quantity', width: 12 },
        { header: 'Estado', key: 'status_label', width: 18 },
        { header: 'Fecha', key: 'movement_date', width: 16 },
        { header: 'Observación', key: 'observation', width: 30 },
        { header: 'Creado por', key: 'created_by_name', width: 20 }
      ];
      const data = result.data.map(r => ({ ...r, status_label: statusLabels[r.status] || r.status }));
      const workbook = await ExportService.toExcel(data, columns, 'Lavados');
      res.setHeader('Content-Type', ExportService.getContentType());
      res.setHeader('Content-Disposition', `attachment; filename=${ExportService.getFilename('lavados')}`);
      await workbook.xlsx.write(res);
      res.end();
    } catch (err) { next(err); }
  }
}

module.exports = LaundryController;
