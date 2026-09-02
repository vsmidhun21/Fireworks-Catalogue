import { db, nowIso } from "../config/db.js";

function rowToGiftBox(r) {
  if (!r) return null;
  return {
    id: r.id,
    nameEn: r.name_en,
    nameTa: r.name_ta,
    descriptionEn: r.description_en,
    descriptionTa: r.description_ta,
    imageUrl: r.image_url,
    sortOrder: r.sort_order,
    isActive: !!r.is_active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export const GiftBoxRepo = {
  list({ activeOnly = false, limit = 10, offset = 0 } = {}) {
    const where = activeOnly ? "WHERE is_active = 1" : "";
    const total = db.prepare(`SELECT COUNT(*) as c FROM gift_boxes ${where}`).get().c;
    const rows = db
      .prepare(`SELECT * FROM gift_boxes ${where} ORDER BY sort_order ASC, created_at DESC LIMIT ? OFFSET ?`)
      .all(limit, offset);
    return { items: rows.map(rowToGiftBox), total };
  },
  findAll({ activeOnly = false } = {}) {
    const sql = activeOnly
      ? "SELECT * FROM gift_boxes WHERE is_active = 1 ORDER BY sort_order ASC"
      : "SELECT * FROM gift_boxes ORDER BY sort_order ASC";
    return db.prepare(sql).all().map(rowToGiftBox);
  },
  findById(id) {
    return rowToGiftBox(db.prepare("SELECT * FROM gift_boxes WHERE id = ?").get(id));
  },
  create({ nameEn, nameTa, descriptionEn, descriptionTa, imageUrl, sortOrder = 0, isActive = true }) {
    const info = db
      .prepare(
        `INSERT INTO gift_boxes (name_en, name_ta, description_en, description_ta, image_url, sort_order, is_active, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        nameEn,
        nameTa || null,
        descriptionEn || null,
        descriptionTa || null,
        imageUrl || null,
        sortOrder || 0,
        isActive ? 1 : 0,
        nowIso()
      );
    return GiftBoxRepo.findById(Number(info.lastInsertRowid));
  },
  update(id, fields) {
    const current = GiftBoxRepo.findById(id);
    if (!current) return null;
    const merged = { ...current, ...fields };
    db.prepare(
      `UPDATE gift_boxes
       SET name_en = ?, name_ta = ?, description_en = ?, description_ta = ?, image_url = ?, sort_order = ?, is_active = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      merged.nameEn,
      merged.nameTa,
      merged.descriptionEn,
      merged.descriptionTa,
      merged.imageUrl,
      merged.sortOrder,
      merged.isActive ? 1 : 0,
      nowIso(),
      id
    );
    return GiftBoxRepo.findById(id);
  },
  setActive(id, isActive) {
    db.prepare("UPDATE gift_boxes SET is_active = ?, updated_at = ? WHERE id = ?").run(isActive ? 1 : 0, nowIso(), id);
    return GiftBoxRepo.findById(id);
  },
  delete(id) {
    db.prepare("DELETE FROM gift_boxes WHERE id = ?").run(id);
  },
  count() {
    return db.prepare("SELECT COUNT(*) as c FROM gift_boxes").get().c;
  },
};
