import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getAuditLogs } from '../controllers/auditController.js';

const router = express.Router();

router.use(protect);

// GET /api/audit-logs - View modification history
router.get('/', getAuditLogs);

export default router;
