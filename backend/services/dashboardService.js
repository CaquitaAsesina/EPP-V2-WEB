const DashboardModel = require('../model/dashboardModel');
const PeriodModel = require('../model/periodModel');

class DashboardService {
  static async getData(periodId) {
    if (!periodId) return null;

    const period = await PeriodModel.findById(periodId);
    const [
      rawKpis,
      cleanByType,
      bySize,
      movementsTimeline,
      dirtyStatus,
      topWorkers,
      lowStock,
      laundryFlow,
      recentMovements,
      lossesByType,
      rotationRate
    ] = await Promise.all([
      DashboardModel.getKPIs(periodId),
      DashboardModel.getCleanStockByType(periodId),
      DashboardModel.getStockBySize(periodId),
      DashboardModel.getDeliveriesAndIncomesByDate(periodId),
      DashboardModel.getDirtyStatusByType(periodId),
      DashboardModel.getTopWorkers(periodId),
      DashboardModel.getLowStockAlerts(periodId),
      DashboardModel.getLaundryFlow(periodId),
      DashboardModel.getRecentMovements(periodId),
      DashboardModel.getLossesByType(periodId),
      DashboardModel.getRotationRate(periodId)
    ]);

    const kpis = rawKpis ? {
      totalClean: rawKpis.clean_stock || 0,
      totalDirty: rawKpis.dirty_stock || 0,
      washing: rawKpis.washing_stock || 0,
      totalIncomes: rawKpis.total_incomes || 0,
      totalDeliveries: rawKpis.total_deliveries || 0,
      totalReturns: rawKpis.total_returns || 0,
      totalWorkers: rawKpis.total_workers || 0,
      losses: rawKpis.losses || 0,
      surplus: rawKpis.surplus || 0,
      lossRate: rawKpis.loss_rate || 0
    } : {
      totalClean: 0, totalDirty: 0, washing: 0, totalIncomes: 0,
      totalDeliveries: 0, totalReturns: 0, totalWorkers: 0,
      losses: 0, surplus: 0, lossRate: 0
    };

    const formattedDirtyStatus = dirtyStatus && dirtyStatus.length ? {
      toWash: dirtyStatus.reduce((s, r) => s + (r.para_lavar || 0), 0),
      washing: dirtyStatus.reduce((s, r) => s + (r.en_proceso || 0), 0),
      washed: dirtyStatus.reduce((s, r) => s + (r.lavados || 0), 0)
    } : { toWash: 0, washing: 0, washed: 0 };

    const formattedMovementsTimeline = (movementsTimeline || []).map(r => ({
      date: r.date,
      incomes: r.ingresos,
      deliveries: r.entregas,
      returns: r.devoluciones
    }));

    return {
      period,
      kpis,
      cleanByType,
      bySize,
      movementsTimeline: formattedMovementsTimeline,
      dirtyStatus: formattedDirtyStatus,
      dirtyByType: dirtyStatus || [],
      topWorkers,
      lowStock,
      laundryFlow: laundryFlow || { pending: 0, in_process: 0, completed: 0 },
      recentMovements,
      lossesByType,
      rotationRate
    };
  }
}

module.exports = DashboardService;
