import { Router } from "express";
import { CategoryRepo } from "../repositories/categories.repo.js";
import { ProductRepo } from "../repositories/products.repo.js";
import { CustomerRepo, EstimateRepo, SettingsRepo } from "../repositories/estimates.repo.js";
import { ok, fail, slugify } from "../utils/response.js";
import { requireAdmin } from "../middleware/auth.js";
import { uploadProductImage } from "../middleware/upload.js";

const router = Router();
router.use(requireAdmin);

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
router.get("/dashboard", (req, res, next) => {
  try {
    ok(res, {
      totalProducts: ProductRepo.count(),
      featuredProducts: ProductRepo.countFeatured(),
      totalCategories: CategoryRepo.count(),
      newEstimates: EstimateRepo.countByStatus(["NEW"]),
      pendingEstimates: EstimateRepo.countByStatus(["NEW", "CONTACTED"]),
      completedEstimates: EstimateRepo.countByStatus(["COMPLETED"]),
      recentEstimates: EstimateRepo.recent(8).map((e) => ({
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
router.get("/categories", (req, res, next) => {
  try {
    ok(res, CategoryRepo.findAll());
  } catch (e) {
    next(e);
  }
});

router.post("/categories", (req, res, next) => {
  try {
    const { nameEn, nameTa, descriptionEn, descriptionTa, imageUrl, sortOrder } = req.body;
    if (!nameEn) return fail(res, "English name is required", 422);
    const category = CategoryRepo.create({
      nameEn,
      nameTa,
      descriptionEn,
      descriptionTa,
      imageUrl,
      sortOrder,
      slug: slugify(nameEn) + "-" + Date.now().toString(36),
    });
    ok(res, category, "Category created", 201);
  } catch (e) {
    next(e);
  }
});

router.put("/categories/:id", (req, res, next) => {
  try {
    const category = CategoryRepo.update(Number(req.params.id), req.body);
    if (!category) return fail(res, "Category not found", 404);
    ok(res, category, "Category updated");
  } catch (e) {
    next(e);
  }
});

router.patch("/categories/:id/status", (req, res, next) => {
  try {
    const category = CategoryRepo.setActive(Number(req.params.id), !!req.body.isActive);
    ok(res, category, "Category status updated");
  } catch (e) {
    next(e);
  }
});

router.delete("/categories/:id", (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const inUse = CategoryRepo.countProductsInCategory(id);
    if (inUse > 0) {
      CategoryRepo.setActive(id, false);
      return ok(res, null, "Category has products; archived instead of deleted");
    }
    CategoryRepo.delete(id);
    ok(res, null, "Category deleted");
  } catch (e) {
    next(e);
  }
});

// ---------- Products ----------
router.get("/products", (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, category } = req.query;
    const take = Math.min(parseInt(limit, 10) || 20, 100);
    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    let categorySlug;
    if (category) {
      const cat = CategoryRepo.findById(Number(category));
      categorySlug = cat?.slug;
    }
    const { items, total } = ProductRepo.list({
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

router.get("/products/:id", (req, res, next) => {
  try {
    const product = ProductRepo.findById(Number(req.params.id), { withCat: true });
    if (!product) return fail(res, "Product not found", 404);
    ok(res, product);
  } catch (e) {
    next(e);
  }
});

router.post("/products", (req, res, next) => {
  try {
    const b = req.body;
    if (!b.nameEn || !b.categoryId || !b.productCode || b.originalPrice == null) {
      return fail(res, "nameEn, categoryId, productCode and originalPrice are required", 422);
    }
    const product = ProductRepo.create({
      categoryId: Number(b.categoryId),
      productCode: b.productCode,
      nameEn: b.nameEn,
      nameTa: b.nameTa || null,
      slug: slugify(b.nameEn) + "-" + Date.now().toString(36),
      descriptionEn: b.descriptionEn || null,
      descriptionTa: b.descriptionTa || null,
      unit: b.unit || "Box",
      originalPrice: Number(b.originalPrice),
      discountedPrice: b.discountedPrice != null && b.discountedPrice !== "" ? Number(b.discountedPrice) : null,
      imageUrl: b.imageUrl || null,
      isFeatured: !!b.isFeatured,
      isNewArrival: !!b.isNewArrival,
      sortOrder: b.sortOrder || 0,
    });
    ok(res, product, "Product created", 201);
  } catch (e) {
    if (e.status === 409) return fail(res, e.message, 409);
    next(e);
  }
});

router.put("/products/:id", (req, res, next) => {
  try {
    const b = req.body;
    const fields = {};
    if (b.categoryId != null) fields.categoryId = Number(b.categoryId);
    if (b.productCode != null) fields.productCode = b.productCode;
    if (b.nameEn != null) fields.nameEn = b.nameEn;
    if (b.nameTa !== undefined) fields.nameTa = b.nameTa;
    if (b.descriptionEn !== undefined) fields.descriptionEn = b.descriptionEn;
    if (b.descriptionTa !== undefined) fields.descriptionTa = b.descriptionTa;
    if (b.unit != null) fields.unit = b.unit;
    if (b.originalPrice != null) fields.originalPrice = Number(b.originalPrice);
    if (b.discountedPrice !== undefined) fields.discountedPrice = b.discountedPrice === "" ? null : Number(b.discountedPrice);
    if (b.imageUrl !== undefined) fields.imageUrl = b.imageUrl;
    if (b.isFeatured !== undefined) fields.isFeatured = !!b.isFeatured;
    if (b.isNewArrival !== undefined) fields.isNewArrival = !!b.isNewArrival;
    if (b.sortOrder != null) fields.sortOrder = b.sortOrder;

    const product = ProductRepo.update(Number(req.params.id), fields);
    if (!product) return fail(res, "Product not found", 404);
    ok(res, product, "Product updated");
  } catch (e) {
    next(e);
  }
});

router.patch("/products/:id/status", (req, res, next) => {
  try {
    ok(res, ProductRepo.setActive(Number(req.params.id), !!req.body.isActive), "Product status updated");
  } catch (e) {
    next(e);
  }
});

router.patch("/products/:id/featured", (req, res, next) => {
  try {
    ok(res, ProductRepo.setFeatured(Number(req.params.id), !!req.body.isFeatured), "Featured status updated");
  } catch (e) {
    next(e);
  }
});

router.delete("/products/:id", (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const usedInEstimates = ProductRepo.usedInEstimates(id);
    if (usedInEstimates > 0) {
      ProductRepo.setActive(id, false);
      return ok(res, null, "Product used in past estimates; archived instead of deleted");
    }
    ProductRepo.delete(id);
    ok(res, null, "Product deleted");
  } catch (e) {
    next(e);
  }
});

// ---------- Estimates ----------
router.get("/estimates", (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const take = Math.min(parseInt(limit, 10) || 20, 100);
    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const { items, total } = EstimateRepo.list({ status, search, limit: take, offset: (currentPage - 1) * take });
    ok(res, { items, total, page: currentPage, limit: take });
  } catch (e) {
    next(e);
  }
});

router.get("/estimates/:id", (req, res, next) => {
  try {
    const estimate = EstimateRepo.findByIdWithDetails(Number(req.params.id));
    if (!estimate) return fail(res, "Estimate not found", 404);
    ok(res, estimate);
  } catch (e) {
    next(e);
  }
});

router.patch("/estimates/:id/status", (req, res, next) => {
  try {
    const allowed = ["NEW", "CONTACTED", "CONFIRMED", "COMPLETED", "CANCELLED"];
    if (!allowed.includes(req.body.status)) return fail(res, "Invalid status", 422);
    ok(res, EstimateRepo.setStatus(Number(req.params.id), req.body.status), "Estimate status updated");
  } catch (e) {
    next(e);
  }
});

router.patch("/estimates/:id/notes", (req, res, next) => {
  try {
    ok(res, EstimateRepo.setAdminNotes(Number(req.params.id), req.body.adminNotes || ""), "Notes updated");
  } catch (e) {
    next(e);
  }
});

// ---------- Customers ----------
router.get("/customers", (req, res, next) => {
  try {
    ok(res, CustomerRepo.listAll());
  } catch (e) {
    next(e);
  }
});

router.get("/customers/:id", (req, res, next) => {
  try {
    const customer = CustomerRepo.findWithEstimates(Number(req.params.id));
    if (!customer) return fail(res, "Customer not found", 404);
    ok(res, customer);
  } catch (e) {
    next(e);
  }
});

// ---------- Settings ----------
router.get("/settings", (req, res, next) => {
  try {
    ok(res, SettingsRepo.getAll());
  } catch (e) {
    next(e);
  }
});

router.put("/settings", (req, res, next) => {
  try {
    SettingsRepo.setMany(req.body || {});
    ok(res, null, "Settings updated");
  } catch (e) {
    next(e);
  }
});

export default router;
