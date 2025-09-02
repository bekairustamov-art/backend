import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { router as authRouter } from "./src/routes/authRoutes.js";
import { pool } from "./src/config/db.js";
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
app.use(
  cors({
    origin: [
      "https://hilookappadmin.uz",
      "https://www.hilookappadmin.uz"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200 // For legacy browser support
  })
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(morgan("dev"));

// Static files (for uploaded images etc.)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/public", express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 4000;

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "up" });
  } catch (err) {
    res.json({ status: "ok", db: "down", error: err.message });
  }
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

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
