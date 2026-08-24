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
        role: user.role_name,
        photo_url: user.photo_url || null
      }
    };
  }

  // Actualizar perfil propio: usuario y/o contraseña
  static async updateProfile(userId, { username, current_password, new_password }) {
    const user = await UserModel.findByIdWithHash(userId);
    if (!user) {
      throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
    }

    let changed = false;

    if (new_password) {
      if (!current_password) {
        throw Object.assign(new Error('Debes ingresar tu contraseña actual para cambiarla'), { statusCode: 400 });
      }
      const valid = await UserModel.comparePassword(current_password, user.password_hash);
      if (!valid) {
        throw Object.assign(new Error('La contraseña actual es incorrecta'), { statusCode: 401 });
      }
      if (new_password.length < 6) {
        throw Object.assign(new Error('La nueva contraseña debe tener al menos 6 caracteres'), { statusCode: 400 });
      }
      await UserModel.updatePassword(userId, new_password);
      changed = true;
    }

    if (username && username !== user.username) {
      if (!/^[a-zA-Z0-9._-]{3,100}$/.test(username)) {
        throw Object.assign(new Error('El usuario debe tener al menos 3 caracteres (letras, números, . _ -)'), { statusCode: 400 });
      }
      const exists = await UserModel.usernameExists(username, userId);
      if (exists) {
        throw Object.assign(new Error('Ese nombre de usuario ya está en uso'), { statusCode: 409 });
      }
      await UserModel.updateUsername(userId, username);
      changed = true;
    }

    if (!changed) {
      throw Object.assign(new Error('No hay cambios para aplicar'), { statusCode: 400 });
    }

    const updated = await UserModel.findById(userId);
    const token = jwt.sign(
      { id: updated.id, username: updated.username, role: updated.role_name, full_name: updated.full_name },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    return {
      token,
      user: {
        id: updated.id,
        username: updated.username,
        full_name: updated.full_name,
        email: updated.email,
        role: updated.role_name,
        photo_url: updated.photo_url || null
      }
    };
  }

  static async updatePhoto(userId, photoUrl) {
    const user = await UserModel.findById(userId);
    if (!user) throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
    await UserModel.updatePhoto(userId, photoUrl);
  }
}

module.exports = AuthService;
