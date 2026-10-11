export function formatCurrency(amount) {
  if (amount == null) return "";
  return `₹${Number(amount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function discountPercent(original, discounted) {
  if (!discounted || discounted >= original) return 0;
  return Math.round(((original - discounted) / original) * 100);
}

// Fallback only: the real value is the admin-configured `global_discount_percent`
// setting served by the backend. Mirrors the backend default so the UI is
// sensible before settings load. Also used as the frozen legacy rate for old
// estimate items that have no stored discounted price.
export const DEFAULT_GLOBAL_DISCOUNT_PERCENT = 90;

/** Reads the global discount % from the settings object (number, 0-100). */
export function globalDiscountPercent(settings) {
  const raw = settings?.global_discount_percent;
  const n = raw === "" || raw == null ? NaN : Number(raw);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : DEFAULT_GLOBAL_DISCOUNT_PERCENT;
}

/**
 * discounted price = original × (1 − pct/100), whole-rupee rounding. Integer
 * basis-point math (identical to the backend) avoids float drift on .5 values.
 */
export function calcDiscountedPrice(originalPrice, pct) {
  const original = Number(originalPrice);
  if (!Number.isFinite(original)) return 0;
  const keepBasisPoints = Math.round((100 - globalDiscountPercent({ global_discount_percent: pct })) * 100);
  return Math.round((original * keepBasisPoints) / 10000);
}

/** Formats a percentage without trailing zeros, e.g. 90 -> "90", 87.5 -> "87.5". */
export function formatPercent(pct) {
  return String(Math.round(Number(pct) * 100) / 100);
}

/**
 * Effective (post-discount) unit price for a product. The backend always sends
 * `discountedPrice` derived from the global discount; the calculation is only a
 * defensive fallback when that field is missing.
 */
export function effectivePrice(product, pct) {
  if (!product) return 0;
  return product.discountedPrice != null ? product.discountedPrice : calcDiscountedPrice(product.originalPrice, pct);
}

/**
 * Unit price of a stored estimate item. Historical prices are never recalculated;
 * only legacy rows with no stored discounted price fall back to the legacy rate.
 */
export function historicalUnitPrice(item) {
  if (item?.discountedUnitPrice != null) return item.discountedUnitPrice;
  return calcDiscountedPrice(item?.originalUnitPrice, DEFAULT_GLOBAL_DISCOUNT_PERCENT);
}

/**
 * Discount summary for catalogue banners. The discount is global and uniform,
 * so this simply reports the configured percentage.
 */
export function catalogueDiscountSummary(products, pct) {
  return { pct: globalDiscountPercent({ global_discount_percent: pct }), uniform: true };
}

/**
 * Computes a blended discount percentage for an estimate/cart total, e.g.
 * for a header ribbon summarizing the whole cart rather than one item.
 */
export function totalsDiscountPercent(subtotal, discount) {
  if (!subtotal || subtotal <= 0 || !discount || discount <= 0) return 0;
  return Math.round((discount / subtotal) * 100);
}

export function whatsappLink(number, message = "") {
  const clean = (number || "").replace(/[^0-9]/g, "");
  const text = encodeURIComponent(message);
  return `https://wa.me/${clean}${text ? `?text=${text}` : ""}`;
}

/**
 * Discount % to display for a stored estimate: the percentage saved on the estimate
 * itself (manual estimates), else the blended % derived from its frozen totals
 * (legacy / customer-submitted). Never the current global setting.
 */
export function estimateDiscountPercent(estimate) {
  if (estimate?.discountPercent != null) return Number(estimate.discountPercent);
  return totalsDiscountPercent(estimate?.subtotal, estimate?.totalDiscount);
}
