import "dotenv/config";
import express from 'express';
import cors from "cors";
import { router as authRouter } from "./src/routes/authRoutes.js";


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

// Routers
app.use("/api/auth", authRouter);



const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Hello from backend!' });
});

app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});