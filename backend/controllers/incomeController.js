const IncomeService = require('../services/incomeService');
const ExportService = require('../services/exportService');

class IncomeController {
  static async getAll(req, res, next) {
    try {
      const data = await IncomeService.getAll(req.query);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async getById(req, res, next) {
    try {
      const data = await IncomeService.getById(req.params.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async create(req, res, next) {
    try {
      const id = await IncomeService.create(req.body, req.user.id);
      res.status(201).json({ success: true, message: 'Ingreso registrado', data: { id } });
    } catch (err) { next(err); }
  }

  static async update(req, res, next) {
    try {
      await IncomeService.update(req.params.id, req.body, req.user.id);
      res.json({ success: true, message: 'Ingreso actualizado' });
    } catch (err) { next(err); }
  }

  static async delete(req, res, next) {
    try {
      await IncomeService.delete(req.params.id, req.user.id);
      res.json({ success: true, message: 'Ingreso eliminado' });
    } catch (err) { next(err); }
  }

  static async export(req, res, next) {
    try {
      const result = await IncomeService.getAll(req.query);
      const columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'EPP', key: 'epp_type_name', width: 15 },
        { header: 'Talla', key: 'size_name', width: 10 },
        { header: 'Cantidad', key: 'quantity', width: 12 },
        { header: 'Fecha Recepción', key: 'reception_date', width: 16 },
        { header: 'Proveedor', key: 'provider', width: 25 },
        { header: 'Documento', key: 'document_number', width: 15 },
        { header: 'Observación', key: 'observation', width: 30 },
        { header: 'Creado por', key: 'created_by_name', width: 20 }
      ];
      const workbook = await ExportService.toExcel(result.data, columns, 'Ingresos');
      res.setHeader('Content-Type', ExportService.getContentType());
      res.setHeader('Content-Disposition', `attachment; filename=${ExportService.getFilename('ingresos')}`);
      await workbook.xlsx.write(res);
      res.end();
    } catch (err) { next(err); }
  }
}

module.exports = IncomeController;
