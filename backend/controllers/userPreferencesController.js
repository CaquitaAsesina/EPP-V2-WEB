const UserPreferencesService = require('../services/userPreferencesService');

class UserPreferencesController {
  static async get(req, res, next) {
    try {
      const data = await UserPreferencesService.get(req.user.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async update(req, res, next) {
    try {
      const data = await UserPreferencesService.update(req.user.id, req.body);
      res.json({ success: true, message: 'Preferencias actualizadas', data });
    } catch (err) { next(err); }
  }
}

module.exports = UserPreferencesController;
