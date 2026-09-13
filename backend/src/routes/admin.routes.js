import { Router } from "express";
import { CategoryRepo } from "../repositories/categories.repo.js";
import { ProductRepo } from "../repositories/products.repo.js";
import { CustomerRepo, EstimateRepo, SettingsRepo } from "../repositories/estimates.repo.js";
import { PromotionRepo } from "../repositories/promotions.repo.js";
import { GiftBoxRepo } from "../repositories/giftBoxes.repo.js";
import { ok, fail, slugify } from "../utils/response.js";
import { requireAdmin } from "../middleware/auth.js";
import {
  uploadProductImage,
  uploadPromotionImage,
  uploadBrandingImage,
  uploadGiftBoxImage,
  uploadCategoryImage,
  deleteUploadedFile,
  cleanupReplacedImage,
} from "../middleware/upload.js";

const router = Router();
router.use(requireAdmin);

function parseBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true" || value === "1" || value === "on";
  return false;
}

function parseNullableText(value) {
  if (value === undefined) return undefined;
  if (typeof value !== "string") return value ?? null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseNullableNumber(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function getUploadedImageUrl(req) {
  return req.file ? `/uploads/products/${req.file.filename}` : undefined;
}

// ---------- Uploads ----------
router.post("/upload", uploadProductImage.single("image"), (req, res, next) => {
  try {
    if (!req.file) {
      return fail(res, "No image file provided", 400);
    }
    const relativeUrl = `/uploads/products/${req.file.filename}`;
    ok(
      res,
      {
        url: relativeUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
      },
      "Image uploaded successfully",
      201
    );
  } catch (e) {
    next(e);
  }
});

// ---------- Dashboard ----------
router.get("/dashboard", async (req, res, next) => {
  try {
    const [totalProducts, featuredProducts, totalCategories, newEstimates, pendingEstimates, completedEstimates, recentEstimates] =
      await Promise.all([
        ProductRepo.count(),
        ProductRepo.countFeatured(),
        CategoryRepo.count(),
        EstimateRepo.countByStatus(["NEW"]),
        EstimateRepo.countByStatus(["NEW", "CONTACTED"]),
        EstimateRepo.countByStatus(["COMPLETED"]),
        EstimateRepo.recent(8),
      ]);

    ok(res, {
      totalProducts,
      featuredProducts,
      totalCategories,
      newEstimates,
      pendingEstimates,
      completedEstimates,
      recentEstimates: recentEstimates.map((e) => ({
        id: e.id,
        estimateNumber: e.estimateNumber,
        customerName: e.customer?.name,
        total: e.estimatedTotal,
        status: e.status,
        createdAt: e.createdAt,
      })),
    });
  } catch (e) {
    next(e);
  }
});

// ---------- Categories ----------
router.get("/categories", async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const take = Math.min(parseInt(limit, 10) || 10, 100);
    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const { items, total } = await CategoryRepo.list({
      limit: take,
      offset: (currentPage - 1) * take,
    });
    ok(res, { items, total, page: currentPage, limit: take });
  } catch (e) {
    next(e);
  }
});

router.post("/categories", uploadCategoryImage.single("image"), async (req, res, next) => {
  try {
    const { nameEn, nameTa, descriptionEn, descriptionTa, imageUrl, sortOrder } = req.body;
    if (!nameEn) return fail(res, "English name is required", 422);
    const category = await CategoryRepo.create({
      nameEn,
      nameTa,
      descriptionEn,
      descriptionTa,
      imageUrl: req.file ? `/uploads/categories/${req.file.filename}` : parseNullableText(imageUrl),
      sortOrder: parseNullableNumber(sortOrder) ?? 0,
      slug: slugify(nameEn) + "-" + Date.now().toString(36),
    });
    ok(res, category, "Category created", 201);
  } catch (e) {
    next(e);
  }
});

