import express from "express";
import { ROLE_LEVELS } from "../config/constants.js";
import {
  assignEmployeeToSlot,
  createJobOrder,
  getJobOrders,
  getSlotSuggestions,
  importJobOrdersFromExcel,
  releaseEmployeeFromSlot,
  updateSlotPipeline,
} from "../controllers/jobOrderController.js";
import { protect, requireLevel } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.use(protect);

// GET /api/job-orders - Retrieve job orders with populated slots
router.get("/", getJobOrders);

// GET /api/job-orders/suggest - Run auto-suggestion query for empty trade slot
router.get("/suggest", getSlotSuggestions);

// POST /api/job-orders - Create new Job Order (Level 2 Engineer or Level 1 Admin)
router.post("/", requireLevel(ROLE_LEVELS.PROJECT_ENGINEER), createJobOrder);

// POST /api/job-orders/import - Bulk Job Order Upload (Level 2 Engineer or Level 1 Admin)
router.post(
  "/import",
  requireLevel(ROLE_LEVELS.PROJECT_ENGINEER),
  upload.single("file"),
  importJobOrdersFromExcel,
);

// PUT /api/job-orders/:id/update-slot-pipeline - Update slot pipeline with mandatory audit check
router.put(
  "/:id/update-slot-pipeline",
  requireLevel(ROLE_LEVELS.PROJECT_ENGINEER),
  updateSlotPipeline,
);

// PUT /api/job-orders/:id/assign-slot - Assign worker to slot with mandatory audit check
router.put(
  "/:id/assign-slot",
  requireLevel(ROLE_LEVELS.PROJECT_ENGINEER),
  assignEmployeeToSlot,
);

// PUT /api/job-orders/:id/release-slot - Demobilize worker from slot
router.put(
  "/:id/release-slot",
  requireLevel(ROLE_LEVELS.PROJECT_ENGINEER),
  releaseEmployeeFromSlot,
);

export default router;
