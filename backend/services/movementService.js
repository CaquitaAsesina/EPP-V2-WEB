const MovementModel = require('../model/movementModel');

class MovementService {
  static async getAll(filters) {
    if (!filters.period_id) throw Object.assign(new Error('Se requiere un período activo'), { statusCode: 400 });
    return MovementModel.findAll(filters);
  }
}

module.exports = MovementService;
