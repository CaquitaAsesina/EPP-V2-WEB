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
      res.json({ success: true, data: req.user });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;
