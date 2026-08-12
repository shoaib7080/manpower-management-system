import AuditLog from "../models/AuditLog.js";

// @desc    Get audit trail logs (filterable by employeeId)
// @route   GET /api/audit-logs
// @access  Protected
export const getAuditLogs = async (req, res, next) => {
  try {
    const { employeeId } = req.query;
    let query = {};

    if (employeeId) {
      query.employeeId = employeeId;
    }

    const logs = await AuditLog.find(query)
      .populate("updatedByUserId", "name level")
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json(logs);
  } catch (error) {
    next(error);
  }
};
