import jwt from "jsonwebtoken";
import { verifyToken } from "../controllers/userAuthController.js";

// Authentication middleware for user routes
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token is required"
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token"
    });
  }

  req.user = decoded;
  next();
}

// Optional authentication middleware for public endpoints
// This middleware checks for authentication but doesn't require it
export function optionalAuthenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    // No token provided - user is not authenticated
    req.user = null;
    return next();
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    // Invalid token - treat as not authenticated
    req.user = null;
    return next();
  }

  req.user = decoded;
  next();
}
