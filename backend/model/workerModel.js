const db = require('../config/db');
const env = require('../config/env');
const crypto = require('crypto');

class WorkerModel {
  static encryptDni(dni) {
    const key = Buffer.from(env.dniEncryptionKey, 'hex');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(dni, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${tag}:${encrypted}`;
  }

  static decryptDni(encryptedDni) {
    const key = Buffer.from(env.dniEncryptionKey, 'hex');
    const parts = encryptedDni.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  static hashDni(dni) {
    return crypto.createHash('sha256').update(dni.toString().trim()).digest('hex');
  }

  static async findAll() {
    const [rows] = await db.query('SELECT id, full_name, is_active, created_at FROM workers ORDER BY full_name');
    return rows.map(r => ({ ...r, dni: '***' }));
  }

  static async findById(id, decrypt = false) {
    const [rows] = await db.query('SELECT * FROM workers WHERE id = ?', [id]);
    if (!rows[0]) return null;
    const worker = rows[0];
    worker.dni = decrypt ? this.decryptDni(worker.dni_encrypted) : '***';
    delete worker.dni_encrypted;
    return worker;
  }

  static async findByDni(dni) {
    const hash = this.hashDni(dni);
    const [rows] = await db.query('SELECT * FROM workers WHERE dni_hash = ?', [hash]);
    return rows[0] || null;
  }

  static async create({ full_name, dni }) {
    const encrypted = this.encryptDni(dni);
    const hash = this.hashDni(dni);
    const [result] = await db.query(
      'INSERT INTO workers (full_name, dni_encrypted, dni_hash) VALUES (?, ?, ?)',
      [full_name, encrypted, hash]
    );
    return result.insertId;
  }

  static async update(id, { full_name, is_active }) {
    const fields = [];
    const values = [];
    if (full_name !== undefined) { fields.push('full_name = ?'); values.push(full_name); }
    if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active); }
    if (fields.length === 0) return false;
    values.push(id);
    await db.query(`UPDATE workers SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  }

  static async delete(id) {
    await db.query('DELETE FROM workers WHERE id = ?', [id]);
  }
}

module.exports = WorkerModel;
