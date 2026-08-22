const EppTypeModel = require('../model/eppTypeModel');
const SizeModel = require('../model/sizeModel');
const AuditModel = require('../model/auditModel');

class EppTypeService {
  static async getAll() { return EppTypeModel.findAll(); }
  static async getActive() { return EppTypeModel.findActive(); }
  static async getSizes(eppTypeId) { return SizeModel.findByEppType(eppTypeId); }

  static async getById(id) {
    const item = await EppTypeModel.findById(id);
    if (!item) throw Object.assign(new Error('Tipo de EPP no encontrado'), { statusCode: 404 });
    return item;
  }

  static async create(data, userId) {
    const id = await EppTypeModel.create(data);
    await AuditModel.log({ user_id: userId, action: 'crear', module: 'catalogos', entity: 'epp_type', entity_id: id, new_values: data });
    return id;
  }

  static async update(id, data, userId) {
    const existing = await EppTypeModel.findById(id);
    if (!existing) throw Object.assign(new Error('Tipo de EPP no encontrado'), { statusCode: 404 });
    await EppTypeModel.update(id, data);
    await AuditModel.log({ user_id: userId, action: 'editar', module: 'catalogos', entity: 'epp_type', entity_id: id, old_values: existing, new_values: data });
  }

  static async delete(id, userId) {
    const existing = await EppTypeModel.findById(id);
    if (!existing) throw Object.assign(new Error('Tipo de EPP no encontrado'), { statusCode: 404 });
    await EppTypeModel.delete(id);
    await AuditModel.log({ user_id: userId, action: 'eliminar', module: 'catalogos', entity: 'epp_type', entity_id: id, old_values: existing });
  }
}

module.exports = EppTypeService;
