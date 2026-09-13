import { db, nowIso } from "../config/db.js";
import { CategoryRepo } from "./categories.repo.js";

function rowToProduct(r) {
  if (!r) return null;
  const originalPrice = Number(r.original_price);
  const discountedPrice = r.discounted_price != null ? Number(r.discounted_price) : Math.round(originalPrice * 0.10);
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
    originalPrice,
    discountedPrice,
    imageUrl: r.image_url,
    isFeatured: !!r.is_featured,
    isNewArrival: !!r.is_new_arrival,
    isActive: !!r.is_active,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

async function withCategory(product) {
  if (!product) return product;
  const category = await CategoryRepo.findById(product.categoryId);
  return { ...product, category };
}

function validateProductCode(productCode) {
  const normalized = String(productCode ?? "");
  if (!/^\d{3}$/.test(normalized)) {
    const err = new Error("Product code must be a unique three-digit number");
    err.status = 422;
    throw err;
  }
  return normalized;
}

export const ProductRepo = {
  async list({ activeOnly = true, categorySlug, search, featured, sort, limit, offset = 0 } = {}) {
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
    const countRow = await db.prepare(countSql).get(...params);
    const total = Number(countRow?.c || 0);

    // When no limit is provided, return every matching row (no pagination).
    const hasLimit = limit !== undefined && limit !== null;
    const listSql = hasLimit
      ? `SELECT p.* FROM products p ${join} ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
      : `SELECT p.* FROM products p ${join} ${where} ORDER BY ${orderBy}`;
    const rows = hasLimit
      ? await db.prepare(listSql).all(...params, Number(limit), Number(offset))
      : await db.prepare(listSql).all(...params);

    const items = await Promise.all(rows.map(rowToProduct).map(withCategory));
    return { items, total };
  },
  async featured(limit = 8) {
    const rows = await db
      .prepare("SELECT * FROM products WHERE is_active = 1 AND is_featured = 1 ORDER BY sort_order ASC LIMIT ?")
      .all(Number(limit));
    return await Promise.all(rows.map(rowToProduct).map(withCategory));
  },
  async findBySlug(slug, { activeOnly = true } = {}) {
    const sql = activeOnly ? "SELECT * FROM products WHERE slug = ? AND is_active = 1" : "SELECT * FROM products WHERE slug = ?";
    const row = await db.prepare(sql).get(slug);
    return await withCategory(rowToProduct(row));
  },
  async findById(id, { withCat = false } = {}) {
    const row = await db.prepare("SELECT * FROM products WHERE id = ?").get(id);
    const p = rowToProduct(row);
    return withCat ? await withCategory(p) : p;
  },
  async findManyByIds(ids) {
    if (!ids.length) return [];
    const placeholders = ids.map(() => "?").join(",");
    const rows = await db.prepare(`SELECT * FROM products WHERE id IN (${placeholders}) AND is_active = 1`).all(...ids);
    return rows.map(rowToProduct);
  },
  async findByCode(code) {
    const row = await db.prepare("SELECT * FROM products WHERE product_code = ?").get(code);
    return rowToProduct(row);
  },
  async nextProductCode() {
    const row = await db
      .prepare(
        `SELECT COALESCE(MAX(CAST(product_code AS UNSIGNED)), 0) as maxCode
         FROM products
         WHERE product_code REGEXP '^[0-9]{3}$'`
      )
      .get();
    const nextCode = Number(row?.maxCode || 0) + 1;
    if (nextCode > 999) {
      const err = new Error("Product code limit reached");
      err.status = 422;
      throw err;
    }
    return String(nextCode).padStart(3, "0");
  },
  async create(p) {
    p.productCode = validateProductCode(p.productCode);
    const existing = await ProductRepo.findByCode(p.productCode);
    if (existing) {
      const err = new Error("Product code must be unique");
      err.status = 409;
      throw err;
    }
    const info = await db
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
    return await ProductRepo.findById(Number(info.lastInsertRowid), { withCat: true });
  },
  async update(id, fields) {
    const current = await ProductRepo.findById(id);
    if (!current) return null;
    const merged = { ...current, ...fields };
    merged.productCode = validateProductCode(merged.productCode);
    if (merged.productCode !== current.productCode) {
      const existing = await ProductRepo.findByCode(merged.productCode);
      if (existing && existing.id !== id) {
        const err = new Error("Product code must be unique");
        err.status = 409;
        throw err;
      }
    }
    await db.prepare(
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
    return await ProductRepo.findById(id, { withCat: true });
  },
  async setActive(id, isActive) {
    await db.prepare("UPDATE products SET is_active=?, updated_at=? WHERE id=?").run(isActive ? 1 : 0, nowIso(), id);
    return await ProductRepo.findById(id, { withCat: true });
  },
  async setFeatured(id, isFeatured) {
    await db.prepare("UPDATE products SET is_featured=?, updated_at=? WHERE id=?").run(isFeatured ? 1 : 0, nowIso(), id);
    return await ProductRepo.findById(id, { withCat: true });
  },
  async usedInEstimates(id) {
    const row = await db.prepare("SELECT COUNT(*) as c FROM estimate_items WHERE product_id = ?").get(id);
    return Number(row?.c || 0);
  },
  async delete(id) {
    await db.prepare("DELETE FROM products WHERE id = ?").run(id);
  },
  async count() {
    const row = await db.prepare("SELECT COUNT(*) as c FROM products").get();
    return Number(row?.c || 0);
  },
  async countFeatured() {
    const row = await db.prepare("SELECT COUNT(*) as c FROM products WHERE is_featured = 1").get();
    return Number(row?.c || 0);
  },
};
