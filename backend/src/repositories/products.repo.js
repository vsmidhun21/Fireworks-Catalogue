import { db, nowIso } from "../config/db.js";
import { CategoryRepo } from "./categories.repo.js";

function rowToProduct(r) {
  if (!r) return null;
  return {
    id: r.id,
    categoryId: r.category_id,
    productCode: r.product_code,
    nameEn: r.name_en,
    nameTa: r.name_ta,
    slug: r.slug,
    descriptionEn: r.description_en,
    descriptionTa: r.description_ta,
    unit: r.unit,
    originalPrice: r.original_price,
    discountedPrice: r.discounted_price,
    imageUrl: r.image_url,
    isFeatured: !!r.is_featured,
    isNewArrival: !!r.is_new_arrival,
    isActive: !!r.is_active,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function withCategory(product) {
  if (!product) return product;
  return { ...product, category: CategoryRepo.findById(product.categoryId) };
}

export const ProductRepo = {
  list({ activeOnly = true, categorySlug, search, featured, sort, limit = 20, offset = 0 } = {}) {
    const clauses = [];
    const params = [];
    let joinCategory = false;

    if (activeOnly) clauses.push("p.is_active = 1");
    if (categorySlug) {
      joinCategory = true;
      clauses.push("c.slug = ?");
      params.push(categorySlug);
    }
    if (featured) clauses.push("p.is_featured = 1");
    if (search) {
      clauses.push("(p.name_en LIKE ? OR p.name_ta LIKE ? OR p.product_code LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    let orderBy = "p.sort_order ASC";
    if (sort === "price_asc") orderBy = "p.original_price ASC";
    if (sort === "price_desc") orderBy = "p.original_price DESC";
    if (sort === "newest") orderBy = "p.created_at DESC";

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const join = joinCategory ? "JOIN categories c ON c.id = p.category_id" : "";

    const countSql = `SELECT COUNT(*) as c FROM products p ${join} ${where}`;
    const total = db.prepare(countSql).get(...params).c;

    const listSql = `SELECT p.* FROM products p ${join} ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    const rows = db.prepare(listSql).all(...params, limit, offset);

    return { items: rows.map(rowToProduct).map(withCategory), total };
  },
  featured(limit = 8) {
    const rows = db
      .prepare("SELECT * FROM products WHERE is_active = 1 AND is_featured = 1 ORDER BY sort_order ASC LIMIT ?")
      .all(limit);
    return rows.map(rowToProduct).map(withCategory);
  },
  findBySlug(slug, { activeOnly = true } = {}) {
    const sql = activeOnly ? "SELECT * FROM products WHERE slug = ? AND is_active = 1" : "SELECT * FROM products WHERE slug = ?";
    return withCategory(rowToProduct(db.prepare(sql).get(slug)));
  },
  findById(id, { withCat = false } = {}) {
    const p = rowToProduct(db.prepare("SELECT * FROM products WHERE id = ?").get(id));
    return withCat ? withCategory(p) : p;
  },
  findManyByIds(ids) {
    if (!ids.length) return [];
    const placeholders = ids.map(() => "?").join(",");
    const rows = db.prepare(`SELECT * FROM products WHERE id IN (${placeholders}) AND is_active = 1`).all(...ids);
    return rows.map(rowToProduct);
  },
  findByCode(code) {
    return rowToProduct(db.prepare("SELECT * FROM products WHERE product_code = ?").get(code));
  },
  create(p) {
    const existing = ProductRepo.findByCode(p.productCode);
    if (existing) {
      const err = new Error("Product code must be unique");
      err.status = 409;
      throw err;
    }
    const info = db
      .prepare(
        `INSERT INTO products
         (category_id, product_code, name_en, name_ta, slug, description_en, description_ta, unit,
          original_price, discounted_price, image_url, is_featured, is_new_arrival, sort_order, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
      )
      .run(
        p.categoryId,
        p.productCode,
        p.nameEn,
        p.nameTa || null,
        p.slug,
        p.descriptionEn || null,
        p.descriptionTa || null,
        p.unit || "Box",
        p.originalPrice,
        p.discountedPrice ?? null,
        p.imageUrl || null,
        p.isFeatured ? 1 : 0,
        p.isNewArrival ? 1 : 0,
        p.sortOrder || 0,
        nowIso()
      );
    return ProductRepo.findById(Number(info.lastInsertRowid), { withCat: true });
  },
  update(id, fields) {
    const current = ProductRepo.findById(id);
    if (!current) return null;
    const merged = { ...current, ...fields };
    db.prepare(
      `UPDATE products SET category_id=?, product_code=?, name_en=?, name_ta=?, description_en=?, description_ta=?,
       unit=?, original_price=?, discounted_price=?, image_url=?, is_featured=?, is_new_arrival=?, sort_order=?, updated_at=?
       WHERE id=?`
    ).run(
      merged.categoryId,
      merged.productCode,
      merged.nameEn,
      merged.nameTa,
      merged.descriptionEn,
      merged.descriptionTa,
      merged.unit,
      merged.originalPrice,
      merged.discountedPrice,
      merged.imageUrl,
      merged.isFeatured ? 1 : 0,
      merged.isNewArrival ? 1 : 0,
      merged.sortOrder,
      nowIso(),
      id
    );
    return ProductRepo.findById(id, { withCat: true });
  },
  setActive(id, isActive) {
    db.prepare("UPDATE products SET is_active=?, updated_at=? WHERE id=?").run(isActive ? 1 : 0, nowIso(), id);
    return ProductRepo.findById(id, { withCat: true });
  },
  setFeatured(id, isFeatured) {
    db.prepare("UPDATE products SET is_featured=?, updated_at=? WHERE id=?").run(isFeatured ? 1 : 0, nowIso(), id);
    return ProductRepo.findById(id, { withCat: true });
  },
  usedInEstimates(id) {
    return db.prepare("SELECT COUNT(*) as c FROM estimate_items WHERE product_id = ?").get(id).c;
  },
  delete(id) {
    db.prepare("DELETE FROM products WHERE id = ?").run(id);
  },
  count() {
    return db.prepare("SELECT COUNT(*) as c FROM products").get().c;
  },
  countFeatured() {
    return db.prepare("SELECT COUNT(*) as c FROM products WHERE is_featured = 1").get().c;
  },
};
