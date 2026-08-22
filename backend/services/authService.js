const jwt = require('jsonwebtoken');
const env = require('../config/env');
const UserModel = require('../model/userModel');

class AuthService {
  static async login(username, password) {
    const user = await UserModel.findByUsername(username);
    if (!user) {
      throw Object.assign(new Error('Credenciales inválidas'), { statusCode: 401 });
    }
    if (!user.is_active) {
      throw Object.assign(new Error('Usuario desactivado'), { statusCode: 403 });
    }

    const valid = await UserModel.comparePassword(password, user.password_hash);
    if (!valid) {
      throw Object.assign(new Error('Credenciales inválidas'), { statusCode: 401 });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role_name, full_name: user.full_name },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role_name
      }
    };
  }
}

module.exports = AuthService;
