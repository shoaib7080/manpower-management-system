import express from 'express';
import upload from '../middleware/uploadMiddleware.js';
import { protect, requireLevel } from '../middleware/authMiddleware.js';
import { ROLE_LEVELS } from '../config/constants.js';
import {
  getEmployees,
  createEmployee,
  importEmployeesFromExcel
} from '../controllers/manpowerController.js';

const router = express.Router();

// All manpower routes require authenticated access
router.use(protect);

// GET /api/manpower - Retrieve personnel with multi-trade filters
router.get('/', getEmployees);

// POST /api/manpower - Manual employee registration (Level 2 or higher)
router.post('/', requireLevel(ROLE_LEVELS.PROJECT_ENGINEER), createEmployee);

// POST /api/manpower/import - Bulk Excel Upload (Level 1 Admin only)
router.post(
  '/import',
  requireLevel(ROLE_LEVELS.ADMIN),
  upload.single('file'),
  importEmployeesFromExcel
);

export default router;
