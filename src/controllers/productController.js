import {
  listProducts,
  createProduct as createProd,
  getProductById,
  updateProductFields,
  deleteProductById,
  findProductById,
  listProductsWithFilter,
} from "../models/productModel.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { sendPushToTopic } from "../services/pushService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR_THUMB = path.resolve(__dirname, "../../public/thumb");
const UPLOAD_DIR_DETAIL = path.resolve(__dirname, "../../public/products");

async function ensureUploadsDir() {
  await fs.promises.mkdir(UPLOAD_DIR_THUMB, { recursive: true });
  await fs.promises.mkdir(UPLOAD_DIR_DETAIL, { recursive: true });
}

export async function listAllProducts(req, res) {
  try {
    await ensureUploadsDir();
    const { category_id, sub_category_id, name, is_popular, page = 1, limit = 10 } = req.query || {};
    const catId = category_id ? Number(category_id) : null;
    const subCatId = sub_category_id ? Number(sub_category_id) : null;
    const pg = Number(page) || 1;
    const lm = Number(limit) || 10;
    const isPop = is_popular !== undefined ? Boolean(is_popular === 'true') : undefined;

    if (catId && !Number.isInteger(catId)) {
      return res.status(400).json({ message: "category_id must be an integer" });
    }
    if (subCatId && !Number.isInteger(subCatId)) {
      return res.status(400).json({ message: "sub_category_id must be an integer" });
    }
    if (pg < 1 || lm < 1) {
      return res.status(400).json({ message: "page and limit must be positive integers" });
    }

    const { items, total } = await listProductsWithFilter({ categoryId: catId, subCategoryId: subCatId, name: name?.trim(), isPopular: isPop, page: pg, limit: lm });
    res.json({ items, total, page: pg, limit: lm });
  } catch (err) {
    console.error("listProducts error:", err);
    res.status(500).json({ message: "Failed to load products", error: err.message });
  }
}

export async function createProduct(req, res) {
  try {
    await ensureUploadsDir();
    const {
      name,
      description,
      category_id,
      sub_category_id,
      first_price,
      discount1_price,
      second_price,
      discount2_price,
      ispopular = false,
      is_available = false
    } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Product name is required" });
    }
    if (!category_id) {
      return res.status(400).json({ message: "Category is required" });
    }
    if (!sub_category_id) {
      return res.status(400).json({ message: "Sub-category is required" });
    }
    if (first_price === undefined || first_price === null || String(first_price).trim() === "") {
      return res.status(400).json({ message: "First price is required" });
    }
    if (second_price === undefined || second_price === null || String(second_price).trim() === "") {
      return res.status(400).json({ message: "Second price is required" });
    }
    if (!req.files || !req.files.thumbnail_image || !req.files.detail_image) {
      return res.status(400).json({ message: "Both thumbnail and detail images are required" });
    }

    let thumbImagePath = null;
    let detailImagePath = null;

    // Handle thumbnail image
    if (req.files && req.files.thumbnail_image && req.files.thumbnail_image[0]) {
      const thumbFilename = req.files.thumbnail_image[0].filename;
      thumbImagePath = `/public/thumb/${thumbFilename}`;
    }

    // Handle detail image
    if (req.files && req.files.detail_image && req.files.detail_image[0]) {
      const detailFilename = req.files.detail_image[0].filename;
      detailImagePath = `/public/products/${detailFilename}`;
    }

    const productData = {
      name: String(name).trim(),
      description: description ? String(description).trim() : null,
      category_id: Number(category_id),
      sub_category_id: Number(sub_category_id),
      first_price: String(first_price).trim(),
      discount1_price: discount1_price ? String(discount1_price).trim() : null,
      second_price: String(second_price).trim(),
      discount2_price: discount2_price ? String(discount2_price).trim() : null,
      thumb_image_path: thumbImagePath,
      detail_image_path: detailImagePath,
      ispopular: ispopular,
      is_available: Boolean(is_available)
    };

    const id = await createProd(productData);
    const product = await getProductById(id);

    // Fire-and-forget push notification
    try {
      const base = process.env. SERVER_URL
        || (req.headers["x-forwarded-proto"]
          ? `${req.headers["x-forwarded-proto"]}://${req.headers["x-forwarded-host"] || req.get('host')}`
          : `${req.protocol}://${req.get('host')}`);
      const imageUrl = product?.thumb_image_path ? `${base}${product.thumb_image_path}` : undefined;
      await sendPushToTopic({
        title: product?.name ? `${product.name}` : "Hilook electronics",
        body: product?.name ? ` Yangi mahsulot qo’shildi` : " ",
        data: { type: "product_created", productId: String(id) },
        image: imageUrl,
        topic: "all", 
      });
    } catch {}

    res.status(201).json({ message: "Product created", item: product });
  } catch (err) {
    console.error("createProduct error:", err);
    res.status(500).json({ message: "Failed to create product", error: err.message });
  }
}

