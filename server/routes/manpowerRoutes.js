import express from "express";
import { ROLE_LEVELS } from "../config/constants.js";
import {
  createEmployee,
  deleteEmployee,
  getEmployees,
  importEmployeesFromExcel,
  updateEmployee,
} from "../controllers/manpowerController.js";
import { protect, requireLevel } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// All manpower routes require authenticated access
router.use(protect);

// GET /api/manpower - Retrieve personnel with multi-trade filters
router.get("/", getEmployees);

// POST /api/manpower - Manual employee registration (Level 2 or higher)
router.post("/", requireLevel(ROLE_LEVELS.PROJECT_ENGINEER), createEmployee);

// POST /api/manpower/import - Bulk Excel Upload (Level 1 Admin only)
router.post(
  "/import",
  requireLevel(ROLE_LEVELS.ADMIN),
  upload.single("file"),
  importEmployeesFromExcel,
);

router.put("/:id", requireLevel(ROLE_LEVELS.PROJECT_ENGINEER), updateEmployee);
router.delete("/:id", requireLevel(ROLE_LEVELS.ADMIN), deleteEmployee);

export default router;
