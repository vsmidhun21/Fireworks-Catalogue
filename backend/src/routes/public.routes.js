import { Router } from "express";
import { CategoryRepo } from "../repositories/categories.repo.js";
import { ProductRepo } from "../repositories/products.repo.js";
import { SettingsRepo } from "../repositories/estimates.repo.js";
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
    const { category, search, featured, sort, page = 1, limit = 20 } = req.query;
    const take = Math.min(parseInt(limit, 10) || 20, 100);
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

// ---------- Settings (public subset) ----------
router.get("/settings/public", (req, res, next) => {
  try {
    ok(res, SettingsRepo.getAll());
  } catch (e) {
    next(e);
  }
});

export default router;
