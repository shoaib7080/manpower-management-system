import express from "express";
import { MODULE_LEVELS } from "../../../core/config/constants.js";
import {
  createEmployee,
  deleteEmployee,
  getEmployees,
  importEmployeesFromExcel,
  updateEmployee,
  uploadCertificate,
} from "../controllers/manpowerController.js";
import {
  protect,
  requireModuleLevel,
} from "../../../core/middleware/authMiddleware.js";
import upload, { certUpload } from "../../../core/middleware/uploadMiddleware.js";

const router = express.Router();

// All manpower routes require an authenticated, active session
router.use(protect);

// GET /api/manpower - Retrieve personnel with multi-trade filters (viewer+)
router.get("/", requireModuleLevel("operations", MODULE_LEVELS.VIEWER), getEmployees);

// POST /api/manpower - Manual employee registration (operator+)
router.post("/", requireModuleLevel("operations", MODULE_LEVELS.OPERATOR), createEmployee);

// POST /api/manpower/import - Bulk Excel Upload (module admin only)
router.post(
  "/import",
  requireModuleLevel("operations", MODULE_LEVELS.ADMIN),
  upload.single("file"),
  importEmployeesFromExcel,
);

// POST /api/manpower/upload-cert - Upload certificate (operator+)
router.post(
  "/upload-cert",
  requireModuleLevel("operations", MODULE_LEVELS.OPERATOR),
  certUpload.single("file"),
  uploadCertificate,
);

// PUT /api/manpower/:id - Update employee record (operator+)
router.put(
  "/:id",
  requireModuleLevel("operations", MODULE_LEVELS.OPERATOR),
  updateEmployee,
);

// DELETE /api/manpower/:id - Delete employee (module admin only)
router.delete(
  "/:id",
  requireModuleLevel("operations", MODULE_LEVELS.ADMIN),
  deleteEmployee,
);

export default router;
