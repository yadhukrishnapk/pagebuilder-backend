import express from "express";
import {
  getPages,
  getPageBySlug,
  createPage,
  updatePage,
  deletePage,
} from "../controllers/pageBuilderController.js";

const router = express.Router();

router.get("/", getPages);
router.get("/:slug", getPageBySlug);
router.post("/", createPage);
router.put("/:slug", updatePage);
router.delete("/:id", deletePage);

export default router;
