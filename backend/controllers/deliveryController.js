const DeliveryService = require('../services/deliveryService');
const ExportService = require('../services/exportService');

class DeliveryController {
  static async getAll(req, res, next) {
    try {
      const data = await DeliveryService.getAll(req.query);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async getById(req, res, next) {
    try {
      const data = await DeliveryService.getById(req.params.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async create(req, res, next) {
    try {
      const id = await DeliveryService.create(req.body, req.user.id);
      res.status(201).json({ success: true, message: 'Entrega registrada', data: { id } });
    } catch (err) { next(err); }
  }

  static async update(req, res, next) {
    try {
      await DeliveryService.update(req.params.id, req.body, req.user.id);
      res.json({ success: true, message: 'Entrega actualizada' });
    } catch (err) { next(err); }
  }

  static async delete(req, res, next) {
    try {
      await DeliveryService.delete(req.params.id, req.user.id);
      res.json({ success: true, message: 'Entrega eliminada' });
    } catch (err) { next(err); }
  }

  static async export(req, res, next) {
    try {
      const result = await DeliveryService.getAll(req.query);
      const columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'EPP', key: 'epp_name', width: 15 },
        { header: 'Talla', key: 'size_name', width: 10 },
        { header: 'Trabajador', key: 'worker_name', width: 25 },
        { header: 'Cantidad', key: 'quantity', width: 12 },
        { header: 'Fecha', key: 'delivery_date', width: 16 },
        { header: 'Observación', key: 'observation', width: 30 },
        { header: 'Creado por', key: 'created_by_name', width: 20 }
      ];
      const workbook = await ExportService.toExcel(result.data, columns, 'Entregas');
      res.setHeader('Content-Type', ExportService.getContentType());
      res.setHeader('Content-Disposition', `attachment; filename=${ExportService.getFilename('entregas')}`);
      await workbook.xlsx.write(res);
      res.end();
    } catch (err) { next(err); }
  }
}

module.exports = DeliveryController;
