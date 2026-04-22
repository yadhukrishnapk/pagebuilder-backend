import express from "express";
import { getProducts, getProductFilters } from "../controllers/productController.js";

const router = express.Router();

router.get("/filters", getProductFilters);
router.get("/", getProducts);

export default router;
