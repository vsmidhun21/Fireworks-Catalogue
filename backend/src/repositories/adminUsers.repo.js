import { db, nowIso } from "../config/db.js";

function rowToAdmin(r) {
  if (!r) return null;
  return {
    id: r.id,
    username: r.username,
    email: r.email,
    passwordHash: r.password_hash || r.password,
    fullName: r.full_name,
    isActive: !!r.is_active,
    lastLoginAt: r.last_login_at,
  };
}

export const AdminUserRepo = {
  async findByLogin(usernameOrEmail) {
    const row = await db
      .prepare("SELECT * FROM admin_users WHERE (username = ? OR email = ?) AND (is_active = 1 OR is_active IS NULL)")
      .get(usernameOrEmail, usernameOrEmail);
    return rowToAdmin(row);
  },
  async findById(id) {
    const row = await db
      .prepare("SELECT id, username, email, password_hash, password, full_name, is_active, last_login_at FROM admin_users WHERE id = ?")
      .get(id);
    return rowToAdmin(row);
  },
  async updateLastLogin(id) {
    await db.prepare("UPDATE admin_users SET last_login_at = ?, updated_at = ? WHERE id = ?").run(nowIso(), nowIso(), id);
  },
  async create({ username, email, passwordHash, fullName }) {
    const info = await db
      .prepare("INSERT INTO admin_users (username, email, password, password_hash, full_name, updated_at) VALUES (?,?,?,?,?,?)")
      .run(username, email, passwordHash, passwordHash, fullName || null, nowIso());
    return await AdminUserRepo.findById(Number(info.lastInsertRowid));
  },
};
