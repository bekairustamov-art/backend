import { Router } from "express";
import {
  getUserData,
  getCategories,
  getProducts,
  getPopularProducts,
  getBanners,
  getInfo,
  getSubcategories,
  getProductsByCategory,
  getProductsBySubcategory,
  getProductDetail,
  getSearchProducts
} from "../controllers/userDataController.js";
import { optionalAuthenticateToken } from "../middleware/userAuth.js";
import { getRate } from "../controllers/currencyController.js";

export const router = Router();

// Public user-facing routes (no admin middleware required)
// These routes are for users to consume data, not for admin management

// Get all user data
router.get("/", getUserData);

// Get categories for users
router.get("/categories", getCategories);
// Get product detail
router.get("/product-detail/:productid", optionalAuthenticateToken, getProductDetail)
// Get products for users
router.get("/products", optionalAuthenticateToken, getProducts);
// Get popular products
router.get("/popular-products", optionalAuthenticateToken, getPopularProducts);
// Get products by category
router.get("/products/:category_id", optionalAuthenticateToken, getProductsByCategory);
// Get products by subcategory
router.get("/subcategory/:subcategory_id", optionalAuthenticateToken, getProductsBySubcategory);
// Get banners for users
router.get("/banners", getBanners);

// Get info for users
router.get("/info", getInfo);

// Get currency rate for users
router.get("/currency", getRate);

// Get subcategories for users
router.get("/subcategories", getSubcategories);

// Search products (server-side search)
router.get("/search", optionalAuthenticateToken, getSearchProducts);
