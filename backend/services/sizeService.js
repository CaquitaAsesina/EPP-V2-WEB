const SizeModel = require('../model/sizeModel');
const AuditModel = require('../model/auditModel');

class SizeService {
  static async getAll() { return SizeModel.findAll(); }
  static async getActive() { return SizeModel.findActive(); }

  static async getById(id) {
    const item = await SizeModel.findById(id);
    if (!item) throw Object.assign(new Error('Talla no encontrada'), { statusCode: 404 });
    return item;
  }

  static async getByEppType(eppTypeId) {
    return SizeModel.findByEppType(eppTypeId);
  }

  static async create(data, userId) {
    const id = await SizeModel.create(data);
    await AuditModel.log({ user_id: userId, action: 'crear', module: 'catalogos', entity: 'size', entity_id: id, new_values: data });
    return id;
  }

  static async update(id, data, userId) {
    const existing = await SizeModel.findById(id);
    if (!existing) throw Object.assign(new Error('Talla no encontrada'), { statusCode: 404 });
    await SizeModel.update(id, data);
    await AuditModel.log({ user_id: userId, action: 'editar', module: 'catalogos', entity: 'size', entity_id: id, old_values: existing, new_values: data });
  }

  static async delete(id, userId) {
    const existing = await SizeModel.findById(id);
    if (!existing) throw Object.assign(new Error('Talla no encontrada'), { statusCode: 404 });
    await SizeModel.delete(id);
    await AuditModel.log({ user_id: userId, action: 'eliminar', module: 'catalogos', entity: 'size', entity_id: id, old_values: existing });
  }

  static async associateEppType(eppTypeId, sizeId, userId) {
    const id = await SizeModel.associateEppType(eppTypeId, sizeId);
    await AuditModel.log({ user_id: userId, action: 'asociar', module: 'catalogos', entity: 'epp_type_size', new_values: { epp_type_id: eppTypeId, size_id: sizeId } });
    return id;
  }

  static async dissociateEppType(eppTypeId, sizeId, userId) {
    await SizeModel.dissociateEppType(eppTypeId, sizeId);
    await AuditModel.log({ user_id: userId, action: 'desasociar', module: 'catalogos', entity: 'epp_type_size', new_values: { epp_type_id: eppTypeId, size_id: sizeId } });
  }
}

module.exports = SizeService;
