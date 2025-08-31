import { Router } from "express";
import { listSubcategories, createSubcategory, updateSubcategory, deleteSubcategory } from "../controllers/subcategoryController.js";

export const router = Router();

router.get("/", listSubcategories);
router.post("/", createSubcategory);
router.put("/:id", updateSubcategory);
router.delete("/:id", deleteSubcategory);
