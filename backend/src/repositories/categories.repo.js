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
  async list({ activeOnly = false, limit = 10, offset = 0 } = {}) {
    const where = activeOnly ? "WHERE is_active = 1" : "";
    const totalRow = await db.prepare(`SELECT COUNT(*) as c FROM categories ${where}`).get();
    const total = Number(totalRow?.c || 0);
    const rows = await db
      .prepare(`SELECT * FROM categories ${where} ORDER BY sort_order ASC, created_at DESC LIMIT ? OFFSET ?`)
      .all(Number(limit), Number(offset));
    return { items: rows.map(rowToCategory), total };
  },
  async findAll({ activeOnly = false } = {}) {
    const sql = activeOnly
      ? "SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC"
      : "SELECT * FROM categories ORDER BY sort_order ASC";
    const rows = await db.prepare(sql).all();
    return rows.map(rowToCategory);
  },
  async findBySlug(slug, { activeOnly = false } = {}) {
    const sql = activeOnly
      ? "SELECT * FROM categories WHERE slug = ? AND is_active = 1"
      : "SELECT * FROM categories WHERE slug = ?";
    const row = await db.prepare(sql).get(slug);
    return rowToCategory(row);
  },
  async findById(id) {
    const row = await db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
    return rowToCategory(row);
  },
  async create({ nameEn, nameTa, slug, descriptionEn, descriptionTa, imageUrl, sortOrder }) {
    const info = await db
      .prepare(
        `INSERT INTO categories (name_en, name_ta, slug, description_en, description_ta, image_url, sort_order, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(nameEn, nameTa || null, slug, descriptionEn || null, descriptionTa || null, imageUrl || null, sortOrder || 0, nowIso());
    return await CategoryRepo.findById(Number(info.lastInsertRowid));
  },
  async update(id, fields) {
    const current = await CategoryRepo.findById(id);
    if (!current) return null;
    const merged = { ...current, ...fields };
    await db.prepare(
      `UPDATE categories SET name_en=?, name_ta=?, description_en=?, description_ta=?, image_url=?, sort_order=?, updated_at=? WHERE id=?`
    ).run(merged.nameEn, merged.nameTa, merged.descriptionEn, merged.descriptionTa, merged.imageUrl, merged.sortOrder, nowIso(), id);
    return await CategoryRepo.findById(id);
  },
  async setActive(id, isActive) {
    await db.prepare("UPDATE categories SET is_active=?, updated_at=? WHERE id=?").run(isActive ? 1 : 0, nowIso(), id);
    return await CategoryRepo.findById(id);
  },
  async countProductsInCategory(id) {
    const row = await db.prepare("SELECT COUNT(*) as c FROM products WHERE category_id = ?").get(id);
    return Number(row?.c || 0);
  },
  async delete(id) {
    await db.prepare("DELETE FROM categories WHERE id = ?").run(id);
  },
  async count() {
    const row = await db.prepare("SELECT COUNT(*) as c FROM categories").get();
    return Number(row?.c || 0);
  },
};
