import { getPool } from "../config/db.js";
import { getInfo as getInfoData } from "../models/infoModel.js";
import { getCurrency } from "../models/currencyModel.js";

// Helper function to remove timestamp fields from arrays of objects
const removeTimestamps = (items) => {
  if (!Array.isArray(items)) return items;
  return items.map(item => {
    const { created_at, updated_at, ...rest } = item;
    return rest;
  });
};

// Helper function to build full image URL with version parameter
const buildImageUrl = (imagePath, updatedAt) => {
  const baseUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 4000}`;
  const timestamp = new Date(updatedAt).getTime();
  return `${baseUrl}${imagePath}?ver=${timestamp}`;
};

// User-facing data endpoints (no admin middleware)
export const getUserData = async (req, res) => {
  try {
    const currencyRow = await getCurrency().catch(() => ({ rate: 0 }));
    res.json({
      success: true,
      data: {
        categories: [],
        products: [],
        banners: [],
        info: {},
        currency: { rate: Number(currencyRow.rate) || 0 }
      },
      message: "User data endpoint"
    });
  } catch (error) {
    console.error("Error in getUserData:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

export const getCategories = async (req, res) => {
  try {
    const pool = await getPool();
    // Get categories from database
    const [categories] = await pool.query(
      "SELECT id, image_path, category_name, updated_at FROM categories ORDER BY id DESC"
    );

    // Format categories with ready-to-use image URLs
    const formattedCategories = categories.map(category => ({
      id: category.id,
      name: category.category_name,
      imageUrl: buildImageUrl(category.image_path, category.updated_at)
    }));

    res.json({
      success: true,
      data: formattedCategories,
      message: "Categories retrieved successfully"
    });
  } catch (error) {
    console.error("Error in getCategories:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

export const getProducts = async (req, res) => {
  try {
    const pool = await getPool();
    // Determine user type
    const isAuthenticated = req.user !== null;
    const isWholesaler = isAuthenticated && (req.user.is_wholesaler === true || req.user.is_wholesaler === 1);

    // Get pagination parameters
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    // Validate limit (prevent excessive data requests)
    const maxLimit = 100;
    const actualLimit = Math.min(limit, maxLimit);

    // Build query based on user type
    let query, priceFields;

    if (isWholesaler) {
      // Wholesale user - return second_price and discount2_price
      query = `
        SELECT
          id, name, description, category_id, sub_category_id,
          second_price as price, discount2_price as discount_price,
          thumb_image_path, detail_image_path, is_available, created_at, updated_at
        FROM products
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      priceFields = ['price', 'discount_price'];
    } else {
      // Regular user or not authenticated - return first_price and discount1_price
      query = `
        SELECT
          id, name, description, category_id, sub_category_id,
          first_price as price, discount1_price as discount_price,
          thumb_image_path, detail_image_path, is_available, created_at, updated_at
        FROM products
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      priceFields = ['price', 'discount_price'];
    }

    // Get products from database with pagination
    const [products] = await pool.query(query, [actualLimit, offset]);

    // Get total count for pagination metadata
    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM products');
    const totalProducts = countResult[0].total;
    const totalPages = Math.ceil(totalProducts / actualLimit);

    // Format products with ready-to-use image URLs
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price == null ? null : Number(product.price),
      discount_price: product.discount_price == null ? null : Number(product.discount_price),
      thumbImageUrl: product.thumb_image_path ? buildImageUrl(product.thumb_image_path, product.updated_at) : null,
      is_available: Boolean(product.is_available)
    }));

    res.json({
      success: true,
      data: formattedProducts,
      pagination: {
        current_page: page,
        per_page: actualLimit,
        total_pages: totalPages,
        total_products: totalProducts,
        has_next: page < totalPages,
        has_prev: page > 1
      },
      message: `Products retrieved successfully for ${isWholesaler ? 'wholesale' : 'regular'} user`,
      user_type: isWholesaler ? 'wholesale' : (isAuthenticated ? 'authenticated_regular' : 'guest')
    });
  } catch (error) {
    console.error("Error in getProducts:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

export const getBanners = async (req, res) => {
  try {
    const pool = await getPool();
    // Get banners from database
    const [banners] = await pool.query(
      "SELECT id, banner_image, priority, updated_at FROM banners ORDER BY priority ASC"
    );

    // Format banners with ready-to-use image URLs
    const formattedBanners = banners.map(banner => ({
      id: banner.id,
      priority: banner.priority,
      imageUrl: buildImageUrl(banner.banner_image, banner.updated_at)
    }));

    res.json({
      success: true,
      data: formattedBanners,
      message: "Banners retrieved successfully"
    });
  } catch (error) {
    console.error("Error in getBanners:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

export const getInfo = async (req, res) => {
  try {
    // Get combined info data (maps, phones, socials, description)
    const infoData = await getInfoData();
    const currencyRow = await getCurrency().catch(() => ({ rate: 0 }));

    // Remove timestamp fields from phones and maps arrays
    const cleanedData = {
      phones: removeTimestamps(infoData.phones),
      maps: removeTimestamps(infoData.maps),
      socials: infoData.socials,
      description: infoData.description
    };

    res.json({
      success: true,
      data: { ...cleanedData, currency: { rate: Number(currencyRow.rate) || 0 } },
      message: "Info data retrieved successfully"
    });
  } catch (error) {
    console.error("Error in getInfo:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

export const getPopularProducts = async (req, res) => {
  try {
    const pool = await getPool();
    // Log request headers and user for debugging
    console.log('=== Popular Products Request Debug ===');
    console.log('Request Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Request User:', JSON.stringify(req.user, null, 2));
    console.log('=====================================');

    // Determine user type
    const isAuthenticated = req.user !== null;
    const isWholesaler = isAuthenticated && (req.user.is_wholesaler === true || req.user.is_wholesaler === 1);

    // Get pagination parameters
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    // Validate limit (prevent excessive data requests)
    const maxLimit = 100;
    const actualLimit = Math.min(limit, maxLimit);

    // Build query based on user type - filter for popular products and sort by updated_at
    let query;

    if (isWholesaler) {
      // Wholesale user - return second_price and discount2_price
      query = `
        SELECT
          id, name, description, category_id, sub_category_id,
          second_price as price, discount2_price as discount_price,
          thumb_image_path, detail_image_path, is_available, created_at, updated_at
        FROM products
        WHERE ispopular = true
        ORDER BY updated_at DESC
        LIMIT ? OFFSET ?
      `;
    } else {
      // Regular user or not authenticated - return first_price and discount1_price
      query = `
        SELECT
          id, name, description, category_id, sub_category_id,
          first_price as price, discount1_price as discount_price,
          thumb_image_path, detail_image_path, is_available, created_at, updated_at
        FROM products
        WHERE ispopular = true
        ORDER BY updated_at DESC
        LIMIT ? OFFSET ?
      `;
    }
    
    // Get popular products from database with pagination
    const [products] = await pool.query(query, [actualLimit, offset]);

    // Get total count for pagination metadata
    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM products WHERE ispopular = true');
    const totalProducts = countResult[0].total;
    const totalPages = Math.ceil(totalProducts / actualLimit);

    // Format products with ready-to-use image URLs
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price == null ? null : Number(product.price),
      discount_price: product.discount_price == null ? null : Number(product.discount_price),
      thumbImageUrl: product.thumb_image_path ? buildImageUrl(product.thumb_image_path, product.updated_at) : null,
      is_available: Boolean(product.is_available)
    }));

    res.json({
      success: true,
      data: formattedProducts,
      pagination: {
        current_page: page,
        per_page: actualLimit,
        total_pages: totalPages,
        total_products: totalProducts,
        has_next: page < totalPages,
        has_prev: page > 1
      },
      message: `Popular products retrieved successfully for ${isWholesaler ? 'wholesale' : 'regular'} user`,
      user_type: isWholesaler ? 'wholesale' : (isAuthenticated ? 'authenticated_regular' : 'guest')
    });
  } catch (error) {
    console.error("Error in getPopularProducts:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

export const getProductDetail = async (req, res) => {
  try {
    const pool = await getPool();
    const { productid } = req.params;

    // Validate product ID
    if (!productid || isNaN(productid)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID provided"
      });
    }

    // Determine user type
    const isAuthenticated = req.user !== null;
    const isWholesaler = isAuthenticated && (req.user.is_wholesaler === true || req.user.is_wholesaler === 1);

    // Build query based on user type with JOINs to get category and subcategory names
    let query, priceFields;

    if (isWholesaler) {
      // Wholesale user - return second_price and discount2_price
      query = `
        SELECT
          p.id, p.name, p.description,
          p.second_price as price, p.discount2_price as discount_price,
          p.detail_image_path, p.is_available, p.updated_at,
          c.category_name,
          sc.name as subcategory_name
        FROM products p
        JOIN categories c ON p.category_id = c.id
        JOIN subcategories sc ON p.sub_category_id = sc.id
        WHERE p.id = ?
      `;
    } else {
      // Regular user or not authenticated - return first_price and discount1_price
      query = `
        SELECT
          p.id, p.name, p.description,
          p.first_price as price, p.discount1_price as discount_price,
          p.detail_image_path, p.is_available, p.updated_at,
          c.category_name,
          sc.name as subcategory_name
        FROM products p
        JOIN categories c ON p.category_id = c.id
        JOIN subcategories sc ON p.sub_category_id = sc.id
        WHERE p.id = ?
      `;
    }

    // Get product detail from database
    const [products] = await pool.query(query, [productid]);

    // Check if product exists
    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const product = products[0];

    // Format product detail response
    const formattedProduct = {
      id: product.id,
      name: product.name,
      category_name: product.category_name,
      subcategory_name: product.subcategory_name,
      price: product.price == null ? null : Number(product.price),
      discount_price: product.discount_price == null ? null : Number(product.discount_price),
      description: product.description,
      detail_image_path: product.detail_image_path ? buildImageUrl(product.detail_image_path, product.updated_at) : null,
      is_available: Boolean(product.is_available)
    };

    res.json({
      success: true,
      data: formattedProduct,
      message: `Product detail retrieved successfully for ${isWholesaler ? 'wholesale' : 'regular'} user`,
      user_type: isWholesaler ? 'wholesale' : (isAuthenticated ? 'authenticated_regular' : 'guest')
    });
  } catch (error) {
    console.error("Error in getProductDetail:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

export const getSubcategories = async (req, res) => {
  try {
    const pool = await getPool();
    const [subcategories] = await pool.query(
      "SELECT id, category_id, name, image_path, updated_at FROM subcategories ORDER BY id ASC"
    );
    
    // Format subcategories with ready-to-use image URLs
    const formattedSubcategories = subcategories.map(subcategory => ({
      id: subcategory.id,
      category_id: subcategory.category_id,
      name: subcategory.name,
      imageUrl: subcategory.image_path ? buildImageUrl(subcategory.image_path, subcategory.updated_at) : null
    }));
    
    res.json({
      success: true,
      data: formattedSubcategories,
      message: "Subcategories retrieved successfully"
    });
  } catch (error) {
    console.error("Error in getSubcategories:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const pool = await getPool();
    const { category_id } = req.params;

    // Validate category_id
    if (!category_id || isNaN(category_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID provided"
      });
    }

    // Determine user type
    const isAuthenticated = req.user !== null;
    const isWholesaler = isAuthenticated && (req.user.is_wholesaler === true || req.user.is_wholesaler === 1);

    // Get pagination parameters
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    // Validate limit (prevent excessive data requests)
    const maxLimit = 100;
    const actualLimit = Math.min(limit, maxLimit);

    // Build query based on user type
    let query, priceFields;

    if (isWholesaler) {
      // Wholesale user - return second_price and discount2_price
      query = `
        SELECT
          id, name, description, category_id, sub_category_id,
          second_price as price, discount2_price as discount_price,
          thumb_image_path, detail_image_path, is_available, created_at, updated_at
        FROM products
        WHERE category_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      priceFields = ['price', 'discount_price'];
    } else {
      // Regular user or not authenticated - return first_price and discount1_price
      query = `
        SELECT
          id, name, description, category_id, sub_category_id,
          first_price as price, discount1_price as discount_price,
          thumb_image_path, detail_image_path, is_available, created_at, updated_at
        FROM products
        WHERE category_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      priceFields = ['price', 'discount_price'];
    }

    // Get products from database with pagination and category filter
    const [products] = await pool.query(query, [category_id, actualLimit, offset]);

    // Get total count for pagination metadata
    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM products WHERE category_id = ?', [category_id]);
    const totalProducts = countResult[0].total;
    const totalPages = Math.ceil(totalProducts / actualLimit);

    // Format products with ready-to-use image URLs
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price == null ? null : Number(product.price),
      discount_price: product.discount_price == null ? null : Number(product.discount_price),
      thumbImageUrl: product.thumb_image_path ? buildImageUrl(product.thumb_image_path, product.updated_at) : null,
      is_available: Boolean(product.is_available)
    }));

    res.json({
      success: true,
      data: formattedProducts,
      pagination: {
        current_page: page,
        per_page: actualLimit,
        total_pages: totalPages,
        total_products: totalProducts,
        has_next: page < totalPages,
        has_prev: page > 1
      },
      message: `Products for category ${category_id} retrieved successfully for ${isWholesaler ? 'wholesale' : 'regular'} user`,
      user_type: isWholesaler ? 'wholesale' : (isAuthenticated ? 'authenticated_regular' : 'guest'),
      category_id: parseInt(category_id)
    });
  } catch (error) {
    console.error("Error in getProductsByCategory:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

export const getProductsBySubcategory = async (req, res) => {
  try {
    const pool = await getPool();
    const { subcategory_id } = req.params;

    // Validate subcategory_id
    if (!subcategory_id || isNaN(subcategory_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subcategory ID provided"
      });
    }

    // Determine user type
    const isAuthenticated = req.user !== null;
    const isWholesaler = isAuthenticated && (req.user.is_wholesaler === true || req.user.is_wholesaler === 1);

    // Get pagination parameters
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    // Validate limit (prevent excessive data requests)
    const maxLimit = 100;
    const actualLimit = Math.min(limit, maxLimit);

    // Build query based on user type
    let query, priceFields;

    if (isWholesaler) {
      // Wholesale user - return second_price and discount2_price
      query = `
        SELECT
          id, name, description, category_id, sub_category_id,
          second_price as price, discount2_price as discount_price,
          thumb_image_path, detail_image_path, is_available, created_at, updated_at
        FROM products
        WHERE sub_category_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      priceFields = ['price', 'discount_price'];
    } else {
      // Regular user or not authenticated - return first_price and discount1_price
      query = `
        SELECT
          id, name, description, category_id, sub_category_id,
          first_price as price, discount1_price as discount_price,
          thumb_image_path, detail_image_path, is_available, created_at, updated_at
        FROM products
        WHERE sub_category_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      priceFields = ['price', 'discount_price'];
    }

    // Get products from database with pagination and subcategory filter
    const [products] = await pool.query(query, [subcategory_id, actualLimit, offset]);

    // Get total count for pagination metadata
    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM products WHERE sub_category_id = ?', [subcategory_id]);
    const totalProducts = countResult[0].total;
    const totalPages = Math.ceil(totalProducts / actualLimit);

    // Format products with ready-to-use image URLs
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price == null ? null : Number(product.price),
      discount_price: product.discount_price == null ? null : Number(product.discount_price),
      thumbImageUrl: product.thumb_image_path ? buildImageUrl(product.thumb_image_path, product.updated_at) : null,
      is_available: Boolean(product.is_available)
    }));

    res.json({
      success: true,
      data: formattedProducts,
      pagination: {
        current_page: page,
        per_page: actualLimit,
        total_pages: totalPages,
        total_products: totalProducts,
        has_next: page < totalPages,
        has_prev: page > 1
      },
      message: `Products for subcategory ${subcategory_id} retrieved successfully for ${isWholesaler ? 'wholesale' : 'regular'} user`,
      user_type: isWholesaler ? 'wholesale' : (isAuthenticated ? 'authenticated_regular' : 'guest'),
      subcategory_id: parseInt(subcategory_id)
    });
  } catch (error) {
    console.error("Error in getProductsBySubcategory:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

export const getSearchProducts = async (req, res) => {
  try {
    const pool = await getPool();
    const q = (req.query.q || '').trim();

    // Minimum 2 characters to search
    if (q.length < 2) {
      return res.json({
        success: true,
        data: [],
        pagination: { current_page: 1, per_page: 0, total_pages: 0, total_products: 0, has_next: false, has_prev: false },
        message: 'Query too short, provide at least 2 characters',
      });
    }

    // Determine user type
    const isAuthenticated = req.user !== null;
    const isWholesaler = isAuthenticated && (req.user.is_wholesaler === true || req.user.is_wholesaler === 1);

    // Pagination
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    const maxLimit = 100;
    const actualLimit = Math.min(limit, maxLimit);

    // Build SQL by user type
    let selectQuery;
    if (isWholesaler) {
      selectQuery = `
        SELECT
          id, name, description, category_id, sub_category_id,
          second_price as price, discount2_price as discount_price,
          thumb_image_path, is_available, updated_at
        FROM products
        WHERE name LIKE ? OR description LIKE ?
        ORDER BY updated_at DESC
        LIMIT ? OFFSET ?
      `;
    } else {
      selectQuery = `
        SELECT
          id, name, description, category_id, sub_category_id,
          first_price as price, discount1_price as discount_price,
          thumb_image_path, is_available, updated_at
        FROM products
        WHERE name LIKE ? OR description LIKE ?
        ORDER BY updated_at DESC
        LIMIT ? OFFSET ?
      `;
    }

    const like = `%${q}%`;

    // Query data
    const [rows] = await pool.query(selectQuery, [like, like, actualLimit, offset]);

    // Count total
    const [countRows] = await pool.query(
      'SELECT COUNT(*) as total FROM products WHERE name LIKE ? OR description LIKE ?',
      [like, like]
    );
    const totalProducts = countRows[0]?.total || 0;
    const totalPages = Math.ceil(totalProducts / actualLimit) || 0;

    // Map/format
    const formatted = rows.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price == null ? null : Number(p.price),
      discount_price: p.discount_price == null ? null : Number(p.discount_price),
      thumbImageUrl: p.thumb_image_path ? buildImageUrl(p.thumb_image_path, p.updated_at) : null,
      is_available: Boolean(p.is_available)
    }));

    res.json({
      success: true,
      data: formatted,
      pagination: {
        current_page: page,
        per_page: actualLimit,
        total_pages: totalPages,
        total_products: totalProducts,
        has_next: page < totalPages,
        has_prev: page > 1
      },
      message: `Search results for "${q}" retrieved successfully for ${isWholesaler ? 'wholesale' : 'regular'} user`,
      user_type: isWholesaler ? 'wholesale' : (isAuthenticated ? 'authenticated_regular' : 'guest')
    });
  } catch (error) {
    console.error('Error in getSearchProducts:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};