router.put("/categories/:id", uploadCategoryImage.single("image"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await CategoryRepo.findById(id);
    if (!existing) return fail(res, "Category not found", 404);
    const b = req.body;
    const fields = { ...b };
    if (b.sortOrder !== undefined) fields.sortOrder = parseNullableNumber(b.sortOrder) ?? 0;
    if (req.file) {
      fields.imageUrl = `/uploads/categories/${req.file.filename}`;
    } else if (b.imageUrl !== undefined) {
      fields.imageUrl = parseNullableText(b.imageUrl);
    }
    const category = await CategoryRepo.update(id, fields);
    if (!category) return fail(res, "Category not found", 404);
    cleanupReplacedImage(existing.imageUrl, category.imageUrl);
    ok(res, category, "Category updated");
  } catch (e) {
    next(e);
  }
});

router.patch("/categories/:id/status", async (req, res, next) => {
  try {
    const category = await CategoryRepo.setActive(Number(req.params.id), !!req.body.isActive);
    ok(res, category, "Category status updated");
  } catch (e) {
    next(e);
  }
});

router.delete("/categories/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const category = await CategoryRepo.findById(id);
    if (!category) return fail(res, "Category not found", 404);
    const inUse = await CategoryRepo.countProductsInCategory(id);
    if (inUse > 0) {
      await CategoryRepo.setActive(id, false);
      return ok(res, null, "Category has products; archived instead of deleted");
    }
    await CategoryRepo.delete(id);
    deleteUploadedFile(category.imageUrl);
    ok(res, null, "Category deleted");
  } catch (e) {
    next(e);
  }
});

// ---------- Products ----------
router.get("/products", async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, category } = req.query;
    const take = Math.min(parseInt(limit, 10) || 10, 100);
    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    let categorySlug;
    if (category) {
      const cat = await CategoryRepo.findById(Number(category));
      categorySlug = cat?.slug;
    }
    const { items, total } = await ProductRepo.list({
      activeOnly: false,
      categorySlug,
      search,
      limit: take,
      offset: (currentPage - 1) * take,
    });
    ok(res, { items, total, page: currentPage, limit: take });
  } catch (e) {
    next(e);
  }
});

router.get("/products/:id", async (req, res, next) => {
  try {
    const product = await ProductRepo.findById(Number(req.params.id), { withCat: true });
    if (!product) return fail(res, "Product not found", 404);
    ok(res, product);
  } catch (e) {
    next(e);
  }
});

router.post("/products", uploadProductImage.single("image"), async (req, res, next) => {
  try {
    const b = req.body;
    if (!b.nameEn || !b.categoryId || b.originalPrice == null || b.originalPrice === "") {
      return fail(res, "nameEn, categoryId and originalPrice are required", 422);
    }
    const productCode = await ProductRepo.nextProductCode();
    const product = await ProductRepo.create({
      categoryId: Number(b.categoryId),
      productCode,
      nameEn: b.nameEn,
      nameTa: parseNullableText(b.nameTa),
      slug: slugify(b.nameEn) + "-" + Date.now().toString(36),
      descriptionEn: parseNullableText(b.descriptionEn),
      descriptionTa: parseNullableText(b.descriptionTa),
      unit: b.unit || "Box",
      originalPrice: Number(b.originalPrice),
      discountedPrice: parseNullableNumber(b.discountedPrice),
      imageUrl: getUploadedImageUrl(req) ?? parseNullableText(b.imageUrl) ?? null,
      isFeatured: parseBoolean(b.isFeatured),
      isNewArrival: parseBoolean(b.isNewArrival),
      sortOrder: parseNullableNumber(b.sortOrder) ?? 0,
    });
    ok(res, product, "Product created", 201);
  } catch (e) {
    if (e.status === 409) return fail(res, e.message, 409);
    next(e);
  }
});

