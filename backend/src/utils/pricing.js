// Single source of truth (backend) for the global discount percentage and
// the discounted-price calculation. The percentage itself lives in the
// existing `website_settings` table under GLOBAL_DISCOUNT_SETTING_KEY.
export const GLOBAL_DISCOUNT_SETTING_KEY = "global_discount_percent";
export const DEFAULT_GLOBAL_DISCOUNT_PERCENT = 90;

/**
 * Validates a discount percentage. Accepts a number or numeric string between
 * 0 and 100 (inclusive) with at most 2 decimal places.
 * Returns the normalized number, or null when invalid.
 */
export function parseDiscountPercent(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  if (typeof value !== "number" && typeof value !== "string") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  const rounded = Math.round(n * 100) / 100;
  if (Math.abs(rounded - n) > 1e-9) return null; // more than 2 decimals
  return rounded;
}

/**
 * discounted price = original price × (1 − pct / 100), rounded to whole rupees
 * (the existing app-wide convention). Uses integer basis-point arithmetic so
 * values like 12.5 round consistently (to 13) instead of drifting on float error.
 */
export function calcDiscountedPrice(originalPrice, discountPercent) {
  const original = Number(originalPrice);
  if (!Number.isFinite(original)) return 0;
  const pct = parseDiscountPercent(discountPercent);
  const effectivePct = pct == null ? DEFAULT_GLOBAL_DISCOUNT_PERCENT : pct;
  const keepBasisPoints = Math.round((100 - effectivePct) * 100);
  return Math.round((original * keepBasisPoints) / 10000);
}

/**
 * Effective discount % of an existing estimate, derived from its stored totals
 * (used only for display; never used to recalculate stored prices).
 */
export function blendedDiscountPercent(subtotal, totalDiscount) {
  const sub = Number(subtotal);
  const disc = Number(totalDiscount);
  if (!(sub > 0) || !(disc > 0)) return 0;
  return Math.round((disc / sub) * 100);
}
