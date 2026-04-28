import express from "express";
import {
  getStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
  ensureDefaultStores,
} from "../controllers/storeController.js";

const router = express.Router();

router.get("/", getStores);
router.post("/ensure-defaults", ensureDefaultStores);
router.get("/:id", getStoreById);
router.post("/", createStore);
router.put("/:id", updateStore);
router.delete("/:id", deleteStore);

export default router;
