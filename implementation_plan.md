# Phase 4: Timesheet Tracking & Operational UX Safety

## Overview

Instead of invoicing, the Finance module will track **monthly timesheets for Job Orders**, recording man-hours per trade. 

To support this, we will:
1. **Track historical dates:** Add `mobDate` and `demobDate` to the `AuditLog` schema to create a permanent record of deployment intervals (even after slots are cleared on release).
2. **Prevent accidental mobilization/demobilization:** Upgrade the frontend `AuditModal` with a high-impact **Danger Zone** layout, safety confirmation checkbox, and custom demob date pickers.
3. **Daily Timesheet Control:** Build a per-day interactive grid (days 1–31) allowing timesheet managers to toggling days on/off and enter standard/overtime hours manually.

---

## User Review Required

> [!IMPORTANT]
> **Custom Demobilization Dates:** When releasing a worker, the `release-slot` API will now accept a `demobDate` in the request body. If none is supplied, it defaults to the current date. This allows back-dating releases without corrupting history.

> [!WARNING]
> **Data Integrity:** Timesheets are generated dynamically by scanning `AuditLog` records for overlap with the target month. If historical audit logs do not contain `mobDate` and `demobDate` (which is true for pre-Phase-4 data), the generator will fall back to the audit log's `createdAt` timestamp.

---

## Proposed Changes

### 1 · Backend Data Layer Updates

#### [MODIFY] [`AuditLog.js`](file:///d:/Development/workspace/manpower-management-system/server/shared/models/AuditLog.js)
Add optional `mobDate` and `demobDate` fields to record actual physical site dates:
```js
mobDate: { type: Date },
demobDate: { type: Date },
```

#### [NEW] [`Timesheet.js`](file:///d:/Development/workspace/manpower-management-system/server/modules/finance/models/Timesheet.js)
Stores monthly per-day hours for a job order:
```js
import mongoose from "mongoose";

const timesheetSchema = new mongoose.Schema({
  jobOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "JobOrder", required: true },
  month: { type: Number, required: true }, // 1 - 12
  year: { type: Number, required: true },
  records: [
    {
      employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" }, // null if external
      employeeName: { type: String, required: true },
      trade: { type: String, required: true },
      isExternal: { type: Boolean, default: false },
      days: [
        {
          dayNumber: { type: Number, required: true }, // 1 - 31
          selected: { type: Boolean, default: true },  // toggle off for absent/off-days
          standardHours: { type: Number, default: 8 },
          overtimeHours: { type: Number, default: 0 },
        }
      ]
    }
  ],
  status: { type: String, enum: ["DRAFT", "SUBMITTED", "APPROVED"], default: "DRAFT" },
  approvedBy: { type: String }
}, { timestamps: true });

export default mongoose.model("Timesheet", timesheetSchema);
```

---

### 2 · Backend Operations Controller Updates

#### [MODIFY] [`jobOrderController.js`](file:///d:/Development/workspace/manpower-management-system/server/modules/operations/controllers/jobOrderController.js)

* **`assignEmployeeToSlot`:** Save the resolved `actualMobDate` and `actualDemobDate` into the created `AuditLog`.
* **`releaseEmployeeFromSlot`:** 
  * Accept `demobDate` in the request body.
  * Save `slot.mobDate` and the custom/resolved `demobDate` into the `AuditLog` entry before clearing the slot.

---

### 3 · Backend Finance Module (New Endpoints)

#### [NEW] [`timesheetController.js`](file:///d:/Development/workspace/manpower-management-system/server/modules/finance/controllers/timesheetController.js)
* `getTimesheet(jobOrderId, month, year)`:
  * Check if a saved `Timesheet` exists. If yes, return it.
  * If no, scan `AuditLog` entries to find all workers active on the site during the target month.
  * Calculate active days per worker and generate a `DRAFT` timesheet pre-populated with standard 8-hour workdays.
* `saveTimesheet(req.body)`: Upsert draft timesheet document.
* `approveTimesheet(id)`: Transition status to `APPROVED` and record `approvedBy`.

#### [NEW] [`timesheetRoutes.js`](file:///d:/Development/workspace/manpower-management-system/server/modules/finance/routes/timesheetRoutes.js)
Define GET, POST, and PUT endpoints for timesheets protected by `requireModuleLevel('finance', 1)`.

#### [MODIFY] [`server.js`](file:///d:/Development/workspace/manpower-management-system/server/server.js)
Mount the timesheet routes:
```js
import timesheetRoutes from "./modules/finance/routes/timesheetRoutes.js";
app.use("/api/finance/timesheets", timesheetRoutes);
```

---

### 4 · Frontend Operations UX Upgrades

#### [MODIFY] [`AuditModal.jsx`](file:///d:/Development/workspace/manpower-management-system/client/src/components/modals/AuditModal.jsx)

* **Danger styling on release:** If `action.type === 'release'`, apply a red border, warning icon, and custom header.
* **Safety Confirmation Checkbox (Idea A):**
  * Render checkbox: `[ ] I confirm that this worker has physically completed/departed their assignment at this site.`
  * Disable the "Save Change" button until checked.
* **Actual Demob Date picker (Idea B):**
  * Render an input field for **Actual Demobilization Date** (defaults to today).
  * Validate that the selected demob date is not before the original mobilization date.

---

### 5 · Frontend Finance Pages (Module Boundary)

#### [NEW] [`finance.api.js`](file:///d:/Development/workspace/manpower-management-system/client/src/api/finance.api.js)
Add axios calls: `getTimesheet`, `saveTimesheet`, `approveTimesheet`. Re-export in `services.js`.

#### [NEW] [`FinanceRoutes.jsx`](file:///d:/Development/workspace/manpower-management-system/client/src/modules/finance/FinanceRoutes.jsx)
Isolated router mapping `/finance` routes (using `React.lazy()` from `App.jsx`). Shows its own menu and pages.

#### [NEW] [`TimesheetsPage.jsx`](file:///d:/Development/workspace/manpower-management-system/client/src/modules/finance/pages/TimesheetsPage.jsx)
The core timesheet tracking screen:
* **Dropdown Filters:** Choose Job Order, Month, and Year.
* **Interactive Day Grid:** A table showing employees as rows, and calendar days (1–31) as columns.
  * Clicking a day number at the top selects/de-selects the entire column.
  * Tapping a cell toggles whether the worker was present.
  * Small inputs inside cells allow custom Standard and Overtime hours.
* **Aggregated Summaries:** Live calculations of total hours worked per trade for the month.

---

## Verification Plan

### Automated Tests
* Validate all code with `node --check` after completion.

### Manual Verification
1. **Accidental release test:** Try to release a worker. Confirm you cannot submit until the safety checkbox is checked. Change the demob date to yesterday, hit save, and verify in the MongoDB AuditLog that the customized `demobDate` is stored.
2. **Timesheet generation:** Mobilize a worker for 10 days in August. Navigate to Finance → Timesheets, select August. Verify they appear in the grid with only those 10 days marked as active by default.
3. **Manual Override:** Deselect day 15 for a worker, add 4 hours of overtime on day 16. Save and reload the page to confirm edits persist.
