import express from "express";
import { MODULE_LEVELS } from "../../../core/config/constants.js";
import {
  createStaff,
  deactivateStaff,
  getStaff,
  updateStaff,
} from "../controllers/staffController.js";
import {
  protect,
  requireModuleLevel,
} from "../../../core/middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

// GET — viewer+
router.get("/", requireModuleLevel("operations", MODULE_LEVELS.VIEWER), getStaff);

// Write operations — admin only (staff list is reference data)
router.post(
  "/",
  requireModuleLevel("operations", MODULE_LEVELS.ADMIN),
  createStaff,
);
router.put(
  "/:id",
  requireModuleLevel("operations", MODULE_LEVELS.ADMIN),
  updateStaff,
);
router.patch(
  "/:id/deactivate",
  requireModuleLevel("operations", MODULE_LEVELS.ADMIN),
  deactivateStaff,
);

export default router;
