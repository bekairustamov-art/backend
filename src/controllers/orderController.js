import { OrderModel } from "../models/order.js";
import PermissionModel from '../models/PermissionModel.js';

// Create new orders (batch)
export async function createOrders(req, res) {
  try {
    const userId = req.user.id; // From authenticateToken middleware

    // Check order permissions
    const permissions = await PermissionModel.getPermissions();
    if (!permissions) {
      return res.status(500).json({
        success: false,
        message: "Unable to verify permissions"
      });
    }

    if (req.user.is_wholesaler) {
      if (permissions.is_wholesaler_order === 0) {
        return res.status(403).json({
          success: false,
          message: "Buyurtma yuborishga ruxsat berilmagan"
        });
      }
    } else {
      if (permissions.is_usual_order === 0) {
        return res.status(403).json({
          success: false,
          message: "Buyurtma yuborishga ruxsat berilmagan"
        });
      }
    }

    const orderItems = req.body.orders;

    // Validate input
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Orders must be a non-empty array"
      });
    }

    // Add user_id to each order item
    const ordersWithUserId = orderItems.map(item => ({
      user_id: userId,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price
    }));

    // Create orders in database
    const createdOrders = await OrderModel.createOrders(ordersWithUserId);

    return res.status(201).json({
      success: true,
      message: "Orders created successfully",
      data: {
        orders: createdOrders,
        batch_id: createdOrders[0]?.batch_id
      }
    });

  } catch (error) {
    console.error("Create orders error:", error);

    if (error.message.includes("required")) {
      return res.status(400).json({
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

// Get all orders (admin only) with filtering and pagination
export async function getAllOrders(req, res) {
  try {
    const {
      page = 1,
      limit = 10,
      user_id,
      start_date,
      end_date,
      wholesaler_only,
      export: exportAll
    } = req.query;

    // Validate pagination parameters
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination parameters"
      });
    }

    const filters = {
      page: pageNum,
      limit: limitNum
    };

    if (user_id) {
      filters.user_id = parseInt(user_id);
    }

    if (wholesaler_only) {
      filters.wholesaler_only = wholesaler_only === 'true';
    }

    if (start_date) {
      filters.start_date = start_date;
    }

    if (end_date) {
      filters.end_date = end_date;
    }

    if (exportAll && (exportAll === 'true' || exportAll === true)) {
      filters.export_all = true;
    }

    const result = await OrderModel.getAllOrders(filters);

    return res.json({
      success: true,
      data: {
        orders: result.orders,
        pagination: result.pagination
      }
    });

  } catch (error) {
    console.error("Get all orders error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

// Get order history for the authenticated user
export async function getOrderHistory(req, res) {
  try {
    const userId = req.params.user_id;

    // Validate user_id parameter
    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required"
      });
    }

    // Ensure the authenticated user can only access their own order history
    if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: "You can only access your own order history"
      });
    }

    const result = await OrderModel.getOrderHistory(parseInt(userId));

    return res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("Get order history error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}