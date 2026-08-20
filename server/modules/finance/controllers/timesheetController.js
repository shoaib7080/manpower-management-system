// server/modules/finance/controllers/timesheetController.js
import AuditLog from "../../../shared/models/AuditLog.js";
import JobOrder from "../../operations/models/JobOrder.js";
import Timesheet from "../models/Timesheet.js";

function activeDaysInMonth(mobDate, demobDate, month, year) {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  const start = new Date(Math.max(new Date(mobDate), monthStart));
  const end = new Date(Math.min(new Date(demobDate), monthEnd));
  const days = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(d.getDate());
  }
  return days;
}

// @route GET /api/finance/timesheets/:jobOrderId?month=&year=
export const getTimesheet = async (req, res, next) => {
  try {
    const { jobOrderId } = req.params;
    const month = parseInt(req.query.month);
    const year = parseInt(req.query.year);

    if (!month || !year)
      return res
        .status(400)
        .json({ message: "month and year query params are required." });

    const saved = await Timesheet.findOne({ jobOrderId, month, year });
    if (saved) return res.status(200).json(saved);

    const jobOrder = await JobOrder.findById(jobOrderId);
    if (!jobOrder)
      return res.status(404).json({ message: "Job Order not found." });

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    const logs = await AuditLog.find({
      newSite: jobOrder.siteName,
      newStatus: { $in: ["RESERVED", "BOOKED", "MOBILIZED"] },
    });

    const recordMap = new Map();

    for (const log of logs) {
      const mob = log.mobDate || log.createdAt;
      const demob = log.demobDate || monthEnd;

      if (new Date(mob) > monthEnd || new Date(demob) < monthStart) continue;

      const key = `${log.employeeName}`;
      if (recordMap.has(key)) continue;

      let trade = "Unknown";
      if (log.employeeId) {
        const slot = jobOrder.slots.find(
          (s) => s.assignedEmployee?.toString() === log.employeeId.toString(),
        );
        if (slot) trade = slot.trade;
      } else {
        const slot = jobOrder.slots.find(
          (s) =>
            s.externalWorker?.name &&
            log.employeeName.startsWith(s.externalWorker.name),
        );
        if (slot) trade = slot.trade;
      }

      const activeDays = activeDaysInMonth(mob, demob, month, year);

      recordMap.set(key, {
        employeeId: log.employeeId || null,
        employeeName: log.employeeName,
        trade,
        isExternal: !log.employeeId,
        days: activeDays.map((dayNumber) => ({
          dayNumber,
          selected: true,
          standardHours: 8,
          overtimeHours: 0,
        })),
      });
    }

    res.status(200).json({
      jobOrderId,
      month,
      year,
      records: Array.from(recordMap.values()),
      status: "DRAFT",
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/finance/timesheets
export const saveTimesheet = async (req, res, next) => {
  try {
    const { jobOrderId, month, year, records } = req.body;

    if (!jobOrderId || !month || !year)
      return res
        .status(400)
        .json({ message: "jobOrderId, month, and year are required." });

    const timesheet = await Timesheet.findOneAndUpdate(
      { jobOrderId, month, year },
      { jobOrderId, month, year, records, status: "DRAFT" },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.status(200).json(timesheet);
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/finance/timesheets/:id/approve
export const approveTimesheet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;

    if (!approvedBy)
      return res.status(400).json({ message: "approvedBy is required." });

    const timesheet = await Timesheet.findByIdAndUpdate(
      id,
      { status: "APPROVED", approvedBy },
      { new: true },
    );

    if (!timesheet)
      return res.status(404).json({ message: "Timesheet not found." });

    res.status(200).json(timesheet);
  } catch (error) {
    next(error);
  }
};
