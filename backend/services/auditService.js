const AuditModel = require('../model/auditModel');

class AuditService {
  static async getAll(filters) {
    return AuditModel.findAll(filters);
  }
}

module.exports = AuditService;
