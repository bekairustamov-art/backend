import { Router } from "express";
import { login, updateAdminCredentials } from "../controllers/authController.js";

export const router = Router();

router.post("/admin-login", login);
router.put("/admin-update", updateAdminCredentials);
