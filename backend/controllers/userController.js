const UserService = require('../services/userService');

class UserController {
  static async getAll(req, res, next) {
    try {
      const users = await UserService.getAll();
      res.json({ success: true, data: users });
    } catch (err) { next(err); }
  }

  static async getById(req, res, next) {
    try {
      const user = await UserService.getById(req.params.id);
      res.json({ success: true, data: user });
    } catch (err) { next(err); }
  }

  static async create(req, res, next) {
    try {
      const id = await UserService.create(req.body, req.user.id);
      res.status(201).json({ success: true, message: 'Usuario creado', data: { id } });
    } catch (err) { next(err); }
  }

  static async update(req, res, next) {
    try {
      await UserService.update(req.params.id, req.body, req.user.id);
      res.json({ success: true, message: 'Usuario actualizado' });
    } catch (err) { next(err); }
  }

  static async updatePassword(req, res, next) {
    try {
      const { password } = req.body;
      if (!password) return res.status(400).json({ success: false, message: 'La contraseña es obligatoria' });
      await UserService.updatePassword(req.params.id, password, req.user.id);
      res.json({ success: true, message: 'Contraseña actualizada' });
    } catch (err) { next(err); }
  }

  static async delete(req, res, next) {
    try {
      await UserService.delete(req.params.id, req.user.id);
      res.json({ success: true, message: 'Usuario eliminado' });
    } catch (err) { next(err); }
  }
}

module.exports = UserController;
