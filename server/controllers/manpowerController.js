import xlsx from "xlsx";
import { EMPLOYEE_STATUS } from "../config/constants.js";
import Employee from "../models/Employee.js";
import Specialization from "../models/Specialization.js";
import parseDate from "../utils/parseDate.js";

// Validate specialization against active list for the given trade.
// Returns the canonical name on match, null if blank, or throws a string error.
async function resolveSpecialization(raw, trade) {
  if (!raw || !String(raw).trim()) return null;
  const normalized = String(raw).trim().toLowerCase();
  const found = await Specialization.findOne({
    nameLower: normalized,
    trade,
    active: true,
  });
  if (!found)
    throw `"${String(raw).trim()}" is not a recognized specialization for trade "${trade}". Add it to the specialization list first.`;
  return found.name;
}

// @desc    Get all manpower with multi-trade, status & training compliance filters
// @route   GET /api/manpower
// @access  Protected
export const getEmployees = async (req, res) => {
  try {
    const { trade, status, compliance, search } = req.query;
    let query = {};

    // 1. Search Query Filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
        { emiratesId: { $regex: search, $options: "i" } },
      ];
    }

    // 2. Trade Filter
    if (trade) {
      const tradesArray = trade.split(",").map((t) => t.trim());
      query.trade = { $in: tradesArray };
    }

    // 3. Deployment Status Filter (Using UPPERCASE Enums)
    if (status) {
      query.status = status.toUpperCase();
    }

    // 4. Training Compliance Filter Engine
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    if (compliance === "EXPIRED") {
      // At least one clearance date is in the past
      query.$or = [
        { "trainings.h2sExpiry": { $lt: now } },
        { "trainings.seaSurvivalExpiry": { $lt: now } },
        { "trainings.medicalExpiry": { $lt: now } },
        { "trainings.adnocInductionExpiry": { $lt: now } },
      ];
    } else if (compliance === "EXPIRING_SOON") {
      // Clearance expiring within 30 days
      query.$or = [
        { "trainings.h2sExpiry": { $gte: now, $lte: thirtyDaysFromNow } },
        {
          "trainings.seaSurvivalExpiry": { $gte: now, $lte: thirtyDaysFromNow },
        },
        { "trainings.medicalExpiry": { $gte: now, $lte: thirtyDaysFromNow } },
        {
          "trainings.adnocInductionExpiry": {
            $gte: now,
            $lte: thirtyDaysFromNow,
          },
        },
      ];
    } else if (compliance === "INCOMPLETE") {
      // Missing recorded training dates
      query.$or = [
        { "trainings.h2sExpiry": null },
        { "trainings.seaSurvivalExpiry": null },
        { "trainings.medicalExpiry": null },
        { "trainings.adnocInductionExpiry": null },
      ];
    } else if (compliance === "READY") {
      // All clearances valid beyond 30 days
      query["trainings.h2sExpiry"] = { $gt: thirtyDaysFromNow };
      query["trainings.medicalExpiry"] = { $gt: thirtyDaysFromNow };
    }

    const employees = await Employee.find(query).sort({ name: 1 });

    // Calculate Summary Counter Metadata
    const allEmployees = await Employee.find({});
    const summary = {
      total: allEmployees.length,
      available: allEmployees.filter(
        (e) => e.status === EMPLOYEE_STATUS.AVAILABLE,
      ).length,
      booked: allEmployees.filter((e) => e.status === EMPLOYEE_STATUS.BOOKED)
        .length,
      mobilized: allEmployees.filter(
        (e) => e.status === EMPLOYEE_STATUS.MOBILIZED,
      ).length,
      reserved: allEmployees.filter(
        (e) => e.status === EMPLOYEE_STATUS.RESERVED,
      ).length,
      expiredTrainings: allEmployees.filter((e) => {
        const t = e.trainings || {};
        return (
          (t.h2sExpiry && new Date(t.h2sExpiry) < now) ||
          (t.seaSurvivalExpiry && new Date(t.seaSurvivalExpiry) < now) ||
          (t.medicalExpiry && new Date(t.medicalExpiry) < now)
        );
      }).length,
    };

    res.status(200).json({ summary, employees });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching employees", error: error.message });
  }
};

// @desc    Create single new employee record
// @route   POST /api/manpower
// @access  Protected (Level 2 or higher)
export const createEmployee = async (req, res) => {
  try {
    const { employeeId, emiratesId, specialization, trade } = req.body;

    // Check duplicates
    const orConditions = [{ employeeId }];
    if (emiratesId) orConditions.push({ emiratesId });
    const existingEmp = await Employee.findOne({ $or: orConditions });

    if (existingEmp) {
      return res
        .status(400)
        .json({ message: "Employee ID or Emirates ID already exists." });
    }

    let resolvedSpec;
    try {
      resolvedSpec = await resolveSpecialization(specialization, trade);
    } catch (msg) {
      return res.status(400).json({ message: msg });
    }

    const newEmployee = new Employee({
      ...req.body,
      specialization: resolvedSpec,
    });
    await newEmployee.save();

    res
      .status(201)
      .json({ message: "Employee created successfully", data: newEmployee });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create employee", error: error.message });
  }
};

