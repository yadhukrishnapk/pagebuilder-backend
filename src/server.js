import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import pageBuilderRoutes from "./routes/pageBuilderRoutes.js";

dotenv.config();
connectDB();

const app = express();

// ✅ CORS FIRST
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Test Route
app.get("/", (req, res) => {
  res.send("API Running...");
});

// API Routes
app.use("/products", productRoutes);
app.use("/category", categoryRoutes);
app.use("/page-builder", pageBuilderRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});