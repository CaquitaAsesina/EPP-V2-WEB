const AuditService = require('../services/auditService');
const ExportService = require('../services/exportService');

class AuditController {
  static async getAll(req, res, next) {
    try {
      const data = await AuditService.getAll(req.query);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async export(req, res, next) {
    try {
      const result = await AuditService.getAll({ ...req.query, limit: 10000, page: 1 });
      const columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Usuario', key: 'user_name', width: 25 },
        { header: 'Acción', key: 'action', width: 18 },
        { header: 'Módulo', key: 'module', width: 20 },
        { header: 'Entidad', key: 'entity', width: 18 },
        { header: 'ID Entidad', key: 'entity_id', width: 12 },
        { header: 'Fecha', key: 'created_at', width: 22 }
      ];
      const workbook = await ExportService.toExcel(result.data, columns, 'Auditoría');
      res.setHeader('Content-Type', ExportService.getContentType());
      res.setHeader('Content-Disposition', `attachment; filename=${ExportService.getFilename('auditoria')}`);
      await workbook.xlsx.write(res);
      res.end();
    } catch (err) { next(err); }
  }
}

module.exports = AuditController;
