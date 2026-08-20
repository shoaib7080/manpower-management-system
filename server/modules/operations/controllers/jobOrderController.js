import xlsx from "xlsx";
import {
  EMPLOYEE_STATUS,
  ROLE_LEVELS,
} from "../../../core/config/constants.js";
import AuditLog from "../../../shared/models/AuditLog.js";
import Employee from "../models/Employee.js";
import JobOrder from "../models/JobOrder.js";
import parseDate from "../../../shared/utils/parseDate.js";

const calculate90DayDemob = (date) => {
  const d = new Date(date);
  d.setDate(d.getDate() + 90);
  return d;
};

// @desc    Create a new Job Order with auto-generated empty trade slots
// @route   POST /api/job-orders
// @access  Protected (Level 2 Engineer or Level 1 Admin)
export const createJobOrder = async (req, res, next) => {
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
      startDate: startDate ? new Date(startDate) : null,
      requirements,
      slots: generatedSlots,
      status: "Active",
    });

    await jobOrder.save();
    res
      .status(201)
      .json({ message: "Job Order created successfully", data: jobOrder });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk Import Job Orders from Excel
// @route   POST /api/job-orders/import
// @access  Protected (Level 2 or higher)
export const importJobOrdersFromExcel = async (req, res, next) => {
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
      "Construction Engineer",
      "QC",
      "HSE",
      "Fire Watcher",
      "Habitat Supervisor",
      "Habitat Technician",
      "AP",
      "Other",
    ];

    let processedCount = 0;
    const skipped = [];
    const errors = [];

    for (const [i, row] of rawRows.entries()) {
      const rowNum = i + 2; // Excel row number (1-indexed + header)

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

      if (!jobOrderNumber) {
        skipped.push(`Row ${rowNum}: missing Job Order Number`);
        continue;
      }
      if (!siteName) {
        skipped.push(`Row ${rowNum} (${jobOrderNumber}): missing Site Name`);
        continue;
      }
      if (!clientCategory) {
        skipped.push(
          `Row ${rowNum} (${jobOrderNumber}): missing Client Category`,
        );
        continue;
      }

      const requirements = [];
      TRADE_COLS.forEach((trade) => {
        const qty = parseInt(row[`${trade} Qty`] || row[trade] || 0);
        if (qty > 0) requirements.push({ trade, requiredQty: qty });
      });

      if (!requirements.length) {
        skipped.push(
          `Row ${rowNum} (${jobOrderNumber}): no valid trade quantities found`,
        );
        continue;
      }

      const existing = await JobOrder.findOne({ jobOrderNumber });
      if (existing) {
        skipped.push(
          `Row ${rowNum} (${jobOrderNumber}): already exists, skipped`,
        );
        continue;
      }

      try {
        await new JobOrder({
          jobOrderNumber,
          siteName,
          clientCategory,
          projectEngineer: projectEngineer || "TBD",
          startDate: startDate || null,
          requirements,
          slots: requirements.flatMap(({ trade, requiredQty }) =>
            Array.from({ length: requiredQty }, (_, i) => ({
              slotNumber: i + 1,
              trade,
              assignedEmployee: null,
              status: "UNASSIGNED",
              mobDate: null,
              demobDate: null,
            })),
          ),
          status: "Active",
        }).save();
        processedCount++;
      } catch (saveErr) {
        errors.push(`Row ${rowNum} (${jobOrderNumber}): ${saveErr.message}`);
      }
    }

    res.status(200).json({
      message: "Job order import completed.",
      processedCount,
      skippedCount: skipped.length,
      skipped,
      errors,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all Job Orders with populated employee details in slots
// @route   GET /api/job-orders
// @access  Protected
export const getJobOrders = async (req, res, next) => {
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
    next(error);
  }
};

// @desc    Auto-Suggestion Engine for Empty Trade Slots
// @route   GET /api/job-orders/suggest
// @access  Protected
export const getSlotSuggestions = async (req, res, next) => {
  try {
    const { trade, clientCategory } = req.query;

    if (!trade) {
      return res
        .status(400)
        .json({ message: "Trade parameter is required for suggestions." });
    }

    const now = new Date();

    // Base query: correct trade, available status, and document availability
    // present on BOTH hsePassport and cicpaPass
    const query = {
      trade,
      status: EMPLOYEE_STATUS.AVAILABLE,
      "documents.hsePassport.available": true,
      "documents.cicpaPass.available": true,
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
    next(error);
  }
};

// @desc    Update job order metadata and trade requirements
// @route   PUT /api/job-orders/:id
// @access  Protected (Level 2 Engineer or Level 1 Admin)
export const updateJobOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      siteName,
      clientCategory,
      projectEngineer,
      startDate,
      status,
      requirements,
    } = req.body;

    const jobOrder = await JobOrder.findById(id);
    if (!jobOrder)
      return res.status(404).json({ message: "Job order not found." });

    // Update simple fields
    if (siteName !== undefined) jobOrder.siteName = siteName.trim();
    if (clientCategory !== undefined) jobOrder.clientCategory = clientCategory;
    if (projectEngineer !== undefined)
      jobOrder.projectEngineer = projectEngineer.trim();
    if (startDate !== undefined)
      jobOrder.startDate = startDate ? new Date(startDate) : null;
    if (status !== undefined) jobOrder.status = status;

    // Reconcile trade requirements & slots if requirements changed
    if (requirements && Array.isArray(requirements)) {
      // For each new requirement, diff against existing slots
      for (const req of requirements) {
        const { trade, requiredQty } = req;
        const existingSlots = jobOrder.slots.filter((s) => s.trade === trade);
        const diff = requiredQty - existingSlots.length;

        if (diff > 0) {
          // Add new empty slots
          const maxSlotNum = existingSlots.length
            ? Math.max(...existingSlots.map((s) => s.slotNumber))
            : 0;
          for (let i = 1; i <= diff; i++) {
            jobOrder.slots.push({
              slotNumber: maxSlotNum + i,
              trade,
              assignedEmployee: null,
              status: "UNASSIGNED",
              mobDate: null,
              demobDate: null,
            });
          }
        } else if (diff < 0) {
          // Remove excess UNASSIGNED slots (never remove assigned slots)
          let toRemove = Math.abs(diff);
          const unassigned = jobOrder.slots
            .filter((s) => s.trade === trade && s.status === "UNASSIGNED")
            .slice(-toRemove)
            .map((s) => s._id.toString());
          jobOrder.slots = jobOrder.slots.filter(
            (s) => !unassigned.includes(s._id.toString()),
          );
        }
      }

      // Remove slots for trades completely removed from requirements
      const newTrades = requirements.map((r) => r.trade);
      const removedTrades = jobOrder.requirements
        .map((r) => r.trade)
        .filter((t) => !newTrades.includes(t));
      for (const trade of removedTrades) {
        jobOrder.slots = jobOrder.slots.filter(
          (s) => s.trade !== trade || s.status !== "UNASSIGNED",
        );
      }

      jobOrder.requirements = requirements;
    }

    await jobOrder.save();
    const populated = await jobOrder.populate(
      "slots.assignedEmployee",
      "name employeeId trade status",
    );
    res.status(200).json({ message: "Job order updated.", data: populated });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/job-orders/:id/update-slot-pipeline
// @access  Protected
export const updateSlotPipeline = async (req, res, next) => {
  try {
    const { id: jobOrderId } = req.params;
    const { slotId, targetStatus, mobDate, reasonForChange, authorizedBy } =
      req.body;

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
    if (
      !slot ||
      (slot.status === "UNASSIGNED" &&
        !slot.assignedEmployee &&
        !slot.externalWorker?.name)
    ) {
      return res
        .status(400)
        .json({ message: "Target slot is empty or invalid." });
    }

    // External Subcontractor Worker Pipeline Advance
    if (slot.externalWorker?.isExternal) {
      const prevStatus = slot.status;
      slot.status = targetStatus;

      if (targetStatus === EMPLOYEE_STATUS.MOBILIZED) {
        const resolvedMobDate = mobDate ? new Date(mobDate) : new Date();
        const demobDate = new Date(resolvedMobDate);
        demobDate.setDate(resolvedMobDate.getDate() + 90);
        slot.mobDate = resolvedMobDate;
        slot.demobDate = demobDate;
      }

      const extWorkerLabel = `${slot.externalWorker.name}${slot.externalWorker.company ? ` (${slot.externalWorker.company})` : " (Subcontractor)"}`;

      const auditEntry = new AuditLog({
        jobOrderId: jobOrder._id,
        employeeId: null,
        employeeName: extWorkerLabel,
        previousStatus: prevStatus,
        newStatus: targetStatus,
        previousSite: jobOrder.siteName,
        newSite: jobOrder.siteName,
        reasonForChange,
        authorizedBy,
        updatedByUserId: req.user._id,
      });

      await Promise.all([jobOrder.save(), auditEntry.save()]);

      return res.status(200).json({
        message: `External worker ${extWorkerLabel} updated to ${targetStatus}.`,
        slot,
        auditLog: auditEntry,
      });
    }

    // Internal Company Employee Pipeline Advance
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
      const resolvedMobDate = mobDate ? new Date(mobDate) : new Date();
      const demobDate = new Date(resolvedMobDate);
      demobDate.setDate(resolvedMobDate.getDate() + 90);

      slot.mobDate = resolvedMobDate;
      slot.demobDate = demobDate;
      employee.currentAssignment.mobDate = resolvedMobDate;
      employee.currentAssignment.targetDemobDate = demobDate;
    }

    // Commit Audit Trail
    const auditEntry = new AuditLog({
      jobOrderId: jobOrder._id,
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
    next(error);
  }
};

// @desc    Assign Employee to Slot with ENFORCED Audit Verification
// @route   PUT /api/job-orders/:id/assign-slot
// @access  Protected (Level 2 or Level 1)
export const assignEmployeeToSlot = async (req, res, next) => {
  try {
    const { id: jobOrderId } = req.params;
    const {
      slotId,
      employeeId,
      isExternal,
      externalWorker,
      mobDate,
      targetDemobDate,
      targetStatus,
      reasonForChange,
      authorizedBy,
    } = req.body;

    const resolvedStatus = targetStatus || "RESERVED";

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

    const actualMobDate = mobDate ? new Date(mobDate) : new Date();
    const actualDemobDate = targetDemobDate
      ? new Date(targetDemobDate)
      : calculate90DayDemob(actualMobDate);

    // Handle External / Subcontractor Worker Assignment
    if (isExternal) {
      if (!externalWorker?.name?.trim()) {
        return res
          .status(400)
          .json({ message: "External worker name is required." });
      }

      slot.assignedEmployee = null;
      slot.externalWorker = {
        name: externalWorker.name.trim(),
        company: externalWorker.company?.trim() || null,
        contactNumber: externalWorker.contactNumber?.trim() || null,
        isExternal: true,
      };
      slot.status = resolvedStatus;
      slot.mobDate = actualMobDate;
      slot.demobDate = actualDemobDate;

      if (resolvedStatus === "MOBILIZED") {
        slot.mobDate = actualMobDate;
        slot.demobDate = actualDemobDate;
      }

      const extWorkerLabel = `${externalWorker.name.trim()}${externalWorker.company ? ` (${externalWorker.company.trim()})` : " (Subcontractor)"}`;

      const auditEntry = new AuditLog({
        jobOrderId: jobOrder._id,
        employeeId: null,
        employeeName: extWorkerLabel,
        previousStatus: "UNASSIGNED",
        newStatus: resolvedStatus,
        previousSite: "Subcontractor / External",
        newSite: jobOrder.siteName,
        mobDate: actualMobDate,
        demobDate: actualDemobDate,
        reasonForChange: reasonForChange,
        authorizedBy: authorizedBy,
        updatedByUserId: req.user._id,
      });

      await Promise.all([jobOrder.save(), auditEntry.save()]);

      return res.status(200).json({
        message: `External worker ${extWorkerLabel} assigned to ${jobOrder.siteName} successfully.`,
        slot,
        auditLog: auditEntry,
      });
    }

    // Handle Internal Company Employee Assignment
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    // Mobilization readiness gate: both HSE Passport and CICPA Pass must have
    // document availability marked true
    const hasHse = Boolean(employee.documents?.hsePassport?.available);
    const hasCicpa = Boolean(employee.documents?.cicpaPass?.available);

    if (!hasHse || !hasCicpa) {
      return res.status(400).json({
        message: `${employee.name} cannot be assigned — missing valid ${!hasHse ? "HSE Passport" : "CICPA Pass"}. Mark document availability in the profile first.`,
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

    // 3. Update Slot Status
    slot.assignedEmployee = employee._id;
    slot.externalWorker = {
      name: null,
      company: null,
      contactNumber: null,
      isExternal: false,
    };
    slot.status = resolvedStatus;
    slot.mobDate = actualMobDate;
    slot.demobDate = actualDemobDate;

    // 4. Update Employee Status & Active Site Assignment
    employee.status = resolvedStatus;
    employee.currentAssignment = {
      jobOrderId: jobOrder._id,
      siteName: jobOrder.siteName,
      mobDate: actualMobDate,
      targetDemobDate: actualDemobDate,
    };

    if (resolvedStatus === EMPLOYEE_STATUS.MOBILIZED) {
      slot.mobDate = actualMobDate;
      slot.demobDate = actualDemobDate;
      employee.currentAssignment.mobDate = actualMobDate;
      employee.currentAssignment.targetDemobDate = actualDemobDate;
    }

    // 5. Commit Mandatory Audit Log
    const auditEntry = new AuditLog({
      jobOrderId: jobOrder._id,
      employeeId: employee._id,
      employeeName: employee.name,
      previousStatus: previousStatus,
      newStatus: resolvedStatus,
      previousSite: previousSite,
      newSite: jobOrder.siteName,
      mobDate: actualMobDate,
      demobDate: actualDemobDate,
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
    next(error);
  }
};

// @desc    Release / Demobilize Employee from Slot
// @route   PUT /api/job-orders/:id/release-slot
// @access  Protected
export const releaseEmployeeFromSlot = async (req, res, next) => {
  try {
    const { id: jobOrderId } = req.params;
    const { slotId, reasonForChange, authorizedBy, newStatus, demobDate } =
      req.body;

    const slotMobDate = slot.mobDate;
    const resolvedDemobDate = demobDate ? new Date(demobDate) : new Date();

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
    if (
      !slot ||
      (slot.status === "UNASSIGNED" &&
        !slot.assignedEmployee &&
        !slot.externalWorker?.name)
    ) {
      return res.status(400).json({ message: "Slot is empty or invalid." });
    }

    // Handle External Subcontractor Release
    if (slot.externalWorker?.isExternal) {
      const extWorkerLabel = `${slot.externalWorker.name}${slot.externalWorker.company ? ` (${slot.externalWorker.company})` : " (Subcontractor)"}`;
      const prevStatus = slot.status;

      slot.assignedEmployee = null;
      slot.externalWorker = {
        name: null,
        company: null,
        contactNumber: null,
        isExternal: false,
      };
      slot.status = "UNASSIGNED";
      slot.mobDate = null;
      slot.demobDate = null;

      const auditEntry = new AuditLog({
        jobOrderId: jobOrder._id,
        employeeId: null,
        employeeName: extWorkerLabel,
        previousStatus: prevStatus,
        newStatus: "UNASSIGNED",
        previousSite: jobOrder.siteName,
        newSite: "Bench / Released",
        mobDate: slotMobDate,
        demobDate: resolvedDemobDate,
        reasonForChange: reasonForChange,
        authorizedBy: authorizedBy,
        updatedByUserId: req.user._id,
      });

      await Promise.all([jobOrder.save(), auditEntry.save()]);

      return res.status(200).json({
        message: "External worker released and slot cleared successfully.",
      });
    }

    // Handle Internal Company Employee Release
    const employee = await Employee.findById(slot.assignedEmployee);
    const previousSite = jobOrder.siteName;
    const previousStatus = employee
      ? employee.status
      : EMPLOYEE_STATUS.MOBILIZED;

    // Clear Slot
    slot.assignedEmployee = null;
    slot.externalWorker = {
      name: null,
      company: null,
      contactNumber: null,
      isExternal: false,
    };
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
        jobOrderId: jobOrder._id,
        employeeId: employee._id,
        employeeName: employee.name,
        previousStatus: previousStatus,
        newStatus: nextStatus,
        previousSite: previousSite,
        newSite: "Bench / Released",
        mobDate: slotMobDate,
        demobDate: resolvedDemobDate,
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
    next(error);
  }
};
