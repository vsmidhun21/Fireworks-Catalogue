import { Router } from "express";
import rateLimit from "express-rate-limit";
import { ProductRepo } from "../repositories/products.repo.js";
import { CustomerRepo, EstimateRepo } from "../repositories/estimates.repo.js";
import { ok, fail, generateEstimateNumber } from "../utils/response.js";
import { sendNewEstimateAdminEmail } from "../services/email.service.js";

const router = Router();

const estimateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many estimate requests. Please try again later.", errors: [] },
});

router.post("/estimates", estimateLimiter, async (req, res, next) => {
  try {
    const { items, customer } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return fail(res, "At least one product is required", 422, ["items is empty"]);
    }
    if (!customer || !customer.name || !customer.phone || !customer.address || !customer.city || !customer.state || !customer.pincode) {
      return fail(res, "Missing required customer details", 422);
    }

    const validationErrors = [];
    if (!/^\p{L}[\p{L} .'-]{1,79}$/u.test(String(customer.name).trim())) {
      validationErrors.push("name must contain letters, spaces, apostrophes or hyphens");
    }
    if (!/^[6-9]\d{9}$/.test(String(customer.phone).trim())) {
      validationErrors.push("phone must be a valid 10-digit mobile number");
    }
    if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(customer.email).trim())) {
      validationErrors.push("email must be valid");
    }
    if (!/^\p{L}[\p{L} .'-]{1,49}$/u.test(String(customer.city).trim())) {
      validationErrors.push("city must contain letters, spaces, apostrophes or hyphens");
    }
    if (!/^\p{L}[\p{L} .'-]{1,49}$/u.test(String(customer.state).trim())) {
      validationErrors.push("state must contain letters, spaces, apostrophes or hyphens");
    }
    if (!/^\d{6}$/.test(String(customer.pincode).trim())) {
      validationErrors.push("pincode must be a 6-digit number");
    }
    if (validationErrors.length > 0) {
      return fail(res, "Please provide valid customer details", 422, validationErrors);
    }

    // Re-validate every product server-side (never trust client price/quantity)
    const productIds = [...new Set(items.map((i) => Number(i.productId)))];
    const dbProducts = ProductRepo.findManyByIds(productIds);
    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    let subtotal = 0;
    let estimatedTotal = 0;
    const preparedItems = [];

    for (const item of items) {
      const product = productMap.get(Number(item.productId));
      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      if (!product) {
        return fail(res, `Product ${item.productId} is unavailable`, 422);
      }
      const unitOriginal = product.originalPrice;
      const unitDiscounted = product.discountedPrice != null ? product.discountedPrice : Math.round(unitOriginal * 0.10);
      const lineTotal = unitDiscounted * quantity;

      subtotal += unitOriginal * quantity;
      estimatedTotal += lineTotal;

      preparedItems.push({
        productId: product.id,
        productCode: product.productCode,
        productNameEn: product.nameEn,
        productNameTa: product.nameTa,
        unit: product.unit,
        quantity,
        originalUnitPrice: unitOriginal,
        discountedUnitPrice: unitDiscounted,
        lineTotal,
      });
    }

    const totalDiscount = subtotal - estimatedTotal;

    // Minimum order condition: to place an order, minimum order price must be ₹3,000
    const MIN_ORDER_PRICE = 3000;
    if (estimatedTotal < MIN_ORDER_PRICE) {
      return fail(
        res,
        `Minimum order price is ₹${MIN_ORDER_PRICE.toLocaleString("en-IN")}. Your current order total is ₹${estimatedTotal.toLocaleString("en-IN")}. Please add more items to place your order.`,
        422,
        [`estimatedTotal must be at least ${MIN_ORDER_PRICE}`]
      );
    }

    const estimateNumber = generateEstimateNumber();

    const dbCustomer = CustomerRepo.create({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || null,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      pincode: customer.pincode,
    });

    const created = EstimateRepo.createWithItems({
      estimateNumber,
      customerId: dbCustomer.id,
      subtotal,
      totalDiscount,
      estimatedTotal,
      customerNotes: customer.notes || null,
      items: preparedItems,
    });

    // Respond to the customer immediately: the estimate is already safely
    // committed to the database at this point, so there is nothing left
    // that should make them wait. Sending the admin notification email is
    // a side effect for the business, not something the customer's
    // request should be held hostage to (SMTP round-trips can easily take
    // several seconds, especially over Gmail SMTP).
    ok(res, created, "Estimate submitted successfully", 201);

    // Fire-and-forget: send the admin email notification in the
    // background, after the response has already been sent. Failures are
    // logged only — they must never affect the customer-facing request,
    // which has already completed successfully by this point.
    (async () => {
      const maxRetries = 3;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await sendNewEstimateAdminEmail(created);
          break; // Success, exit retry loop
        } catch (emailErr) {
          if (attempt === maxRetries) {
            console.error(
              `[Email Service] Failed to send admin notification email for ${created.estimateNumber} after ${maxRetries} attempts:`,
              emailErr.message || emailErr
            );
          } else {
            console.warn(
              `[Email Service] Attempt ${attempt} failed to send admin notification email for ${created.estimateNumber}. Retrying in 2 seconds...`,
              emailErr.message || emailErr
            );
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }
      }
    })();
  } catch (e) {
    next(e);
  }
});

router.get("/estimates/:estimateNumber", (req, res, next) => {
  try {
    const estimate = EstimateRepo.findByNumber(req.params.estimateNumber);
    if (!estimate) return fail(res, "Estimate not found", 404);
    // Do not return full customer PII on public lookup
    ok(res, {
      estimateNumber: estimate.estimateNumber,
      status: estimate.status,
      subtotal: estimate.subtotal,
      totalDiscount: estimate.totalDiscount,
      estimatedTotal: estimate.estimatedTotal,
      items: estimate.items,
      createdAt: estimate.createdAt,
    });
  } catch (e) {
    next(e);
  }
});

export default router;