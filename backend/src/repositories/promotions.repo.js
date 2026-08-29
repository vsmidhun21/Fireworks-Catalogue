import { db, nowIso } from "../config/db.js";

function rowToPromotion(r) {
  if (!r) return null;
  return {
    id: r.id,
    title: r.title,
    subtitle: r.subtitle,
    imageUrl: r.image_url,
    ctaLabel: r.cta_label,
    ctaUrl: r.cta_url,
    sortOrder: r.sort_order,
    isActive: !!r.is_active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export const PromotionRepo = {
  list({ activeOnly = false, limit = 10, offset = 0 } = {}) {
    const where = activeOnly ? "WHERE is_active = 1" : "";
    const total = db.prepare(`SELECT COUNT(*) as c FROM promotions ${where}`).get().c;
    const rows = db
      .prepare(
        `SELECT * FROM promotions ${where}
         ORDER BY sort_order ASC, created_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(limit, offset);
    return { items: rows.map(rowToPromotion), total };
  },
  findById(id) {
    return rowToPromotion(db.prepare("SELECT * FROM promotions WHERE id = ?").get(id));
  },
  create({ title, subtitle, imageUrl, ctaLabel, ctaUrl, sortOrder = 0, isActive = true }) {
    const info = db
      .prepare(
        `INSERT INTO promotions
         (title, subtitle, image_url, cta_label, cta_url, sort_order, is_active, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(title, subtitle || null, imageUrl, ctaLabel || null, ctaUrl || null, sortOrder, isActive ? 1 : 0, nowIso());
    return PromotionRepo.findById(Number(info.lastInsertRowid));
  },
  update(id, fields) {
    const current = PromotionRepo.findById(id);
    if (!current) return null;
    const merged = { ...current, ...fields };
    db.prepare(
      `UPDATE promotions
       SET title = ?, subtitle = ?, image_url = ?, cta_label = ?, cta_url = ?, sort_order = ?, is_active = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      merged.title,
      merged.subtitle,
      merged.imageUrl,
      merged.ctaLabel,
      merged.ctaUrl,
      merged.sortOrder,
      merged.isActive ? 1 : 0,
      nowIso(),
      id
    );
    return PromotionRepo.findById(id);
  },
  setActive(id, isActive) {
    db.prepare("UPDATE promotions SET is_active = ?, updated_at = ? WHERE id = ?").run(isActive ? 1 : 0, nowIso(), id);
    return PromotionRepo.findById(id);
  },
  delete(id) {
    db.prepare("DELETE FROM promotions WHERE id = ?").run(id);
  },
};
