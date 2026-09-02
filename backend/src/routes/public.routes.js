import { Router } from "express";
import { CategoryRepo } from "../repositories/categories.repo.js";
import { ProductRepo } from "../repositories/products.repo.js";
import { SettingsRepo } from "../repositories/estimates.repo.js";
import { PromotionRepo } from "../repositories/promotions.repo.js";
import { GiftBoxRepo } from "../repositories/giftBoxes.repo.js";
import { ok, fail } from "../utils/response.js";

const router = Router();

// ---------- Categories ----------
router.get("/categories", (req, res, next) => {
  try {
    ok(res, CategoryRepo.findAll({ activeOnly: true }));
  } catch (e) {
    next(e);
  }
});

router.get("/categories/:slug", (req, res, next) => {
  try {
    const category = CategoryRepo.findBySlug(req.params.slug, { activeOnly: true });
    if (!category) return fail(res, "Category not found", 404);
    ok(res, category);
  } catch (e) {
    next(e);
  }
});

// ---------- Products ----------
router.get("/products", (req, res, next) => {
  try {
    const { category, search, featured, sort, page, limit } = req.query;

    // Customer catalogue is unpaginated by default: all active products are
    // returned in one response. Pagination only kicks in if the caller
    // explicitly supplies page/limit (kept for backward compatibility).
    const paginated = page !== undefined || limit !== undefined;

    if (!paginated) {
      const { items, total } = ProductRepo.list({
        activeOnly: true,
        categorySlug: category,
        search,
        featured: featured === "true",
        sort,
      });
      return ok(res, { items, total });
    }

    const take = Math.min(parseInt(limit, 10) || 10, 100);
    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const { items, total } = ProductRepo.list({
      activeOnly: true,
      categorySlug: category,
      search,
      featured: featured === "true",
      sort,
      limit: take,
      offset: (currentPage - 1) * take,
    });
    ok(res, { items, total, page: currentPage, limit: take });
  } catch (e) {
    next(e);
  }
});

router.get("/products/featured", (req, res, next) => {
  try {
    ok(res, ProductRepo.featured(8));
  } catch (e) {
    next(e);
  }
});

router.get("/products/:slug", (req, res, next) => {
  try {
    const product = ProductRepo.findBySlug(req.params.slug, { activeOnly: true });
    if (!product) return fail(res, "Product not found", 404);
    ok(res, product);
  } catch (e) {
    next(e);
  }
});

router.get("/promotions", (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const take = Math.min(parseInt(limit, 10) || 10, 100);
    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const { items, total } = PromotionRepo.list({
      activeOnly: true,
      limit: take,
      offset: (currentPage - 1) * take,
    });
    ok(res, { items, total, page: currentPage, limit: take });
  } catch (e) {
    next(e);
  }
});

// ---------- Settings (public subset) ----------
router.get("/settings/public", (req, res, next) => {
  try {
    ok(res, SettingsRepo.getAll());
  } catch (e) {
    next(e);
  }
});

// ---------- Gift Boxes ----------
// Active gift boxes only, sorted for display. No admin auth required.
router.get("/gift-boxes", (req, res, next) => {
  try {
    ok(res, GiftBoxRepo.findAll({ activeOnly: true }));
  } catch (e) {
    next(e);
  }
});

export default router;