router.put("/products/:id", uploadProductImage.single("image"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await ProductRepo.findById(id);
    if (!existing) return fail(res, "Product not found", 404);
    const b = req.body;
    const fields = {};
    if (b.categoryId != null) fields.categoryId = Number(b.categoryId);
    if (b.productCode != null && b.productCode !== "") fields.productCode = String(b.productCode);
    if (b.nameEn != null) fields.nameEn = b.nameEn;
    if (b.nameTa !== undefined) fields.nameTa = parseNullableText(b.nameTa);
    if (b.descriptionEn !== undefined) fields.descriptionEn = parseNullableText(b.descriptionEn);
    if (b.descriptionTa !== undefined) fields.descriptionTa = parseNullableText(b.descriptionTa);
    if (b.unit != null) fields.unit = b.unit;
    if (b.originalPrice != null) fields.originalPrice = Number(b.originalPrice);
    if (b.discountedPrice !== undefined) fields.discountedPrice = parseNullableNumber(b.discountedPrice);
    if (req.file) {
      fields.imageUrl = getUploadedImageUrl(req);
    }
    if (b.isFeatured !== undefined) fields.isFeatured = parseBoolean(b.isFeatured);
    if (b.isNewArrival !== undefined) fields.isNewArrival = parseBoolean(b.isNewArrival);
    if (b.sortOrder != null) fields.sortOrder = Number(b.sortOrder);

    const product = await ProductRepo.update(id, fields);
    if (!product) return fail(res, "Product not found", 404);
    cleanupReplacedImage(existing.imageUrl, product.imageUrl);
    ok(res, product, "Product updated");
  } catch (e) {
    if (e.status === 409) return fail(res, e.message, 409);
    next(e);
  }
});

router.patch("/products/:id/status", async (req, res, next) => {
  try {
    ok(res, await ProductRepo.setActive(Number(req.params.id), !!req.body.isActive), "Product status updated");
  } catch (e) {
    next(e);
  }
});

router.patch("/products/:id/featured", async (req, res, next) => {
  try {
    ok(res, await ProductRepo.setFeatured(Number(req.params.id), !!req.body.isFeatured), "Featured status updated");
  } catch (e) {
    next(e);
  }
});

router.delete("/products/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const product = await ProductRepo.findById(id);
    if (!product) return fail(res, "Product not found", 404);
    const usedInEstimates = await ProductRepo.usedInEstimates(id);
    if (usedInEstimates > 0) {
      await ProductRepo.setActive(id, false);
      return ok(res, null, "Product used in past estimates; archived instead of deleted");
    }
    await ProductRepo.delete(id);
    deleteUploadedFile(product.imageUrl);
    ok(res, null, "Product deleted");
  } catch (e) {
    next(e);
  }
});

// ---------- Estimates ----------
router.get("/estimates", async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const take = Math.min(parseInt(limit, 10) || 10, 100);
    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const { items, total } = await EstimateRepo.list({ status, search, limit: take, offset: (currentPage - 1) * take });
    ok(res, { items, total, page: currentPage, limit: take });
  } catch (e) {
    next(e);
  }
});

router.get("/estimates/:id", async (req, res, next) => {
  try {
    const estimate = await EstimateRepo.findByIdWithDetails(Number(req.params.id));
    if (!estimate) return fail(res, "Estimate not found", 404);
    ok(res, estimate);
  } catch (e) {
    next(e);
  }
});

router.patch("/estimates/:id/status", async (req, res, next) => {
  try {
    const allowed = ["NEW", "CONTACTED", "CONFIRMED", "COMPLETED", "CANCELLED"];
    if (!allowed.includes(req.body.status)) return fail(res, "Invalid status", 422);
    ok(res, await EstimateRepo.setStatus(Number(req.params.id), req.body.status), "Estimate status updated");
  } catch (e) {
    next(e);
  }
});

router.patch("/estimates/:id/notes", async (req, res, next) => {
  try {
    ok(res, await EstimateRepo.setAdminNotes(Number(req.params.id), req.body.adminNotes || ""), "Notes updated");
  } catch (e) {
    next(e);
  }
});

