# PRD — Manpower Management System

## 1. What this is

An internal workforce-deployment and operations ERP for an EPC contractor
operating in the UAE Oil & Gas sector (ADNOC-group scopes, CICPA-controlled
sites). It replaces spreadsheet-based tracking of who is deployed where,
with a system that enforces two things Excel never could: **no double-booking
a worker**, and **no status change without a recorded reason and authorizer**.

## 2. Problem it solves

Before this system, worker deployment was tracked in Excel. That made it
possible to reassign someone who was already committed elsewhere, with no
record of who approved the change or why. The core product requirement,
underneath every feature, is: **every change to where a worker is deployed
must be deliberate, checked against their current commitment, and logged.**

## 3. Users

Users have a per-module permission matrix rather than a single global role
level. Each module (`operations`, `finance`) has an independent access level
(0–3), plus a `superAdmin` flag that bypasses all module checks.

| Permission | Level | Can do |
|---|---|---|
| `superAdmin: true` | — | Everything; bypasses all module checks; manages user accounts |
| `operations: 3` | Module Admin | Create/deactivate trades, specializations, staff; all operator actions |
| `operations: 2` | Operator | Assign slots, create/edit employees and job orders, manage deployments |
| `operations: 1` | Viewer | Read-only access to all operations data |
| `finance: 3` | Finance Admin | Approve timesheets, all finance operator actions |
| `finance: 2` | Finance Operator | Create and edit timesheets |
| `finance: 1` | Finance Viewer | Read-only access to timesheets |
| `operations: 0` / `finance: 0` | No access | Module not visible to the user |

A user can have different levels across modules — e.g. operations viewer +
finance operator is a valid combination.

## 4. Core entities

- **Employee** — a worker: identity, trade, specialization, compliance
  documents (HSE Passport, CICPA Pass), safety trainings (ADNOC Induction,
  H2S, Medical, Sea Survival — each with an expiry), current status and
  current assignment. The 90-day demob window is tracked per-employee
  (`currentAssignment.targetDemobDate`), not per-job-order.
- **Job Order** — a site request: client category (ADNOC Onshore / ADNOC
  Offshore / Internal Production / Other), optional start date, requirements
  by trade, and a set of individual **Slots** (one per seat to be filled),
  each with its own status, mob date, and demob date.
- **Trade** — an admin-managed DB collection of valid trade names. Seeded on
  first boot, editable via the Trades admin page without a code deploy.
  Every employee and job order slot references a trade from this list.
- **Specialization** — an admin-managed refinement of a worker's trade
  (e.g. "E&I" under Technician + Foreman). Linked to one or more trades via
  `trades: [String]`. Descriptive only — never used to match a worker to a slot.
- **Staff** — an admin-managed lookup of authorized personnel (name +
  designation) used in the audit "Authorized By" field. Separate from User
  accounts — these are the people who authorize deployment decisions, not
  necessarily system users.
- **Audit Log** — an immutable record of every status change: who, when,
  from what status/site to what, plus a required reason and authorizer.
- **Timesheet** — a per-job-order, per-month record of deployed employees
  with daily standard and overtime hours. Moves through an approval pipeline
  (`DRAFT → SUBMITTED → APPROVED`).
- **User** — a system account with a per-module permission matrix and an
  optional `superAdmin` flag.

## 5. Features

### Employee Directory
- List, search, and filter employees by trade, status, and compliance state.
- Compliance indicator per employee (green/yellow/red/gray dot based on
  document/training expiry).
- Site name shown beneath deployment status for mobilized/reserved employees.
- Create and edit employee records, including trade + specialization.
- Bulk import from Excel, with row-level validation and an error report for
  anything that doesn't match a known trade/specialization.

### Job Orders
- Create a job order against a client category, with trade requirements.
  Start date is optional.
- Import job order requirements from Excel.
- Edit job order details and trade allocations. Trade dropdowns filter out
  already-used trades to prevent duplicates.
- Slot grid per job order: each slot shows empty/filled state and pipeline stage.

### Deployment Pipeline
- Each slot moves through a fixed pipeline: `UNASSIGNED → RESERVED → BOOKED
  → MOBILIZED`.
- Auto-Suggest: for an empty slot, surfaces available, compliant employees
  of the matching trade as candidates.
- Every transition (assign, advance, release) requires a reason and an
  authorizer before it's saved — no exceptions.
- Hard lock: once a worker is `BOOKED` or `MOBILIZED`, only an operations
  level 3 admin (or superAdmin) can change their assignment.
- 90-day demob window is set per-employee at mobilization time.

### Audit Trail
- Every status change writes an audit record automatically.
- A dedicated Audit Log page for reviewing the full history, filterable by
  employee.

### Trade Management
- Admin-managed lookup list of valid trades — addable without a code deploy.
- Every employee and job order slot references a trade from this list.

### Specialization Management
- Admin-managed lookup list linked to one or more trades.
- Every specialization used on an employee record must exist and be active.

### Staff Management
- Admin-managed list of authorized personnel (name + designation) used as
  the "Authorized By" field in audit entries.

### Timesheets (Finance module)
- Per-job-order, per-month timesheet with per-employee daily records.
- Standard and overtime hours tracked per day.
- Approval pipeline: `DRAFT → SUBMITTED → APPROVED`.

### Access Control
- Every mutating action is gated server-side by module permission level.
- New user accounts can only be created by a superAdmin.
- Module visibility and UI actions are controlled client-side via
  `usePermissions` and `ProtectedRoute`.

## 6. Out of scope (for now)

Not currently built, and not assumed to be needed unless raised explicitly:
a scheduling calendar, push/email notifications, a client-facing portal, or
a native mobile app. If any of these come up, treat them as new feature
decisions, not implied by what already exists.

## 7. What success looks like

- No worker can be assigned to two active commitments at once.
- Every deployment decision has a recorded reason and authorizer, retrievable
  later.
- Coordinators can find a qualified, available worker for a slot without
  cross-referencing a spreadsheet by hand.
- Timesheet hours per job order are tracked and approved without a separate
  Excel file.
