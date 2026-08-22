const DashboardModel = require('../model/dashboardModel');

class DashboardService {
  static async getData(periodId) {
    if (!periodId) return null;
    const [kpis, cleanByType, stockBySize, deliveriesByDate, dirtyStatus] = await Promise.all([
      DashboardModel.getKPIs(periodId),
      DashboardModel.getCleanStockByType(periodId),
      DashboardModel.getStockBySize(periodId),
      DashboardModel.getDeliveriesAndIncomesByDate(periodId),
      DashboardModel.getDirtyStatusByType(periodId)
    ]);
    return { kpis, cleanByType, stockBySize, deliveriesByDate, dirtyStatus };
  }
}

module.exports = DashboardService;
