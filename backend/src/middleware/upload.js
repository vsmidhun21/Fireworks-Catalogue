import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function createImageUploader({ folder, filePrefix }) {
  const uploadDir = path.join(__dirname, `../../uploads/${folder}`);
  ensureDir(uploadDir);

  return multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => {
        cb(null, uploadDir);
      },
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const cleanBase = path
          .basename(file.originalname, ext)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .slice(0, 30);
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
        cb(null, `${filePrefix}-${cleanBase || "img"}-${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });
}

const fileFilter = (_req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPEG, PNG, WebP, GIF, SVG) are allowed!"), false);
  }
};

export const uploadProductImage = createImageUploader({ folder: "products", filePrefix: "product" });
export const uploadPromotionImage = createImageUploader({ folder: "promotions", filePrefix: "promotion" });
export const uploadBrandingImage = createImageUploader({ folder: "branding", filePrefix: "brand" });
export const uploadGiftBoxImage = createImageUploader({ folder: "gift-boxes", filePrefix: "giftbox" });
export const uploadCategoryImage = createImageUploader({ folder: "categories", filePrefix: "category" });

// Root directory all upload subfolders (products/, categories/, gift-boxes/,
// promotions/, branding/) live under. Used to safely resolve a stored
// relative URL back to a file on disk for cleanup.
const uploadsRoot = path.join(__dirname, "../../uploads");

/**
 * Deletes a previously uploaded image from disk, given its stored relative
 * URL (e.g. "/uploads/products/product-abc-123.jpg").
 *
 * This is a best-effort cleanup step, not part of the request's success
 * criteria — a failed/missing delete must never fail the API response that
 * triggered it, so all errors are logged and swallowed.
 *
 * No-ops safely for:
 *  - falsy/missing values
 *  - anything that isn't a local "/uploads/..." path (e.g. a legacy
 *    absolute URL from before this was fixed, or an external image link)
 *  - paths that would resolve outside the uploads directory (defensive
 *    guard against path traversal via a crafted imageUrl)
 *  - files that no longer exist on disk
 */
export function deleteUploadedFile(relativeUrl) {
  if (!relativeUrl || typeof relativeUrl !== "string") return;
  if (!relativeUrl.startsWith("/uploads/")) return;

  const relativePath = relativeUrl.slice("/uploads/".length);
  const absolutePath = path.join(uploadsRoot, relativePath);

  // Defensive guard: resolved path must stay inside the uploads root.
  const normalizedRoot = path.normalize(uploadsRoot + path.sep);
  const normalizedTarget = path.normalize(absolutePath);
  if (!normalizedTarget.startsWith(normalizedRoot)) {
    console.warn(`[Upload Cleanup] Refused to delete path outside uploads directory: ${relativeUrl}`);
    return;
  }

  fs.unlink(normalizedTarget, (err) => {
    if (err && err.code !== "ENOENT") {
      console.warn(`[Upload Cleanup] Failed to delete old image ${relativeUrl}:`, err.message);
    }
  });
}

/**
 * Deletes the old image only when it is actually being replaced or removed
 * (i.e. the new value differs from the old one), so a file still in active
 * use is never deleted — e.g. a PUT request that left the image untouched,
 * or a create where there was no previous image.
 */
export function cleanupReplacedImage(oldUrl, newUrl) {
  if (!oldUrl || oldUrl === newUrl) return;
  deleteUploadedFile(oldUrl);
}
