const db = require('../config/db');

class UserPreferencesModel {
  static async findByUserId(userId) {
    const [rows] = await db.query('SELECT * FROM user_preferences WHERE user_id = ?', [userId]);
    return rows[0] || null;
  }

  static async createOrUpdate(userId, prefs) {
    const existing = await this.findByUserId(userId);
    if (existing) {
      const fields = [];
      const values = [];
      for (const [key, val] of Object.entries(prefs)) {
        if (val !== undefined) {
          fields.push(`${key} = ?`);
          values.push(val);
        }
      }
      if (fields.length > 0) {
        values.push(userId);
        await db.query(`UPDATE user_preferences SET ${fields.join(', ')} WHERE user_id = ?`, values);
      }
    } else {
      await db.query(
        `INSERT INTO user_preferences (user_id, primary_color, secondary_color, background_color, card_color, text_color, theme_mode, sidebar_style, density)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, prefs.primary_color || '#DC2626', prefs.secondary_color || '#FFFFFF',
         prefs.background_color || '#F3F4F6', prefs.card_color || '#FFFFFF',
         prefs.text_color || '#1F2937', prefs.theme_mode || 'light',
         prefs.sidebar_style || 'dark', prefs.density || 'normal']
      );
    }
    return this.findByUserId(userId);
  }
}

module.exports = UserPreferencesModel;