export async function updateProduct(req, res) {
  try {
    await ensureUploadsDir();
    const { id } = req.params || {};
    const {
      name,
      description,
      category_id,
      sub_category_id,
      first_price,
      discount1_price,
      second_price,
      discount2_price,
      ispopular,
      is_available
    } = req.body || {};

    const prodId = Number(id);
    if (!Number.isInteger(prodId)) {
      return res.status(400).json({ message: "id must be an integer" });
    }

    const existing = await getProductById(prodId);
    if (!existing) {
      return res.status(404).json({ message: "Product not found" });
    }

    let newThumbImagePath = existing.thumb_image_path;
    let newDetailImagePath = existing.detail_image_path;

    if (req.files && req.files.thumbnail_image && req.files.thumbnail_image[0]) {
      const thumbFilename = req.files.thumbnail_image[0].filename;
      // Remove old thumbnail if exists
      try {
        if (newThumbImagePath?.startsWith("/public/thumb/")) {
          const oldName = path.basename(newThumbImagePath);
          const oldFsPath = path.join(UPLOAD_DIR_THUMB, oldName);
          await fs.promises.unlink(oldFsPath).catch(() => {});
        }
      } catch {}
      newThumbImagePath = `/public/thumb/${thumbFilename}`;
    }

    if (req.files && req.files.detail_image && req.files.detail_image[0]) {
      const detailFilename = req.files.detail_image[0].filename;
      // Remove old detail image if exists
      try {
        if (newDetailImagePath?.startsWith("/public/products/")) {
          const oldName = path.basename(newDetailImagePath);
          const oldFsPath = path.join(UPLOAD_DIR_DETAIL, oldName);
          await fs.promises.unlink(oldFsPath).catch(() => {});
        }
      } catch {}
      newDetailImagePath = `/public/products/${detailFilename}`;
    }

    const fields = {};

    if (name !== undefined && (!name || !name.trim())) {
      return res.status(400).json({ message: "Product name cannot be empty" });
    }
    if (category_id !== undefined && !category_id) {
      return res.status(400).json({ message: "Category cannot be empty" });
    }
    if (sub_category_id !== undefined && !sub_category_id) {
      return res.status(400).json({ message: "Sub-category cannot be empty" });
    }
    if (first_price !== undefined && String(first_price).trim() === "") {
      return res.status(400).json({ message: "First price cannot be empty" });
    }
    if (second_price !== undefined && String(second_price).trim() === "") {
      return res.status(400).json({ message: "Second price cannot be empty" });
    }

    if (name !== undefined) {
      fields.name = String(name).trim();
    }

    if (description !== undefined) {
      fields.description = description ? String(description).trim() : null;
    }

    if (category_id !== undefined) {
      fields.category_id = Number(category_id);
    }

    if (sub_category_id !== undefined) {
      fields.sub_category_id = Number(sub_category_id);
    }

    if (first_price !== undefined) {
      fields.first_price = String(first_price).trim();
    }

    if (discount1_price !== undefined) {
      fields.discount1_price = discount1_price ? String(discount1_price).trim() : null;
    }

    if (second_price !== undefined) {
      fields.second_price = String(second_price).trim();
    }

    if (discount2_price !== undefined) {
      fields.discount2_price = discount2_price ? String(discount2_price).trim() : null;
    }

    if (newThumbImagePath !== existing.thumb_image_path) {
      fields.thumb_image_path = newThumbImagePath;
    }

    if (newDetailImagePath !== existing.detail_image_path) {
      fields.detail_image_path = newDetailImagePath;
    }

    if (ispopular !== undefined) {
      fields.ispopular = Boolean(ispopular);
    }

    if (is_available !== undefined) {
      fields.is_available = Boolean(is_available);
    }

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    await updateProductFields(prodId, fields);
    const updatedProduct = await getProductById(prodId);

    res.json({ message: "Product updated", item: updatedProduct });
  } catch (err) {
    console.error("updateProduct error:", err);
    res.status(500).json({ message: "Failed to update product", error: err.message });
  }
}

export async function deleteProduct(req, res) {
  try {
    await ensureUploadsDir();
    const { id } = req.params || {};
    const prodId = Number(id);
    if (!Number.isInteger(prodId)) {
      return res.status(400).json({ message: "id must be an integer" });
    }

    const existing = await getProductById(prodId);
    if (!existing) {
      return res.status(404).json({ message: "Product not found" });
    }

    const thumbImagePath = existing.thumb_image_path;
    const detailImagePath = existing.detail_image_path;

    const affected = await deleteProductById(prodId);
    if (affected === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Best-effort remove thumbnail image
    try {
      if (thumbImagePath?.startsWith("/public/thumb/")) {
        const name = path.basename(thumbImagePath);
        const fsPath = path.join(UPLOAD_DIR_THUMB, name);
        await fs.promises.unlink(fsPath).catch(() => {});
      }
    } catch {}

    // Best-effort remove detail image
    try {
      if (detailImagePath?.startsWith("/public/products/")) {
        const name = path.basename(detailImagePath);
        const fsPath = path.join(UPLOAD_DIR_DETAIL, name);
        await fs.promises.unlink(fsPath).catch(() => {});
      }
    } catch {}

    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error("deleteProduct error:", err);
    res.status(500).json({ message: "Failed to delete product", error: err.message });
  }
}

export async function getProduct(req, res) {
  try {
    await ensureUploadsDir();
    const { id } = req.params || {};
    const prodId = Number(id);
    if (!Number.isInteger(prodId)) {
      return res.status(400).json({ message: "id must be an integer" });
    }

    const product = await getProductById(prodId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ item: product });
  } catch (err) {
    console.error("getProduct error:", err);
    res.status(500).json({ message: "Failed to get product", error: err.message });
  }
}
