import { db, nowIso } from "../config/db.js";

function rowToAdmin(r) {
  if (!r) return null;
  return {
    id: r.id,
    username: r.username,
    email: r.email,
    passwordHash: r.password_hash,
    fullName: r.full_name,
    isActive: !!r.is_active,
    lastLoginAt: r.last_login_at,
  };
}

export const AdminUserRepo = {
  findByLogin(usernameOrEmail) {
    return rowToAdmin(
      db
        .prepare("SELECT * FROM admin_users WHERE (username = ? OR email = ?) AND is_active = 1")
        .get(usernameOrEmail, usernameOrEmail)
    );
  },
  findById(id) {
    return rowToAdmin(db.prepare("SELECT * FROM admin_users WHERE id = ?").get(id));
  },
  updateLastLogin(id) {
    db.prepare("UPDATE admin_users SET last_login_at = ?, updated_at = ? WHERE id = ?").run(nowIso(), nowIso(), id);
  },
  create({ username, email, passwordHash, fullName }) {
    const info = db
      .prepare("INSERT INTO admin_users (username, email, password_hash, full_name, updated_at) VALUES (?,?,?,?,?)")
      .run(username, email, passwordHash, fullName || null, nowIso());
    return AdminUserRepo.findById(Number(info.lastInsertRowid));
  },
};
