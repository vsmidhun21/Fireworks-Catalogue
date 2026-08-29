import { db, nowIso } from "../config/db.js";

function rowToCategory(r) {
  if (!r) return null;
  return {
    id: r.id,
    nameEn: r.name_en,
    nameTa: r.name_ta,
    slug: r.slug,
    descriptionEn: r.description_en,
    descriptionTa: r.description_ta,
    imageUrl: r.image_url,
    sortOrder: r.sort_order,
    isActive: !!r.is_active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export const CategoryRepo = {
  list({ activeOnly = false, limit = 10, offset = 0 } = {}) {
    const where = activeOnly ? "WHERE is_active = 1" : "";
    const total = db.prepare(`SELECT COUNT(*) as c FROM categories ${where}`).get().c;
    const rows = db
      .prepare(`SELECT * FROM categories ${where} ORDER BY sort_order ASC, created_at DESC LIMIT ? OFFSET ?`)
      .all(limit, offset);
    return { items: rows.map(rowToCategory), total };
  },
  findAll({ activeOnly = false } = {}) {
    const sql = activeOnly
      ? "SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC"
      : "SELECT * FROM categories ORDER BY sort_order ASC";
    return db.prepare(sql).all().map(rowToCategory);
  },
  findBySlug(slug, { activeOnly = false } = {}) {
    const sql = activeOnly
      ? "SELECT * FROM categories WHERE slug = ? AND is_active = 1"
      : "SELECT * FROM categories WHERE slug = ?";
    return rowToCategory(db.prepare(sql).get(slug));
  },
  findById(id) {
    return rowToCategory(db.prepare("SELECT * FROM categories WHERE id = ?").get(id));
  },
  create({ nameEn, nameTa, slug, descriptionEn, descriptionTa, imageUrl, sortOrder }) {
    const info = db
      .prepare(
        `INSERT INTO categories (name_en, name_ta, slug, description_en, description_ta, image_url, sort_order, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(nameEn, nameTa || null, slug, descriptionEn || null, descriptionTa || null, imageUrl || null, sortOrder || 0, nowIso());
    return CategoryRepo.findById(Number(info.lastInsertRowid));
  },
  update(id, fields) {
    const current = CategoryRepo.findById(id);
    if (!current) return null;
    const merged = { ...current, ...fields };
    db.prepare(
      `UPDATE categories SET name_en=?, name_ta=?, description_en=?, description_ta=?, image_url=?, sort_order=?, updated_at=? WHERE id=?`
    ).run(merged.nameEn, merged.nameTa, merged.descriptionEn, merged.descriptionTa, merged.imageUrl, merged.sortOrder, nowIso(), id);
    return CategoryRepo.findById(id);
  },
  setActive(id, isActive) {
    db.prepare("UPDATE categories SET is_active=?, updated_at=? WHERE id=?").run(isActive ? 1 : 0, nowIso(), id);
    return CategoryRepo.findById(id);
  },
  countProductsInCategory(id) {
    return db.prepare("SELECT COUNT(*) as c FROM products WHERE category_id = ?").get(id).c;
  },
  delete(id) {
    db.prepare("DELETE FROM categories WHERE id = ?").run(id);
  },
  count() {
    return db.prepare("SELECT COUNT(*) as c FROM categories").get().c;
  },
};
