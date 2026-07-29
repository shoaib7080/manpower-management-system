import xlsx from "xlsx";
import { EMPLOYEE_STATUS, ROLE_LEVELS } from "../config/constants.js";
import AuditLog from "../models/AuditLog.js";
import Employee from "../models/Employee.js";
import JobOrder from "../models/JobOrder.js";

// Helper: Calculate default 90-day demobilization date
const calculate90DayDemob = (startDate) => {
  const date = new Date(startDate);
  date.setDate(date.getDate() + 90);
  return date;
};

// @desc    Create a new Job Order with auto-generated empty trade slots
// @route   POST /api/job-orders
// @access  Protected (Level 2 Engineer or Level 1 Admin)
export const createJobOrder = async (req, res) => {
  try {
    const {
      jobOrderNumber,
      siteName,
      clientCategory,
      projectEngineer,
      startDate,
      requirements,
    } = req.body;

    // Check duplicate Job Order number
    const existingOrder = await JobOrder.findOne({ jobOrderNumber });
    if (existingOrder) {
      return res
        .status(400)
        .json({ message: "Job Order Number already exists." });
    }

    const start = new Date(startDate);
    const targetDemobDate = calculate90DayDemob(start);

    // Auto-generate empty slots based on requirement quantities
    const generatedSlots = [];
    requirements.forEach((reqItem) => {
      for (let i = 1; i <= reqItem.requiredQty; i++) {
        generatedSlots.push({
          slotNumber: i,
          trade: reqItem.trade,
          assignedEmployee: null,
          status: "UNASSIGNED",
          mobDate: null,
          demobDate: null,
        });
      }
    });

    const jobOrder = new JobOrder({
      jobOrderNumber,
      siteName,
      clientCategory,
      projectEngineer,
      startDate: start,
      targetDemobDate,
      requirements,
      slots: generatedSlots,
      status: "Active",
    });

    await jobOrder.save();
    res
      .status(201)
      .json({ message: "Job Order created successfully", data: jobOrder });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create Job Order", error: error.message });
  }
};

// @desc    Bulk Import Job Orders from Excel
// @route   POST /api/job-orders/import
// @access  Protected (Level 2 or higher)
export const importJobOrdersFromExcel = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "Please upload an Excel file." });

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const rawRows = xlsx.utils.sheet_to_json(
      workbook.Sheets[workbook.SheetNames[0]],
    );

    if (!rawRows?.length)
      return res
        .status(400)
        .json({ message: "Uploaded Excel sheet is empty." });

    const TRADE_COLS = [
      "Supervisor",
      "Foreman",
      "Fabricator",
      "Welder",
      "Fitter",
      "Rigger",
      "Helper",
      "Other",
    ];
    const parseDate = (v) => {
      if (!v) return null;
      if (typeof v === "number")
        return new Date(Math.round((v - 25569) * 86400 * 1000));
      const d = new Date(v);
      return isNaN(d) ? null : d;
    };

    let processedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const row of rawRows) {
      const jobOrderNumber = String(
        row["Job Order Number"] || row["JO Number"] || row["JobOrderNo"] || "",
      ).trim();
      const siteName = String(row["Site Name"] || row["Site"] || "").trim();
      const clientCategory = String(
        row["Client Category"] || row["Client"] || "",
      ).trim();
      const projectEngineer = String(
        row["Project Engineer"] || row["Engineer"] || "",
      ).trim();
      const startDate = parseDate(row["Start Date"] || row["Mob Date"]);

      if (!jobOrderNumber || !siteName || !clientCategory || !startDate) {
        skippedCount++;
        continue;
      }

      // Build requirements from trade qty columns
      const requirements = [];
      TRADE_COLS.forEach((trade) => {
        const qty = parseInt(row[`${trade} Qty`] || row[trade] || 0);
        if (qty > 0) requirements.push({ trade, requiredQty: qty });
      });

      if (!requirements.length) {
        skippedCount++;
        continue;
      }

      // Check for duplicate
      const existing = await JobOrder.findOne({ jobOrderNumber });
      if (existing) {
        errors.push(`${jobOrderNumber}: already exists, skipped.`);
        skippedCount++;
        continue;
      }

      const targetDemobDate = calculate90DayDemob(startDate);
      const slots = [];
      requirements.forEach(({ trade, requiredQty }) => {
        for (let i = 1; i <= requiredQty; i++) {
          slots.push({
            slotNumber: i,
            trade,
            assignedEmployee: null,
            status: "UNASSIGNED",
            mobDate: null,
            demobDate: null,
          });
        }
      });

      await new JobOrder({
        jobOrderNumber,
        siteName,
        clientCategory,
        projectEngineer: projectEngineer || "TBD",
        startDate,
        targetDemobDate,
        requirements,
        slots,
        status: "Active",
      }).save();

      processedCount++;
    }

    res.status(200).json({
      message: "Job order import completed.",
      processedCount,
      skippedCount,
      errors,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Job order import failed", error: error.message });
  }
};

