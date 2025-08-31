import jwt from "jsonwebtoken";
import { UserAuthModel } from "../models/UserAuthModel.js";
import PermissionModel from '../models/PermissionModel.js';

const {
  JWT_SECRET = "your-secret-key",
  JWT_EXPIRES_IN = "7d"
} = process.env;

// Register a new user
export async function register(req, res) {
  try {
    const { name, phone, password } = req.body;

    // Validate required fields
    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, and password are required"
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    // Check registration permissions
    const permissions = await PermissionModel.getPermissions();
    if (!permissions || permissions.is_register === 0) {
      return res.status(403).json({
        success: false,
        message: "Ro`yxattan o`tishga ruxsat berilmagan"
      });
    }

    // Check if user already exists
    const existingUser = await UserAuthModel.findUserByPhone(phone);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Phone number already exists"
      });
    }

    // Create new user (is_wholesaler defaults to false as requested)
    const userId = await UserAuthModel.createUser({
      name: name.trim(),
      phone: phone.trim(),
      password,
      is_wholesaler: false
    });

    // Get the created user (without password)
    const newUser = await UserAuthModel.findUserById(userId);

    // Generate JWT token
    const payload = {
      id: newUser.id,
      phone: newUser.phone,
      name: newUser.name,
      is_wholesaler: newUser.is_wholesaler
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: newUser.id,
          name: newUser.name,
          phone: newUser.phone,
          is_wholesaler: newUser.is_wholesaler,
          created_at: newUser.created_at
        },
        token
      }
    });

  } catch (error) {
    console.error("Registration error:", error);

    if (error.message === "Phone number already exists") {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

// Login user
export async function login(req, res) {
  try {
    const { phone, password } = req.body;

    // Validate required fields
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone and password are required"
      });
    }

    // Find user by phone
    const user = await UserAuthModel.findUserByPhone(phone);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone number or password"
      });
    }

    // Verify password
    const isPasswordValid = await UserAuthModel.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone number or password"
      });
    }

    // Generate JWT token
    const payload = {
      id: user.id,
      phone: user.phone,
      name: user.name,
      is_wholesaler: user.is_wholesaler
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          is_wholesaler: user.is_wholesaler,
          created_at: user.created_at
        },
        token
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

// Get current user profile (requires authentication)
export async function getProfile(req, res) {
  try {
    const userId = req.user.id;

    const user = await UserAuthModel.findUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          is_wholesaler: user.is_wholesaler,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      }
    });

  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

// Verify token (middleware helper)
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}