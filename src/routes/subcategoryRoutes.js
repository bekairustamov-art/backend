import { Router } from "express";
import { listSubcategories, createSubcategory, updateSubcategory, deleteSubcategory } from "../controllers/subcategoryController.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "../../public/uploads/subcategory");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    // Store as .webp regardless of original extension
    const name = `${Date.now()}.webp`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

router.get("/", listSubcategories);
router.post("/", upload.single("image"), createSubcategory);
router.put("/:id", upload.single("image"), updateSubcategory);
router.delete("/:id", deleteSubcategory);