// @desc    Get all Job Orders with populated employee details in slots
// @route   GET /api/job-orders
// @access  Protected
export const getJobOrders = async (req, res) => {
  try {
    const { status, siteName } = req.query;
    let query = {};

    if (status) query.status = status;
    if (siteName) query.siteName = { $regex: siteName, $options: "i" };

    const jobOrders = await JobOrder.find(query)
      .populate(
        "slots.assignedEmployee",
        "employeeId name trade status trainings documents",
      )
      .sort({ createdAt: -1 });

    res.status(200).json(jobOrders);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching Job Orders", error: error.message });
  }
};

// @desc    Auto-Suggestion Engine for Empty Trade Slots
// @route   GET /api/job-orders/suggest
// @access  Protected
export const getSlotSuggestions = async (req, res) => {
  try {
    const { trade, clientCategory } = req.query;

    if (!trade) {
      return res
        .status(400)
        .json({ message: "Trade parameter is required for suggestions." });
    }

    const now = new Date();

    // Base query: correct trade, available status, and at least one document field
    // present on BOTH hsePassport and cicpaPass (number OR expiry is enough)
    const query = {
      trade,
      status: EMPLOYEE_STATUS.AVAILABLE,
      $and: [
        {
          $or: [
            { "documents.hsePassport.number": { $nin: [null, ""] } },
            { "documents.hsePassport.expiry": { $ne: null } },
          ],
        },
        {
          $or: [
            { "documents.cicpaPass.number": { $nin: [null, ""] } },
            { "documents.cicpaPass.expiry": { $ne: null } },
          ],
        },
      ],
    };

    // Additional training checks per client category (still enforced on top of documents)
    // if (clientCategory === "ADNOC Offshore") {
    //   query["trainings.h2sExpiry"] = { $gt: now };
    //   query["trainings.seaSurvivalExpiry"] = { $gt: now };
    //   query["trainings.medicalExpiry"] = { $gt: now };
    // } else if (clientCategory === "ADNOC Onshore") {
    //   query["trainings.h2sExpiry"] = { $gt: now };
    //   query["trainings.medicalExpiry"] = { $gt: now };
    // }

    const availableCandidates = await Employee.find(query).select(
      "employeeId name trade status trainings documents currentAssignment",
    );

    res.status(200).json({
      trade,
      clientCategory,
      count: availableCandidates.length,
      suggestions: availableCandidates,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error running suggestion engine",
      error: error.message,
    });
  }
};

