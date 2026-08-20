import express from "express";
import { MODULE_LEVELS } from "../../../core/config/constants.js";
import {
  createSpecialization,
  deactivateSpecialization,
  getSpecializations,
  updateSpecialization,
} from "../controllers/specializationController.js";
import {
  protect,
  requireModuleLevel,
} from "../../../core/middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

// GET — viewer+ (all operations users can read the specialization catalogue)
router.get("/", requireModuleLevel("operations", MODULE_LEVELS.VIEWER), getSpecializations);

// Write operations — admin only (specializations are reference data)
router.post(
  "/",
  requireModuleLevel("operations", MODULE_LEVELS.ADMIN),
  createSpecialization,
);
router.put(
  "/:id",
  requireModuleLevel("operations", MODULE_LEVELS.ADMIN),
  updateSpecialization,
);
router.patch(
  "/:id/deactivate",
  requireModuleLevel("operations", MODULE_LEVELS.ADMIN),
  deactivateSpecialization,
);

export default router;
