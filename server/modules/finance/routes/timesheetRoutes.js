// server/modules/finance/routes/timesheetRoutes.js
import express from "express";
import {
  protect,
  requireModuleLevel,
} from "../../../core/middleware/authMiddleware.js";
import {
  approveTimesheet,
  getTimesheet,
  saveTimesheet,
} from "../controllers/timesheetController.js";

const router = express.Router();

router.use(protect, requireModuleLevel("finance", 1));

router.get("/:jobOrderId", getTimesheet);
router.post("/", saveTimesheet);
router.put("/:id/approve", approveTimesheet);

export default router;
