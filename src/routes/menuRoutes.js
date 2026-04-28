import express from "express";
import {
  getMenus,
  getMenuById,
  getMenuByCode,
  createMenu,
  updateMenu,
  deleteMenu,
} from "../controllers/menuController.js";

const router = express.Router();

router.get("/", getMenus);
router.get("/by-code/:code", getMenuByCode);
router.get("/:id", getMenuById);
router.post("/", createMenu);
router.put("/:id", updateMenu);
router.delete("/:id", deleteMenu);

export default router;