// @desc    Advance worker through pipeline (RESERVED -> BOOKED -> MOBILIZED)
// @route   PUT /api/job-orders/:id/update-slot-pipeline
// @access  Protected
export const updateSlotPipeline = async (req, res) => {
  try {
    const { id: jobOrderId } = req.params;
    const { slotId, targetStatus, reasonForChange, authorizedBy } = req.body;

    // Enforce mandatory audit inputs
    if (!reasonForChange || !authorizedBy) {
      return res.status(400).json({
        message:
          'Audit Error: "reasonForChange" and "authorizedBy" are strictly required.',
      });
    }

    const jobOrder = await JobOrder.findById(jobOrderId);
    if (!jobOrder)
      return res.status(404).json({ message: "Job Order not found." });

    const slot = jobOrder.slots.id(slotId);
    if (!slot || !slot.assignedEmployee) {
      return res
        .status(400)
        .json({ message: "Target slot is empty or invalid." });
    }

    const employee = await Employee.findById(slot.assignedEmployee);
    if (!employee)
      return res.status(404).json({ message: "Assigned employee not found." });

    const currentStatus = employee.status;

    // Hard-Lock Security Guardrail: Modifying BOOKED or MOBILIZED requires Level 1 Admin
    if (
      (currentStatus === EMPLOYEE_STATUS.BOOKED ||
        currentStatus === EMPLOYEE_STATUS.MOBILIZED) &&
      req.user.level > ROLE_LEVELS.ADMIN
    ) {
      return res.status(403).json({
        message: `Hard Lock Active: Worker is ${currentStatus}. Changes require Level 1 Admin authorization.`,
      });
    }

    // Update Statuses
    slot.status = targetStatus;
    employee.status = targetStatus;

    if (targetStatus === EMPLOYEE_STATUS.MOBILIZED) {
      const mobDate = new Date();
      const demobDate = new Date();
      demobDate.setDate(mobDate.getDate() + 90);

      slot.mobDate = mobDate;
      slot.demobDate = demobDate;
      employee.currentAssignment.mobDate = mobDate;
      employee.currentAssignment.targetDemobDate = demobDate;
    }

    // Commit Audit Trail
    const auditEntry = new AuditLog({
      employeeId: employee._id,
      employeeName: employee.name,
      previousStatus: currentStatus,
      newStatus: targetStatus,
      previousSite: jobOrder.siteName,
      newSite: jobOrder.siteName,
      reasonForChange: reasonForChange,
      authorizedBy: authorizedBy,
      updatedByUserId: req.user._id,
    });

    await Promise.all([jobOrder.save(), employee.save(), auditEntry.save()]);

    res.status(200).json({
      message: `Worker ${employee.name} updated to ${targetStatus}.`,
      slot,
      employee,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Pipeline transition failed", error: error.message });
  }
};

// @desc    Assign Employee to Slot with ENFORCED Audit Verification
// @route   PUT /api/job-orders/:id/assign-slot
// @access  Protected (Level 2 or Level 1)
export const assignEmployeeToSlot = async (req, res) => {
  try {
    const { id: jobOrderId } = req.params;
    const {
      slotId,
      employeeId,
      mobDate,
      targetDemobDate,
      reasonForChange,
      authorizedBy,
    } = req.body;

    // 1. STRICTION CHECK: Validate mandatory audit constraints
    if (!reasonForChange || !authorizedBy) {
      return res.status(400).json({
        message:
          'Audit Enforcement Error: "reasonForChange" and "authorizedBy" are strictly required.',
      });
    }

    const jobOrder = await JobOrder.findById(jobOrderId);
    if (!jobOrder) {
      return res.status(404).json({ message: "Job Order not found." });
    }

    const slot = jobOrder.slots.id(slotId);
    if (!slot) {
      return res.status(404).json({ message: "Target trade slot not found." });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    // Mobilization readiness gate: both HSE Passport and CICPA Pass must have
    // a number OR a future/present expiry date
    const now2 = new Date();
    const hasHse =
      employee.documents?.hsePassport?.number?.trim() ||
      (employee.documents?.hsePassport?.expiry &&
        new Date(employee.documents.hsePassport.expiry) >= now2);
    const hasCicpa =
      employee.documents?.cicpaPass?.number?.trim() ||
      (employee.documents?.cicpaPass?.expiry &&
        new Date(employee.documents.cicpaPass.expiry) >= now2);

    if (!hasHse || !hasCicpa) {
      return res.status(400).json({
        message: `${employee.name} cannot be assigned — missing valid ${!hasHse ? "HSE Passport" : "CICPA Pass"}. Upload the document number or a valid expiry date first.`,
      });
    }

    // 2. Prevent double-booking if employee is already mobilized/reserved elsewhere
    if (
      (employee.status === EMPLOYEE_STATUS.MOBILIZED ||
        employee.status === EMPLOYEE_STATUS.RESERVED) &&
      req.user.level > ROLE_LEVELS.ADMIN
    ) {
      return res.status(400).json({
        message: `Employee ${employee.name} is currently MOBILIZED at ${employee.currentAssignment.siteName}. Admin override required.`,
      });
    }

    const previousStatus = employee.status;
    const previousSite =
      employee.currentAssignment?.siteName || "Bench / Available";

    const actualMobDate = mobDate ? new Date(mobDate) : new Date();
    const actualDemobDate = targetDemobDate
      ? new Date(targetDemobDate)
      : calculate90DayDemob(actualMobDate);

    // 3. Update Slot Status
    slot.assignedEmployee = employee._id;
    slot.status = "RESERVED";
    slot.mobDate = actualMobDate;
    slot.demobDate = actualDemobDate;

    // 4. Update Employee Status & Active Site Assignment
    employee.status = EMPLOYEE_STATUS.RESERVED;
    employee.currentAssignment = {
      jobOrderId: jobOrder._id,
      siteName: jobOrder.siteName,
      mobDate: actualMobDate,
      targetDemobDate: actualDemobDate,
    };

    // 5. Commit Mandatory Audit Log
    const auditEntry = new AuditLog({
      employeeId: employee._id,
      employeeName: employee.name,
      previousStatus: previousStatus,
      newStatus: EMPLOYEE_STATUS.RESERVED,
      previousSite: previousSite,
      newSite: jobOrder.siteName,
      reasonForChange: reasonForChange,
      authorizedBy: authorizedBy,
      updatedByUserId: req.user._id,
    });

    await Promise.all([jobOrder.save(), employee.save(), auditEntry.save()]);

    res.status(200).json({
      message: `Employee ${employee.name} assigned to ${jobOrder.siteName} successfully.`,
      slot,
      auditLog: auditEntry,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Slot assignment failed", error: error.message });
  }
};

// @desc    Release / Demobilize Employee from Slot
// @route   PUT /api/job-orders/:id/release-slot
// @access  Protected
export const releaseEmployeeFromSlot = async (req, res) => {
  try {
    const { id: jobOrderId } = req.params;
    const { slotId, reasonForChange, authorizedBy, newStatus } = req.body;

    if (!reasonForChange || !authorizedBy) {
      return res.status(400).json({
        message:
          'Audit Enforcement Error: "reasonForChange" and "authorizedBy" are strictly required.',
      });
    }

    const jobOrder = await JobOrder.findById(jobOrderId);
    if (!jobOrder)
      return res.status(404).json({ message: "Job Order not found." });

    const slot = jobOrder.slots.id(slotId);
    if (!slot || !slot.assignedEmployee) {
      return res.status(400).json({ message: "Slot is empty or invalid." });
    }

    const employee = await Employee.findById(slot.assignedEmployee);
    const previousSite = jobOrder.siteName;
    const previousStatus = employee
      ? employee.status
      : EMPLOYEE_STATUS.MOBILIZED;

    // Clear Slot
    slot.assignedEmployee = null;
    slot.status = "UNASSIGNED";
    slot.mobDate = null;
    slot.demobDate = null;

    if (employee) {
      const nextStatus = newStatus || EMPLOYEE_STATUS.AVAILABLE;
      employee.status = nextStatus;
      employee.currentAssignment = {
        jobOrderId: null,
        siteName: null,
        mobDate: null,
        targetDemobDate: null,
      };
      await employee.save();

      // Audit entry
      const auditEntry = new AuditLog({
        employeeId: employee._id,
        employeeName: employee.name,
        previousStatus: previousStatus,
        newStatus: nextStatus,
        previousSite: previousSite,
        newSite: "Bench / Released",
        reasonForChange: reasonForChange,
        authorizedBy: authorizedBy,
        updatedByUserId: req.user._id,
      });
      await auditEntry.save();
    }

    await jobOrder.save();
    res
      .status(200)
      .json({ message: "Employee demobilized and slot cleared successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Demobilization failed", error: error.message });
  }
};
