const WorkerModel = require('../model/workerModel');
const AuditModel = require('../model/auditModel');

class WorkerService {
  static async getAll() { return WorkerModel.findAll(); }

  static async getById(id, decrypt = false) {
    const worker = await WorkerModel.findById(id, decrypt);
    if (!worker) throw Object.assign(new Error('Trabajador no encontrado'), { statusCode: 404 });
    return worker;
  }

  static async create(data, userId) {
    // Check unique DNI
    const existing = await WorkerModel.findByDni(data.dni);
    if (existing) throw Object.assign(new Error('Ya existe un trabajador con ese DNI'), { statusCode: 409 });

    const id = await WorkerModel.create(data);
    await AuditModel.log({ user_id: userId, action: 'crear', module: 'trabajadores', entity: 'worker', entity_id: id, new_values: { full_name: data.full_name } });
    return id;
  }

  static async update(id, data, userId) {
    const existing = await WorkerModel.findById(id);
    if (!existing) throw Object.assign(new Error('Trabajador no encontrado'), { statusCode: 404 });
    await WorkerModel.update(id, data);
    await AuditModel.log({ user_id: userId, action: 'editar', module: 'trabajadores', entity: 'worker', entity_id: id, old_values: { full_name: existing.full_name }, new_values: data });
  }

  static async delete(id, userId) {
    const existing = await WorkerModel.findById(id);
    if (!existing) throw Object.assign(new Error('Trabajador no encontrado'), { statusCode: 404 });
    await WorkerModel.delete(id);
    await AuditModel.log({ user_id: userId, action: 'eliminar', module: 'trabajadores', entity: 'worker', entity_id: id, old_values: { full_name: existing.full_name } });
  }
}

module.exports = WorkerService;
