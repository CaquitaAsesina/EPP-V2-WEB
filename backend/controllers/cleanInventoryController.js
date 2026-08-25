const CleanInventoryService = require('../services/cleanInventoryService');
const ExportService = require('../services/exportService');

class CleanInventoryController {
  static async getMatrix(req, res, next) {
    try {
      const data = await CleanInventoryService.getMatrix(req.query.period_id, req.query);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async export(req, res, next) {
    try {
      const data = await CleanInventoryService.getMatrix(req.query.period_id, req.query);
      const columns = [
        { header: 'EPP', key: 'epp_type', width: 20 },
        { header: 'Talla', key: 'size', width: 12 },
        { header: 'Stock Inicial', key: 'initial_stock', width: 14 },
        { header: 'Ingresos', key: 'incomes', width: 12 },
        { header: 'Entregas', key: 'deliveries', width: 12 },
        { header: 'Lavados Rec.', key: 'laundry_received', width: 14 },
        { header: 'Stock Sist.', key: 'systematic_stock', width: 14 },
        { header: 'Cant. Física', key: 'physical_quantity', width: 14 },
        { header: 'Diferencia', key: 'difference', width: 12 },
        { header: 'Estado', key: 'status', width: 14 }
      ];
      const rows = data.map(r => ({
        ...r,
        initial_stock: Number(r.initial_stock || 0),
        incomes: Number(r.incomes || 0),
        deliveries: Number(r.deliveries || 0),
        laundry_received: Number(r.laundry_received || 0),
        systematic_stock: Number(r.systematic_stock || 0),
        physical_quantity: r.physical_quantity != null ? Number(r.physical_quantity) : '—',
        difference: r.difference != null ? Number(r.difference) : '—',
        status: r.status || 'Sin inventario'
      }));
      const workbook = await ExportService.toExcel(rows, columns, 'Inventario Limpio');
      res.setHeader('Content-Type', ExportService.getContentType());
      res.setHeader('Content-Disposition', `attachment; filename=${ExportService.getFilename('inventario-limpio')}`);
      await workbook.xlsx.write(res);
      res.end();
    } catch (err) { next(err); }
  }

  static async setInitialStock(req, res, next) {
    try {
      await CleanInventoryService.setInitialStock(req.body, req.user.id);
      res.json({ success: true, message: 'Stock inicial registrado' });
    } catch (err) { next(err); }
  }

  static async updateInitialStock(req, res, next) {
    try {
      const { id } = req.params;
      const { initial_stock } = req.body;
      const [eppTypeId, sizeId] = id.split('-');
      const periodId = req.query.period_id || req.body.period_id;
      if (!periodId) return res.status(400).json({ success: false, message: 'Se requiere period_id' });
      await CleanInventoryService.setInitialStock({
        period_id: periodId,
        epp_type_id: parseInt(eppTypeId),
        size_id: parseInt(sizeId),
        quantity: parseInt(initial_stock) || 0
      }, req.user.id);
      res.json({ success: true, message: 'Stock inicial actualizado' });
    } catch (err) { next(err); }
  }
}

module.exports = CleanInventoryController;
