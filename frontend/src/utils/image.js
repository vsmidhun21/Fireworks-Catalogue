import { API_BASE_URL } from "../services/api";

export const DEFAULT_PRODUCT_IMAGE = "/images/default_product.png";

/**
 * Returns the product image URL or fallback to default image
 */
export function getProductImageUrl(url) {
  if (!url || typeof url !== "string" || !url.trim()) {
    return DEFAULT_PRODUCT_IMAGE;
  }
  if (url.startsWith("/uploads/")) {
    return `${API_BASE_URL}${url}`;
  }
  return url;
}

/**
 * Fallback handler for img onError event
 */
export function onImageError(e) {
  if (e.target && e.target.src !== window.location.origin + DEFAULT_PRODUCT_IMAGE) {
    e.target.src = DEFAULT_PRODUCT_IMAGE;
  }
}
