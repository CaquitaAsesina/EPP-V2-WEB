const UserModel = require('../model/userModel');
const AuditModel = require('../model/auditModel');

class UserService {
  static async getAll() {
    return UserModel.findAll();
  }

  static async getById(id) {
    const user = await UserModel.findById(id);
    if (!user) throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
    return user;
  }

  static async create(data, createdBy) {
    // Check unique username
    const existing = await UserModel.findByUsername(data.username);
    if (existing) throw Object.assign(new Error('El nombre de usuario ya existe'), { statusCode: 409 });

    const id = await UserModel.create(data);
    await AuditModel.log({
      user_id: createdBy,
      action: 'crear',
      module: 'usuarios',
      entity: 'user',
      entity_id: id,
      new_values: { username: data.username, full_name: data.full_name, role_id: data.role_id }
    });
    return id;
  }

  static async update(id, data, userId) {
    const existing = await UserModel.findById(id);
    if (!existing) throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });

    const oldValues = { ...existing };
    await UserModel.update(id, data);

    await AuditModel.log({
      user_id: userId,
      action: 'editar',
      module: 'usuarios',
      entity: 'user',
      entity_id: id,
      old_values: oldValues,
      new_values: data
    });
    return true;
  }

  static async updatePassword(id, newPassword, userId) {
    const existing = await UserModel.findById(id);
    if (!existing) throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });

    await UserModel.updatePassword(id, newPassword);
    await AuditModel.log({
      user_id: userId,
      action: 'cambiar_contraseña',
      module: 'usuarios',
      entity: 'user',
      entity_id: id
    });
  }

  static async delete(id, userId) {
    const existing = await UserModel.findById(id);
    if (!existing) throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });

    await UserModel.delete(id);
    await AuditModel.log({
      user_id: userId,
      action: 'eliminar',
      module: 'usuarios',
      entity: 'user',
      entity_id: id,
      old_values: existing
    });
  }
}

module.exports = UserService;
