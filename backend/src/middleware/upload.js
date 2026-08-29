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
