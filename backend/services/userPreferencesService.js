const UserPreferencesModel = require('../model/userPreferencesModel');

class UserPreferencesService {
  static async get(userId) {
    const prefs = await UserPreferencesModel.findByUserId(userId);
    return prefs || {
      primary_color: '#DC2626',
      secondary_color: '#FFFFFF',
      background_color: '#F3F4F6',
      card_color: '#FFFFFF',
      text_color: '#1F2937',
      theme_mode: 'light',
      sidebar_style: 'dark',
      density: 'normal'
    };
  }

  static async update(userId, prefs) {
    return UserPreferencesModel.createOrUpdate(userId, prefs);
  }
}

module.exports = UserPreferencesService;
