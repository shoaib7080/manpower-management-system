# Phases

Five phases, roughly sequential. Status reflects the actual current state of
the repo, verified against the code — not a guess.

---

## Phase 1 — Foundation
*Get a working, authenticated, role-aware skeleton with the core data model.*

- [x] Vite/React client + Express/MongoDB server scaffold
- [x] JWT auth (login, protected routes)
- [x] Role hierarchy with permission middleware
- [x] Core models: `User`, `Employee`, `JobOrder` (with embedded slots)
- [x] Employee Directory page: list, search, filter, compliance indicators
- [x] Job Orders page: create, view, slot grid
- [x] Excel import for employees and job orders

**Status: complete.**

---

## Phase 2 — Deployment Pipeline & Audit Trail
*The actual reason this system exists: no silent reassignment, every change recorded.*

- [x] Slot pipeline (`UNASSIGNED → RESERVED → BOOKED → MOBILIZED`)
- [x] Mandatory Audit modal on every status transition (reason + authorizer)
- [x] `AuditLog` model + write-on-every-transition
- [x] Admin Override hard-lock on `BOOKED`/`MOBILIZED` slots
- [x] Auto-Suggest drawer for filling empty slots
- [x] Audit Log viewer page, wired into navigation
- [x] Fixed: Auto-Suggest query-key mismatch that made it return no candidates
- [x] Fixed: duplicate `AuditModal` mount causing ambiguous double-confirm
- [x] Fixed: dead component files removed
- [x] `CreateEmployeeModal` wired up (was previously dead/unreachable)

**Status: complete.**

---

## Phase 3 — Data Integrity & Architecture
*Close the gaps that let bad data or bad access in, and restructure for scale.*

- [x] `Specialization.trades[]` — array, supports multi-trade specializations
- [x] `Specialization` pre-save hook bug fixed
- [x] `Trade` model — DB-managed, admin-editable via `TradesPage`, seeded on boot
- [x] `Staff` model — admin-managed "Authorized By" lookup with designation
- [x] Import validation against active `Trade` collection
- [x] `updateEmployee` emiratesId sparse-index bug fixed
- [x] `calculate90DayDemob` correctly scoped to employees, not job orders
- [x] `targetDemobDate` removed from `JobOrder` model
- [x] `startDate` optional on job order creation
- [x] Server restructured into modules: `operations`, `users`, `finance`, `core`, `shared`
- [x] RBAC replaced with per-module permission matrix (`MODULE_LEVELS` 0–3 + `superAdmin`)
- [x] `requireModuleLevel` middleware + `usePermissions` hook + `ProtectedRoute`
- [x] Module registry (`modules.config.js`) as single source of truth for nav/routes
- [x] Startup migrations for employee documents and user permissions
- [x] `EditJobOrderPage` with trade-deduplication in dropdowns
- [x] `DashboardPage` added as root route
- [x] `TradesPage` and `StaffPage` admin UIs
- [x] Site name shown beneath status badge in `DirectoryPage`

**Status: complete.**

---

## Phase 4 — Finance Module
*Timesheet and financial tracking per job order.*

- [x] `Timesheet` model (per job order, per month, per-employee daily records)
- [x] `/api/finance/timesheets` routes
- [x] `TimesheetsPage` scaffolded with lazy loading, gated behind `finance >= 1`
- [ ] Timesheet creation flow (select job order + month, auto-populate from mobilized slots)
- [ ] Timesheet editing (day selection, standard/overtime hours per employee)
- [ ] Approval flow (`DRAFT → SUBMITTED → APPROVED`) with authorizer
- [ ] Timesheet export (Excel/PDF)
- [ ] Finance dashboard summary (hours by job order, overtime breakdown)

**Status: in progress — model and routes done, UI needs building out.**

---

## Phase 5 — Scale & Usability
*Everything that matters once the core is trustworthy and the team is using it daily.*

- [ ] Role-aware UI — audit all pages to use `usePermissions` for hiding/disabling
      actions, not just relying on server 403
- [ ] Dashboard real data — wire `DashboardPage` to actual summary stats
- [ ] Server-side filtering/pagination for employee list
- [ ] Finish Tailwind → `tokens.css` migration across remaining files
- [ ] Reporting/export (compliance-expiry report, deployment history export)
- [ ] Notifications for upcoming document/training expiries
- [ ] Anything beyond this is a new scope decision — see PRD.md §6 for what's
      explicitly out of scope today.

**Status: not started.**
