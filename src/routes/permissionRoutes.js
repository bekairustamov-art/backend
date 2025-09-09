import { Router } from "express";
import * as controller from "../controllers/PermissionController.js";

const router = Router();

// Get current permissions
router.get("/", controller.getPermissions);

// Update permissions
router.put("/", controller.updatePermissions);

export const permissionRouter = router;