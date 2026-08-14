import express from "express";
import { ROLE_LEVELS } from "../config/constants.js";
import {
  createTrade,
  deactivateTrade,
  getTrades,
  updateTrade,
} from "../controllers/tradeController.js";
import { protect, requireLevel } from "../middleware/authMiddleware.js";

const router = express.Router();

// All trade routes require authenticated access
router.use(protect);

router.get("/", getTrades);
router.post("/", requireLevel(ROLE_LEVELS.ADMIN), createTrade);
router.put("/:id", requireLevel(ROLE_LEVELS.ADMIN), updateTrade);
router.patch("/:id/deactivate", requireLevel(ROLE_LEVELS.ADMIN), deactivateTrade);

export default router;
