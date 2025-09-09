import { Router } from "express";
import {
  listAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProduct
} from "../controllers/productController.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create different upload directories
const thumbDir = path.resolve(__dirname, "../../public/thumb");
const detailDir = path.resolve(__dirname, "../../public/products");

// Ensure directories exist
fs.mkdirSync(thumbDir, { recursive: true });
fs.mkdirSync(detailDir, { recursive: true });

// Storage configuration for thumb images
const thumbStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, thumbDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".webp";
    const name = `thumb_${Date.now()}${ext}`;
    cb(null, name);
  },
});

// Storage configuration for detail images
const detailStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, detailDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".webp";
    const name = `detail_${Date.now()}${ext}`;
    cb(null, name);
  },
});

// Create multer instances for each storage type
const uploadThumb = multer({
  storage: thumbStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

const uploadDetail = multer({
  storage: detailStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

// Storage configuration that dynamically chooses destination based on field name
const dynamicStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'thumbnail_image') {
      cb(null, thumbDir);
    } else if (file.fieldname === 'detail_image') {
      cb(null, detailDir);
    } else {
      cb(new Error('Invalid field name'), null);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".webp";
    const timestamp = Date.now();

    if (file.fieldname === 'thumbnail_image') {
      cb(null, `thumb_${timestamp}${ext}`);
    } else if (file.fieldname === 'detail_image') {
      cb(null, `detail_${timestamp}${ext}`);
    } else {
      cb(new Error('Invalid field name'), null);
    }
  },
});

const upload = multer({
  storage: dynamicStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

router.get("/", listAllProducts);
router.get("/:id", getProduct);
router.post("/", upload.fields([
  { name: 'thumbnail_image', maxCount: 1 },
  { name: 'detail_image', maxCount: 1 }
]), createProduct);
router.put("/:id", upload.fields([
  { name: 'thumbnail_image', maxCount: 1 },
  { name: 'detail_image', maxCount: 1 }
]), updateProduct);
router.delete("/:id", deleteProduct);
