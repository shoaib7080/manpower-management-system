import xlsx from 'xlsx';
import Employee from '../models/Employee.js';
import { EMPLOYEE_STATUS } from '../config/constants.js';

// Helper function to safely parse Excel serial dates or string dates
const parseExcelDate = (excelValue) => {
  if (!excelValue) return null;
  if (typeof excelValue === 'number') {
    // Convert Excel serial number to JS Date
    return new Date(Math.round((excelValue - 25569) * 86400 * 1000));
  }
  const parsedDate = new Date(excelValue);
  return isNaN(parsedDate.getTime()) ? null : parsedDate;
};

// @desc    Get all manpower with multi-role filters & training status flags
// @route   GET /api/manpower
// @access  Protected
export const getEmployees = async (req, res) => {
  try {
    const { trade, status, search } = req.query;
    let query = {};

    // Multi-role filtering
    if (trade) {
      const tradesArray = trade.split(',').map(t => t.trim());
      query.trade = { $in: tradesArray };
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { emiratesId: { $regex: search, $options: 'i' } }
      ];
    }

    const employees = await Employee.find(query).sort({ name: 1 });
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employees', error: error.message });
  }
};

// @desc    Create single new employee record
// @route   POST /api/manpower
// @access  Protected (Level 2 or higher)
export const createEmployee = async (req, res) => {
  try {
    const { employeeId, emiratesId } = req.body;

    // Check duplicates
    const existingEmp = await Employee.findOne({ 
      $or: [{ employeeId }, { emiratesId: emiratesId || 'N/A' }] 
    });

    if (existingEmp) {
      return res.status(400).json({ message: 'Employee ID or Emirates ID already exists.' });
    }

    const newEmployee = new Employee(req.body);
    await newEmployee.save();

    res.status(201).json({ message: 'Employee created successfully', data: newEmployee });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create employee', error: error.message });
  }
};

// @desc    Bulk Import & Clean Legacy Excel Data
// @route   POST /api/manpower/import
// @access  Protected (Level 1 Admin Only)
export const importEmployeesFromExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an Excel file.' });
    }

    // 1. Parse Excel buffer
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rawRows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!rawRows || rawRows.length === 0) {
      return res.status(400).json({ message: 'Uploaded Excel sheet is empty.' });
    }

    // 2. Map and sanitize Excel rows
    const bulkOperations = [];
    let skippedCount = 0;

    for (const row of rawRows) {
      const empId = row['Employee ID'] || row['EMP_ID'] || row['EmployeeNo'];
      const name = row['Full Name'] || row['Name'] || row['Employee Name'];
      const trade = row['Trade'] || row['Designation'] || 'Other';

      if (!empId || !name) {
        skippedCount++;
        continue;
      }

      // Default unverified legacy site statuses to AVAILABLE for quick cleanup
      const sanitizedStatus = EMPLOYEE_STATUS.AVAILABLE;

      const employeeDoc = {
        employeeId: String(empId).trim(),
        name: String(name).trim(),
        trade: String(trade).trim(),
        dob: parseExcelDate(row['DOB'] || row['Date of Birth']),
        emiratesId: row['Emirates ID'] ? String(row['Emirates ID']).trim() : undefined,
        passportNumber: row['Passport Number'] ? String(row['Passport Number']).trim() : undefined,
        trainings: {
          adnocInductionExpiry: parseExcelDate(row['ADNOC Induction Expiry']),
          h2sExpiry: parseExcelDate(row['H2S Training Expiry'] || row['H2S Expiry']),
          medicalExpiry: parseExcelDate(row['Medical Expiry']),
          seaSurvivalExpiry: parseExcelDate(row['Sea Survival Expiry'])
        },
        status: sanitizedStatus
      };

      // Perform Upsert (Insert if new, update basic info if existing)
      bulkOperations.push({
        updateOne: {
          filter: { employeeId: employeeDoc.employeeId },
          update: { $set: employeeDoc },
          upsert: true
        }
      });
    }

    if (bulkOperations.length > 0) {
      await Employee.bulkWrite(bulkOperations);
    }

    res.status(200).json({
      message: 'Bulk import completed successfully.',
      processedCount: bulkOperations.length,
      skippedCount: skippedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Excel import failed', error: error.message });
  }
};
