import express from "express";
import { getPages, getPageBySlug, createPage, updatePage } from "../controllers/pageBuilderController.js";

const router = express.Router();

router.get("/", getPages);
router.get("/:id", getPageBySlug);
router.post("/", createPage);
router.put("/:id", updatePage);

export default router;