// ---------- Customers ----------
router.get("/customers", async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const take = Math.min(parseInt(limit, 10) || 10, 100);
    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const { items, total } = await CustomerRepo.list({
      limit: take,
      offset: (currentPage - 1) * take,
    });
    ok(res, { items, total, page: currentPage, limit: take });
  } catch (e) {
    next(e);
  }
});

// ---------- Promotions ----------
router.get("/promotions", async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const take = Math.min(parseInt(limit, 10) || 10, 100);
    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const { items, total } = await PromotionRepo.list({
      limit: take,
      offset: (currentPage - 1) * take,
    });
    ok(res, { items, total, page: currentPage, limit: take });
  } catch (e) {
    next(e);
  }
});

router.post("/promotions", uploadPromotionImage.single("image"), async (req, res, next) => {
  try {
    const b = req.body;
    if (!b.title) return fail(res, "Promotion title is required", 422);
    if (!req.file) return fail(res, "Promotion banner image is required", 422);
    const promotion = await PromotionRepo.create({
      title: b.title,
      subtitle: parseNullableText(b.subtitle),
      imageUrl: `/uploads/promotions/${req.file.filename}`,
      ctaLabel: parseNullableText(b.ctaLabel),
      ctaUrl: parseNullableText(b.ctaUrl),
      sortOrder: parseNullableNumber(b.sortOrder) ?? 0,
      isActive: b.isActive === undefined ? true : parseBoolean(b.isActive),
    });
    ok(res, promotion, "Promotion created", 201);
  } catch (e) {
    next(e);
  }
});

router.put("/promotions/:id", uploadPromotionImage.single("image"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await PromotionRepo.findById(id);
    if (!existing) return fail(res, "Promotion not found", 404);
    const b = req.body;
    const fields = {};
    if (b.title != null) fields.title = b.title;
    if (b.subtitle !== undefined) fields.subtitle = parseNullableText(b.subtitle);
    if (req.file) fields.imageUrl = `/uploads/promotions/${req.file.filename}`;
    if (b.ctaLabel !== undefined) fields.ctaLabel = parseNullableText(b.ctaLabel);
    if (b.ctaUrl !== undefined) fields.ctaUrl = parseNullableText(b.ctaUrl);
    if (b.sortOrder !== undefined) fields.sortOrder = parseNullableNumber(b.sortOrder) ?? 0;
    if (b.isActive !== undefined) fields.isActive = parseBoolean(b.isActive);
    const promotion = await PromotionRepo.update(id, fields);
    if (!promotion) return fail(res, "Promotion not found", 404);
    cleanupReplacedImage(existing.imageUrl, promotion.imageUrl);
    ok(res, promotion, "Promotion updated");
  } catch (e) {
    next(e);
  }
});

router.patch("/promotions/:id/status", async (req, res, next) => {
  try {
    const promotion = await PromotionRepo.setActive(Number(req.params.id), !!req.body.isActive);
    if (!promotion) return fail(res, "Promotion not found", 404);
    ok(res, promotion, "Promotion status updated");
  } catch (e) {
    next(e);
  }
});

router.delete("/promotions/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const promotion = await PromotionRepo.findById(id);
    if (!promotion) return fail(res, "Promotion not found", 404);
    await PromotionRepo.delete(id);
    deleteUploadedFile(promotion.imageUrl);
    ok(res, null, "Promotion deleted");
  } catch (e) {
    next(e);
  }
});

// ---------- Gift Boxes ----------
router.get("/gift-boxes", async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const take = Math.min(parseInt(limit, 10) || 10, 100);
    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const { items, total } = await GiftBoxRepo.list({
      limit: take,
      offset: (currentPage - 1) * take,
    });
    ok(res, { items, total, page: currentPage, limit: take });
  } catch (e) {
    next(e);
  }
});

