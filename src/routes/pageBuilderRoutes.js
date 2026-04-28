import express from "express";
import {
  getPages,
  getPageById,
  createPage,
  updatePage,
  deletePage,
} from "../controllers/pageBuilderController.js";

const router = express.Router();

router.get("/", getPages);
router.get("/:id", getPageById);
router.post("/", createPage);
router.put("/:id", updatePage);
router.delete("/:id", deletePage);

export default router;
