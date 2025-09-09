import {
  listCategoriesOrdered,
  createCategory as createCat,
  getCategoryById,
  updateCategoryFields,
  deleteCategoryById,
} from "../models/categoriesModel.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.resolve(__dirname, "../../public/uploads/categories");


async function ensureUploadsDir() {
  await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
}

export async function listCategories(req, res) {
  try {
    await ensureUploadsDir();
    const rows = await listCategoriesOrdered();
    res.json({ items: rows });
  } catch (err) {
    console.error("listCategories error:", err);
    res.status(500).json({ message: "Failed to load categories", error: err.message });
  }
}

export async function createCategory(req, res) {
  try {
    await ensureUploadsDir();
    const { category_name } = req.body || {};

    if (!category_name) {
      return res.status(400).json({ message: "category_name is required" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "image file is required" });
    }

    const filename = req.file.filename;
    const publicPath = `/public/uploads/categories/${filename}`;
    const id = await createCat(publicPath, category_name);

    res.status(201).json({ message: "Category created", item: { id, image_path: publicPath, category_name } });
  } catch (err) {
    console.error("createCategory error:", err);
    res.status(500).json({ message: "Failed to create category", error: err.message });
  }
}

export async function updateCategory(req, res) {
  try {
    await ensureUploadsDir();
    const { id } = req.params || {};
    const { category_name } = req.body || {};

    const catId = Number(id);
    if (!Number.isInteger(catId)) {
      return res.status(400).json({ message: "id must be an integer" });
    }

    const existing = await getCategoryById(catId);
    if (!existing) {
      return res.status(404).json({ message: "Category not found" });
    }

    let newImagePath = existing.image_path;

    if (req.file) {
      const filename = req.file.filename;
      // Remove old image if exists
      try {
        if (newImagePath?.startsWith("/public/uploads/categories/")) {
          const oldName = path.basename(newImagePath);
          const oldFsPath = path.join(UPLOAD_DIR, oldName);
          await fs.promises.unlink(oldFsPath).catch(() => {});
        }
      } catch {}
      newImagePath = `/public/uploads/categories/${filename}`;
    }

    const fields = [];
    const params = [];

    if (category_name !== undefined) {
      const nm = String(category_name).trim();
      if (!nm) return res.status(400).json({ message: "category_name cannot be empty" });
      fields.push("category_name = ?");
      params.push(nm);
    }

    if (newImagePath !== existing.image_path) {
      fields.push("image_path = ?");
      params.push(newImagePath);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    await updateCategoryFields(catId, Object.fromEntries(fields.map((f, i) => [f.split(" = ")[0], params[i]])));

    res.json({ message: "Category updated" });
  } catch (err) {
    console.error("updateCategory error:", err);
    res.status(500).json({ message: "Failed to update category", error: err.message });
  }
}

export async function deleteCategory(req, res) {
  try {
    await ensureUploadsDir();
    const { id } = req.params || {};
    const catId = Number(id);
    if (!Number.isInteger(catId)) {
      return res.status(400).json({ message: "id must be an integer" });
    }

    const existing = await getCategoryById(catId);
    if (!existing) {
      return res.status(404).json({ message: "Category not found" });
    }

    const imagePath = existing.image_path;

    const affected = await deleteCategoryById(catId);
    if (affected === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Best-effort remove file
    try {
      if (imagePath?.startsWith("/public/uploads/categories/")) {
        const name = path.basename(imagePath);
        const fsPath = path.join(UPLOAD_DIR, name);
        await fs.promises.unlink(fsPath).catch(() => {});
      }
    } catch {}

    res.json({ message: "Category deleted" });
  } catch (err) {
    console.error("deleteCategory error:", err);
    res.status(500).json({ message: "Failed to delete category", error: err.message });
  }
}

