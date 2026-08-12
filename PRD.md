# PRD — Manpower Management System

## 1. What this is

An internal workforce-deployment system for an EPC contractor operating in
the UAE Oil & Gas sector (ADNOC-group scopes, CICPA-controlled sites). It
replaces spreadsheet-based tracking of who is deployed where, with a system
that enforces two things Excel never could: **no double-booking a worker**,
and **no status change without a recorded reason and authorizer**.

## 2. Problem it solves

Before this system, worker deployment was tracked in Excel. That made it
possible to reassign someone who was already committed elsewhere, with no
record of who approved the change or why. The core product requirement,
underneath every feature, is: **every change to where a worker is deployed
must be deliberate, checked against their current commitment, and logged.**

## 3. Users

Four role levels, strictly nested (each level can do everything the level
below it can, plus more):

| Level | Role | Can do |
|---|---|---|
| 1 | Admin | Everything, including creating other users, overriding locked (Booked/Mobilized) assignments |
| 2 | Project Engineer | Requests manpower, manages slot assignments on their job orders |
| 3 | Production Supervisor | Views site status, reports availability/halts |
| 4 | Field User | Read-only |

## 4. Core entities

- **Employee** — a worker: identity, trade, specialization, compliance
  documents (HSE Passport, CICPA Pass), safety trainings (ADNOC Induction,
  H2S, Medical, Sea Survival — each with an expiry), current status and
  current assignment.
- **Job Order** — a site request: client category (ADNOC Onshore / ADNOC
  Offshore / Internal Production / Other), requirements by trade, and a set
  of individual **Slots** (one per seat to be filled), each with its own
  status.
- **Specialization** — an admin-managed, trade-linked refinement of a
  worker's trade (e.g. "Spray Painter" under "Painter"). Descriptive only —
  never used to match a worker to a slot.
- **Audit Log** — an immutable record of every status change: who, when,
  from what status/site to what, plus a required reason and authorizer.
- **User** — a system account with one of the four role levels above.

## 5. Features

### Employee Directory
- List, search, and filter employees by trade, status, and compliance state.
- Compliance indicator per employee (green/yellow/red/gray dot based on
  document/training expiry).
- Create and edit employee records, including trade + specialization.
- Bulk import from Excel, with row-level validation and an error report for
  anything that doesn't match a known trade/specialization.

### Job Orders
- Create a job order against a client category, with trade requirements.
- Import job order requirements from Excel.
- Slot grid per job order: each slot shows empty/filled state and pipeline
  stage.

### Deployment Pipeline
- Each slot moves through a fixed pipeline: `UNASSIGNED → RESERVED → BOOKED
  → MOBILIZED`.
- Auto-Suggest: for an empty slot, surfaces available, compliant employees
  of the matching trade as candidates.
- Every transition (assign, advance, release) requires a reason and an
  authorizer before it's saved — no exceptions.
- Hard lock: once a worker is `BOOKED` or `MOBILIZED`, only a Level 1 Admin
  can change their assignment (Admin Override flow).

### Audit Trail
- Every status change writes an audit record automatically.
- A dedicated Audit Log page for reviewing the full history, filterable by
  employee.

### Specialization Management
- Admin-managed lookup list (not free text, not a hardcoded enum) —
  specializations can be added without a code deploy, but every value used
  on an employee record must exist and be active in this list.

### Access Control
- Every mutating action is gated server-side by role level.
- New user accounts can only be created by an existing Level 1 Admin.

## 6. Out of scope (for now)

Not currently built, and not assumed to be needed unless raised explicitly:
payroll/timesheets, a scheduling calendar, push/email notifications, a
client-facing portal, or a native mobile app. If any of these come up, treat
them as new feature decisions, not implied by what already exists.

## 7. What success looks like

- No worker can be assigned to two active commitments at once.
- Every deployment decision has a recorded reason and authorizer, retrievable
  later.
- Coordinators can find a qualified, available worker for a slot without
  cross-referencing a spreadsheet by hand.