router.post("/gift-boxes", uploadGiftBoxImage.single("image"), async (req, res, next) => {
  try {
    const b = req.body;
    if (!b.nameEn) return fail(res, "English name is required", 422);
    const giftBox = await GiftBoxRepo.create({
      nameEn: b.nameEn,
      nameTa: parseNullableText(b.nameTa),
      descriptionEn: parseNullableText(b.descriptionEn),
      descriptionTa: parseNullableText(b.descriptionTa),
      imageUrl: req.file ? `/uploads/gift-boxes/${req.file.filename}` : parseNullableText(b.imageUrl),
      sortOrder: parseNullableNumber(b.sortOrder) ?? 0,
      isActive: b.isActive === undefined ? true : parseBoolean(b.isActive),
    });
    ok(res, giftBox, "Gift box created", 201);
  } catch (e) {
    next(e);
  }
});

router.put("/gift-boxes/:id", uploadGiftBoxImage.single("image"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await GiftBoxRepo.findById(id);
    if (!existing) return fail(res, "Gift box not found", 404);
    const b = req.body;
    const fields = {};
    if (b.nameEn != null) fields.nameEn = b.nameEn;
    if (b.nameTa !== undefined) fields.nameTa = parseNullableText(b.nameTa);
    if (b.descriptionEn !== undefined) fields.descriptionEn = parseNullableText(b.descriptionEn);
    if (b.descriptionTa !== undefined) fields.descriptionTa = parseNullableText(b.descriptionTa);
    if (req.file) fields.imageUrl = `/uploads/gift-boxes/${req.file.filename}`;
    else if (b.imageUrl !== undefined) fields.imageUrl = parseNullableText(b.imageUrl);
    if (b.sortOrder !== undefined) fields.sortOrder = parseNullableNumber(b.sortOrder) ?? 0;
    if (b.isActive !== undefined) fields.isActive = parseBoolean(b.isActive);

    const giftBox = await GiftBoxRepo.update(id, fields);
    if (!giftBox) return fail(res, "Gift box not found", 404);
    cleanupReplacedImage(existing.imageUrl, giftBox.imageUrl);
    ok(res, giftBox, "Gift box updated");
  } catch (e) {
    next(e);
  }
});

router.patch("/gift-boxes/:id/status", async (req, res, next) => {
  try {
    const giftBox = await GiftBoxRepo.setActive(Number(req.params.id), !!req.body.isActive);
    if (!giftBox) return fail(res, "Gift box not found", 404);
    ok(res, giftBox, "Gift box status updated");
  } catch (e) {
    next(e);
  }
});

router.delete("/gift-boxes/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const giftBox = await GiftBoxRepo.findById(id);
    if (!giftBox) return fail(res, "Gift box not found", 404);
    await GiftBoxRepo.delete(id);
    deleteUploadedFile(giftBox.imageUrl);
    ok(res, null, "Gift box deleted");
  } catch (e) {
    next(e);
  }
});

router.get("/customers/:id", async (req, res, next) => {
  try {
    const customer = await CustomerRepo.findWithEstimates(Number(req.params.id));
    if (!customer) return fail(res, "Customer not found", 404);
    ok(res, customer);
  } catch (e) {
    next(e);
  }
});

// ---------- Settings ----------
router.get("/settings", async (req, res, next) => {
  try {
    ok(res, await SettingsRepo.getAll());
  } catch (e) {
    next(e);
  }
});

router.put("/settings", async (req, res, next) => {
  try {
    await SettingsRepo.setMany(req.body || {});
    ok(res, await SettingsRepo.getAll(), "Settings updated");
  } catch (e) {
    next(e);
  }
});

router.post("/settings/logo", uploadBrandingImage.single("logo"), async (req, res, next) => {
  try {
    if (!req.file) return fail(res, "Logo image is required", 422);
    const previousSettings = await SettingsRepo.getAll();
    const previousLogoUrl = previousSettings?.logo_url;
    const logoUrl = `/uploads/branding/${req.file.filename}`;
    await SettingsRepo.setMany({ logo_url: logoUrl });
    cleanupReplacedImage(previousLogoUrl, logoUrl);
    ok(res, { logo_url: logoUrl }, "Logo updated");
  } catch (e) {
    next(e);
  }
});

export default router;
