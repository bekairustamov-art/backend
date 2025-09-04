import "dotenv/config";
import express from 'express';
import cors from "cors";
import { fileURLToPath } from 'url';
import path from 'path';
import { getPool } from "./src/config/db.js";
import testRouter from './src/routes/testRoutes.js'; 

const app = express();

app.use(cors({
  origin: [
    process.env.FRONTEND_URL, // From .env
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

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: `${PORT} Hello from backend!` });
});

app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});