// @desc    Bulk Import & Clean Legacy Excel Data
// @route   POST /api/manpower/import
// @access  Protected (Level 1 Admin Only)
export const importEmployeesFromExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload an Excel file." });
    }

    // 1. Parse Excel buffer
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const rawRows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
      raw: false,
    });

    if (!rawRows || rawRows.length === 0) {
      return res
        .status(400)
        .json({ message: "Uploaded Excel sheet is empty." });
    }

    // Load all active specializations once for batch lookup
    const allSpecs = await Specialization.find({ active: true });
    const specMap = new Map(allSpecs.map((s) => [s.nameLower, s]));

    // 2. Map and sanitize Excel rows
    let processedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const [i, row] of rawRows.entries()) {
      const rowNum = i + 2;
      const empId = row["Employee ID"] || row["EMP_ID"] || row["EmployeeNo"];
      const name = row["Full Name"] || row["Name"] || row["Employee Name"];
      const rawTrade = String(
        row["Trade"] || row["Designation"] || "Other",
      ).trim();

      if (!empId || !name) {
        skippedCount++;
        continue;
      }

      // Validate trade against enum
      if (!TRADES.includes(rawTrade)) {
        errors.push(
          `Row ${rowNum} (${empId}): "${rawTrade}" is not a valid trade — must be one of: ${TRADES.join(", ")}`,
        );
        continue;
      }

      // Resolve specialization
      let resolvedSpec = null;
      const rawSpec = row["Specialization"]
        ? String(row["Specialization"]).trim()
        : "";
      if (rawSpec) {
        const specEntry = specMap.get(rawSpec.toLowerCase());
        if (!specEntry || specEntry.trade !== rawTrade) {
          errors.push(
            `Row ${rowNum} (${empId}): "${rawSpec}" is not a recognized specialization for trade "${rawTrade}". Add it to the specialization list first.`,
          );
          continue;
        }
        resolvedSpec = specEntry.name;
      }

      const employeeDoc = {
        employeeId: String(empId).trim(),
        name: String(name).trim(),
        trade: rawTrade,
        specialization: resolvedSpec,
        dob: parseDate(row["DOB"] || row["Date of Birth"]),
        emiratesId: row["Emirates ID"]
          ? String(row["Emirates ID"]).trim()
          : undefined,
        passportNumber: row["Passport Number"]
          ? String(row["Passport Number"]).trim()
          : undefined,
        trainings: {
          adnocInductionExpiry: parseDate(row["ADNOC Induction Expiry"]),
          h2sExpiry: parseDate(row["H2S Training Expiry"] || row["H2S Expiry"]),
          medicalExpiry: parseDate(row["Medical Expiry"]),
          seaSurvivalExpiry: parseDate(row["Sea Survival Expiry"]),
        },
        documents: {
          hsePassport: {
            number:
              row["HSE Passport Number"] || row["HSE Passport No"] || null,
            expiry: parseDate(row["HSE Passport Expiry"]),
          },
          cicpaPass: {
            number:
              row["CICPA Number"] ||
              row["CICPA Pass No"] ||
              row["CICPA No"] ||
              null,
            expiry: parseDate(row["CICPA Expiry"] || row["CICPA Pass Expiry"]),
          },
        },
        status: EMPLOYEE_STATUS.AVAILABLE,
      };

      // Perform Upsert (Insert if new, update basic info if existing)
      const setFields = {};
      for (const [key, val] of Object.entries(employeeDoc)) {
        if (key === "trainings") {
          for (const [tKey, tVal] of Object.entries(val)) {
            if (tVal != null) setFields[`trainings.${tKey}`] = tVal;
          }
        } else if (key === "documents") {
          for (const [docKey, docVal] of Object.entries(val)) {
            for (const [subKey, subVal] of Object.entries(docVal)) {
              if (subVal != null)
                setFields[`documents.${docKey}.${subKey}`] = subVal;
            }
          }
        } else if (val != null) {
          setFields[key] = val;
        }
      }

      try {
        await Employee.findOneAndUpdate(
          { employeeId: employeeDoc.employeeId },
          { $set: setFields },
          { upsert: true, runValidators: true, setDefaultsOnInsert: true },
        );
        processedCount++;
      } catch (saveErr) {
        errors.push(`Row ${rowNum} (${empId}): ${saveErr.message}`);
      }
    }

    res.status(200).json({
      message: "Bulk import completed.",
      processedCount,
      skippedCount,
      errors,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Excel import failed", error: error.message });
  }
};

// @desc    Update employee record (all fields except employeeId)
// @route   PUT /api/manpower/:id
// @access  Protected (Level 2 or higher)
export const updateEmployee = async (req, res) => {
  try {
    const { employeeId, specialization, trade, ...updateData } = req.body; // strip employeeId from updates

    // Resolve trade: use provided value or fall back to the stored value
    const targetTrade =
      trade ?? (await Employee.findById(req.params.id).select("trade"))?.trade;

    let resolvedSpec;
    try {
      resolvedSpec = await resolveSpecialization(specialization, targetTrade);
    } catch (msg) {
      return res.status(400).json({ message: msg });
    }

    const payload = { ...updateData };
    if (trade) payload.trade = trade;
    // Always write specialization (null clears it)
    payload.specialization = resolvedSpec;

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true },
    );
    if (!employee)
      return res.status(404).json({ message: "Employee not found." });
    res
      .status(200)
      .json({ message: "Employee updated successfully.", data: employee });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update employee", error: error.message });
  }
};

// @desc    Delete employee record
// @route   DELETE /api/manpower/:id
// @access  Protected (Level 1 Admin only)
export const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee)
      return res.status(404).json({ message: "Employee not found." });
    res
      .status(200)
      .json({ message: `Employee ${employee.name} deleted successfully.` });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete employee", error: error.message });
  }
};
