import { listAllWithCategory, listByCategoryId, createSubcategory as createSub, findSubcategoryById, updateSubcategoryFields, deleteSubcategoryById, listSubcategoriesWithFilter } from "../models/subcategoryModel.js";
import { findCategoryById } from "../models/categoriesModel.js";

export async function listSubcategories(req, res) {
  try {
    const { category_id, name, page = 1, limit = 10 } = req.query || {};
    const catId = category_id ? Number(category_id) : null;
    const pg = Number(page) || 1;
    const lm = Number(limit) || 10;

    if (catId && !Number.isInteger(catId)) {
      return res.status(400).json({ message: "category_id must be an integer" });
    }
    if (pg < 1 || lm < 1) {
      return res.status(400).json({ message: "page and limit must be positive integers" });
    }

    const { items, total } = await listSubcategoriesWithFilter({ categoryId: catId, name: name?.trim(), page: pg, limit: lm });
    res.json({ items, total, page: pg, limit: lm });
  } catch (err) {
    console.error("listSubcategories error:", err);
    res.status(500).json({ message: "Failed to load sub-categories", error: err.message });
  }
}

export async function createSubcategory(req, res) {
  try {
    const { category_id, name } = req.body || {};

    const catId = Number(category_id);
    if (!Number.isInteger(catId) || !name || !String(name).trim()) {
      return res.status(400).json({ message: "category_id (int) and name are required" });
    }

    // Ensure category exists
    const cat = await findCategoryById(catId);
    if (!cat) {
      return res.status(400).json({ message: "Category not found" });
    }

    const id = await createSub(catId, String(name).trim());

    res.status(201).json({ message: "Sub-Category created", item: { id, category_id: catId, name: String(name).trim() } });
  } catch (err) {
    console.error("createSubcategory error:", err);
    res.status(500).json({ message: "Failed to create sub-category", error: err.message });
  }
}

export async function updateSubcategory(req, res) {
  try {
    const { id } = req.params || {};
    const { category_id, name } = req.body || {};

    const subId = Number(id);
    if (!Number.isInteger(subId)) {
      return res.status(400).json({ message: "id must be an integer" });
    }

    // Check exists
    const existing = await findSubcategoryById(subId);
    if (!existing) {
      return res.status(404).json({ message: "Sub-Category not found" });
    }

    const updates = [];
    const params = [];

    if (category_id !== undefined) {
      const catId = Number(category_id);
      if (!Number.isInteger(catId)) {
        return res.status(400).json({ message: "category_id must be an integer" });
      }
      // Ensure category exists
      const cat = await findCategoryById(catId);
      if (!cat) {
        return res.status(400).json({ message: "Category not found" });
      }
      updates.push("category_id = ?");
      params.push(catId);
    }

    if (name !== undefined) {
      const nm = String(name).trim();
      if (!nm) {
        return res.status(400).json({ message: "name cannot be empty" });
      }
      updates.push("name = ?");
      params.push(nm);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    params.push(subId);

    await updateSubcategoryFields(subId, Object.fromEntries(updates.map((u, i) => [u.split(" = ")[0], params[i]])));

    res.json({ message: "Sub-Category updated" });
  } catch (err) {
    console.error("updateSubcategory error:", err);
    res.status(500).json({ message: "Failed to update sub-category", error: err.message });
  }
}

export async function deleteSubcategory(req, res) {
  try {
    const { id } = req.params || {};
    const subId = Number(id);
    if (!Number.isInteger(subId)) {
      return res.status(400).json({ message: "id must be an integer" });
    }

    const affected = await deleteSubcategoryById(subId);
    if (affected === 0) {
      return res.status(404).json({ message: "Sub-Category not found" });
    }

    res.json({ message: "Sub-Category deleted" });
  } catch (err) {
    console.error("deleteSubcategory error:", err);
    res.status(500).json({ message: "Failed to delete sub-category", error: err.message });
  }
}
