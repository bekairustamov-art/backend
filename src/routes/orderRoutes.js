import { Router } from "express";
import {
  createOrders,
  getAllOrders,
  getOrderHistory
} from "../controllers/orderController.js";
import { authenticateToken } from "../middleware/userAuth.js";

export const router = Router();

// User routes (require authentication)
router.post("/", authenticateToken, createOrders); // Create new orders
router.get("/order-history/:user_id", authenticateToken, getOrderHistory);
// Admin routes (require admin authentication)
// Note: You may need to add admin middleware here
router.get("/admin/all", authenticateToken, getAllOrders); // Get all orders (admin)