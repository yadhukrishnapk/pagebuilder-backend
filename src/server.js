import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { runMigrations } from "./config/migrations.js";

import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import pageBuilderRoutes from "./routes/pageBuilderRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import path from "node:path";

dotenv.config();

const bootstrap = async () => {
  await connectDB();
  await runMigrations();
};

bootstrap();

const app = express();

// ✅ CORS FIRST
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-App-ID",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Content-Length", "Content-Type"],
  maxAge: 600,
};
app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Test Route
app.get("/", (req, res) => {
  res.send("API Running...");
});

// API Routes — mounted both with and without /api prefix so frontends
// configured with either baseURL work out of the box.
const mountApi = (base) => {
  app.use(`${base}/products`, productRoutes);
  app.use(`${base}/category`, categoryRoutes);
  app.use(`${base}/page-builder`, pageBuilderRoutes);
  app.use(`${base}/upload`, uploadRoutes);
};
mountApi("");
mountApi("/api");
app.use("/uploads", express.static(path.resolve("uploads")));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});