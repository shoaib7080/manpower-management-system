import express from "express";
import { ROLE_LEVELS } from "../config/constants.js";
import {
  createSpecialization,
  deactivateSpecialization,
  getSpecializations,
  updateSpecialization,
} from "../controllers/specializationController.js";
import { protect, requireLevel } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

router.get("/", getSpecializations);
router.post("/", requireLevel(ROLE_LEVELS.ADMIN), createSpecialization);
router.put("/:id", requireLevel(ROLE_LEVELS.ADMIN), updateSpecialization);
router.patch(
  "/:id/deactivate",
  requireLevel(ROLE_LEVELS.ADMIN),
  deactivateSpecialization,
);

export default router;
