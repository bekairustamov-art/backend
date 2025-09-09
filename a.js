console.log('[INIT] Server starting...');
console.log('[ENV] Node:', process.version);
console.log('[ENV] PORT:', process.env.PORT || 'Not set');
import { fileURLToPath } from 'url';
import path from 'path';
import "dotenv/config";
import express from "express";
import cors from "cors";
// import morgan from "morgan";
import { router as authRouter } from "./src/routes/authRoutes.js";
// import { pool } from "./src/config/db.js";
import { router as categoryRouter } from "./src/routes/categoryRoutes.js";
import { router as bannerRouter } from "./src/routes/bannerRoutes.js";
import path from "path";
import { fileURLToPath } from "url";
import { router as subcategoryRouter } from "./src/routes/subcategoryRoutes.js";
import { infoRouter } from "./src/routes/infoRoutes.js";
import { router as productRouter } from "./src/routes/productRoutes.js";
import { router as userRouter } from "./src/routes/userRoutes.js";
import { router as userDataRouter } from "./src/routes/userDataRoutes.js";
import { router as orderRouter } from "./src/routes/orderRoutes.js";
import userAuthRoutes from "./src/routes/userAuthRoutes.js";
import { permissionRouter } from "./src/routes/permissionRoutes.js";

const app = express();

// ✅ Explicit CORS config
app.use(cors({
  origin: [
    
    "https://hilookappadmin.uz",
    "https://www.hilookappadmin.uz",
    "https://api.hilookappadmin.uz"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization",
    "X-Requested-With"
  ],
  optionsSuccessStatus: 204
}));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
// app.use(morgan("dev"));

// Static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/public", express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  console.log(`Incoming ${req.method} request to ${req.path}`);
  console.log("Origin:", req.headers.origin);
  console.log("Headers:", req.headers);
  next();
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "up" });
  } catch (err) {
    res.json({ status: "ok", db: "down", error: err.message });
  }
});

// Test endpoints
app.options("/api/auth/admin-login", cors());
app.get("/api/auth/test-cors", (req, res) => {
  res.json({ success: true, message: "CORS test successful" });
});

app.get("/api/test", (req, res) => {
  res.json({
    status: "success",
    message: "Backend is working",
    timestamp: new Date().toISOString()
  });
});

// Routers
app.use("/api/auth", authRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/banners", bannerRouter);
app.use("/api/sub-categories", subcategoryRouter);
app.use("/api/info", infoRouter);
app.use("/api/products", productRouter);
app.use("/api/user-auth", userAuthRoutes);
app.use("/api/users", userRouter);
app.use("/api/user-data", userDataRouter);
app.use("/api/orders", orderRouter);
app.use("/api/permission", permissionRouter);


const PORT = process.env.PORT || 3000;
if (!PORT) {
  console.error('[ERROR] PORT not configured');
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`[OK] Running on port ${PORT}`);
  if (app._router && app._router.stack) {
    console.log('[ROUTES] Available:');
    app._router.stack.forEach(layer => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
        console.log(`  ${methods} ${layer.route.path}`);
      }
    });
  } else {
    console.log('[ROUTES] app._router not available (Express 5)');
  }
});