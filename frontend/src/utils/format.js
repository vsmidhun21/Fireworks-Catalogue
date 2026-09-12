export function formatCurrency(amount) {
  if (amount == null) return "";
  return `₹${Number(amount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function discountPercent(original, discounted) {
  if (!discounted || discounted >= original) return 0;
  return Math.round(((original - discounted) / original) * 100);
}

/**
 * Computes the effective (post-discount) unit price for a product the same
 * way the rest of the app does: use the admin-set discountedPrice when
 * present, otherwise fall back to the default 90%-off pricing model.
 */
export function effectivePrice(product) {
  if (!product) return 0;
  return product.discountedPrice != null ? product.discountedPrice : Math.round(product.originalPrice * 0.10);
}

/**
 * Summarizes the discount actually present across a list of products, so
 * UI copy never has to hardcode a number that could go stale the moment an
 * admin sets a custom (non-default) discountedPrice on any product.
 *
 * Returns:
 *  - pct: the highest discount % found (use for "Up to X%"/"Flat X%" copy)
 *  - uniform: true if every product shares the same discount %, so the
 *    banner can say "Flat X%" instead of "Up to X%"
 */
export function catalogueDiscountSummary(products) {
  const list = Array.isArray(products) ? products : [];
  const pcts = list
    .map((p) => discountPercent(p.originalPrice, effectivePrice(p)))
    .filter((pct) => pct > 0);

  if (pcts.length === 0) {
    // No product data yet (e.g. page still loading) — fall back to the
    // site-wide default discount model rather than showing "0%".
    return { pct: 90, uniform: true };
  }

  const min = Math.min(...pcts);
  const max = Math.max(...pcts);
  return { pct: max, uniform: min === max };
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
