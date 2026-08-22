const DashboardService = require('../services/dashboardService');
const PeriodModel = require('../model/periodModel');

class DashboardController {
  static async getData(req, res, next) {
    try {
      let periodId = req.query.period_id;
      if (!periodId) {
        const active = await PeriodModel.findActive();
        periodId = active ? active.id : null;
      }
      const data = await DashboardService.getData(periodId);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
}

module.exports = DashboardController;
