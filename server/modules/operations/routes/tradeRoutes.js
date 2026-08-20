import express from "express";
import { MODULE_LEVELS } from "../../../core/config/constants.js";
import {
  createTrade,
  deactivateTrade,
  getTrades,
  updateTrade,
} from "../controllers/tradeController.js";
import {
  protect,
  requireModuleLevel,
} from "../../../core/middleware/authMiddleware.js";

const router = express.Router();

// All trade routes require an authenticated, active session
router.use(protect);

// GET — viewer+
router.get("/", requireModuleLevel("operations", MODULE_LEVELS.VIEWER), getTrades);

// Write operations — admin only (trade catalogue is reference data)
router.post(
  "/",
  requireModuleLevel("operations", MODULE_LEVELS.ADMIN),
  createTrade,
);
router.put(
  "/:id",
  requireModuleLevel("operations", MODULE_LEVELS.ADMIN),
  updateTrade,
);
router.patch(
  "/:id/deactivate",
  requireModuleLevel("operations", MODULE_LEVELS.ADMIN),
  deactivateTrade,
);

export default router;
