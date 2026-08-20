import express from "express";
import { MODULE_LEVELS } from "../../../core/config/constants.js";
import {
  assignEmployeeToSlot,
  createJobOrder,
  getJobOrders,
  getSlotSuggestions,
  importJobOrdersFromExcel,
  releaseEmployeeFromSlot,
  updateJobOrder,
  updateSlotPipeline,
} from "../controllers/jobOrderController.js";
import {
  protect,
  requireModuleLevel,
} from "../../../core/middleware/authMiddleware.js";
import upload from "../../../core/middleware/uploadMiddleware.js";

const router = express.Router();

router.use(protect);

// GET /api/job-orders - Retrieve job orders with populated slots (viewer+)
router.get("/", requireModuleLevel("operations", MODULE_LEVELS.VIEWER), getJobOrders);

// GET /api/job-orders/suggest - Auto-suggestion query (viewer+)
router.get("/suggest", requireModuleLevel("operations", MODULE_LEVELS.VIEWER), getSlotSuggestions);

// POST /api/job-orders - Create new Job Order (operator+)
router.post("/", requireModuleLevel("operations", MODULE_LEVELS.OPERATOR), createJobOrder);

// PUT /api/job-orders/:id - Update job order metadata (operator+)
router.put("/:id", requireModuleLevel("operations", MODULE_LEVELS.OPERATOR), updateJobOrder);

// POST /api/job-orders/import - Bulk Job Order Upload (operator+)
router.post(
  "/import",
  requireModuleLevel("operations", MODULE_LEVELS.OPERATOR),
  upload.single("file"),
  importJobOrdersFromExcel,
);

// PUT /api/job-orders/:id/update-slot-pipeline (operator+)
router.put(
  "/:id/update-slot-pipeline",
  requireModuleLevel("operations", MODULE_LEVELS.OPERATOR),
  updateSlotPipeline,
);

// PUT /api/job-orders/:id/assign-slot (operator+)
router.put(
  "/:id/assign-slot",
  requireModuleLevel("operations", MODULE_LEVELS.OPERATOR),
  assignEmployeeToSlot,
);

// PUT /api/job-orders/:id/release-slot (operator+)
router.put(
  "/:id/release-slot",
  requireModuleLevel("operations", MODULE_LEVELS.OPERATOR),
  releaseEmployeeFromSlot,
);

export default router;
