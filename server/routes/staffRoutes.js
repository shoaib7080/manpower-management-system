import express from "express";
import { ROLE_LEVELS } from "../config/constants.js";
import {
  createStaff,
  deactivateStaff,
  getStaff,
  updateStaff,
} from "../controllers/staffController.js";
import { protect, requireLevel } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

router.get("/", getStaff);
router.post("/", requireLevel(ROLE_LEVELS.ADMIN), createStaff);
router.put("/:id", requireLevel(ROLE_LEVELS.ADMIN), updateStaff);
router.patch(
  "/:id/deactivate",
  requireLevel(ROLE_LEVELS.ADMIN),
  deactivateStaff,
);

export default router;
