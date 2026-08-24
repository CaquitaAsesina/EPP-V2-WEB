const AuthService = require('../services/authService');

class AuthController {
  static async login(req, res, next) {
    try {
      const { username, password } = req.body;
      const result = await AuthService.login(username, password);
      res.json({ success: true, message: 'Inicio de sesión exitoso', data: result });
    } catch (err) {
      next(err);
    }
  }

  static async profile(req, res, next) {
    try {
      const UserModel = require('../model/userModel');
      const user = await UserModel.findById(req.user.id);
      res.json({ success: true, data: user || req.user });
    } catch (err) {
      next(err);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const { username, current_password, new_password } = req.body;
      const result = await AuthService.updateProfile(req.user.id, { username, current_password, new_password });
      res.json({ success: true, message: 'Perfil actualizado correctamente', data: result });
    } catch (err) {
      next(err);
    }
  }

  static async updatePhoto(req, res, next) {
    try {
      const { photo_url } = req.body;
      await AuthService.updatePhoto(req.user.id, photo_url || null);
      res.json({ success: true, message: 'Foto actualizada correctamente' });
    } catch (err) {
      next(err);
    }
  }

  static async getPhoto(req, res, next) {
    try {
      const UserModel = require('../model/userModel');
      const user = await UserModel.findById(req.user.id);
      res.json({ success: true, data: { photo_url: user?.photo_url || null } });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;
