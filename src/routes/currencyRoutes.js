import { Router } from "express";
import { getRate, setRate } from "../controllers/currencyController.js";
import { requireAuth } from "../middleware/auth.js";

export const router = Router();

// Public get for user-data consumption if needed by admin frontend as well
router.get("/", getRate);

// Admin protected set rate
router.put("/", requireAuth, setRate);


