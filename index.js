import "dotenv/config";
import express from 'express';
import cors from "cors";
import { fileURLToPath } from 'url';
import path from 'path';
import { getPool } from "./src/config/db.js";
import testRouter from './src/routes/testRoutes.js'; 
import { router as authRouter } from "./src/routes/authRoutes.js";
import { router as bannerRouter } from "./src/routes/bannerRoutes.js";
import { router as categoryRouter } from "./src/routes/categoryRoutes.js";
import { infoRouter } from "./src/routes/infoRoutes.js";
import { router as userRouter } from "./src/routes/userRoutes.js";
import { router as subcategoryRouter } from "./src/routes/subcategoryRoutes.js";
import { router as productRouter } from "./src/routes/productRoutes.js";
import { router as orderRouter } from "./src/routes/orderRoutes.js";
import userAuthRoutes from "./src/routes/userAuthRoutes.js";
import { permissionRouter } from "./src/routes/permissionRoutes.js";
import { router as userDataRouter } from "./src/routes/userDataRoutes.js";
import { router as pushRouter } from "./src/routes/pushRoutes.js";

const app = express();

app.use(cors({
  origin: [
    process.env.FRONTEND_URL, // From .env
    "https://hilookappadmin.uz",
    "https://www.hilookappadmin.uz",
    "https://api.hilookappadmin.uz",
    // "http://localhost:3000"
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

// Static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/public", express.static(path.join(__dirname, "public")));
// Routers

app.use(['/api/test', '/api/test/'], testRouter);
app.get(['/health', '/health/'], async (req, res) => {
  try {
    const pool = await getPool();
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "up" });
  } catch (err) {
    res.json({ status: "ok", db: "down", error: err.message });
  }
});
app.use(['/api/auth', '/api/auth/'], authRouter);
app.use(['/api/banners','/api/banners/'], bannerRouter);
app.use(['/api/categories', '/api/categories/'], categoryRouter);
app.use(['/api/info', '/api/info/'], infoRouter);
app.use(['/api/users', '/api/users/'], userRouter);
app.use(['/api/sub-categories', '/api/sub-categories/'], subcategoryRouter);
app.use(['/api/products', '/api/products/'], productRouter);
app.use(['/api/orders', '/api/orders/'], orderRouter);
app.use(['/api/permission', '/api/permission/'], permissionRouter);
app.use(['/api/user-auth', '/api/user-auth/'], userAuthRoutes);
app.use(['/api/user-data', '/api/user-data/'], userDataRouter);
app.use(['/api/push', '/api/push/'], pushRouter);

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: `${PORT} Hello from backend!` });
});

app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});