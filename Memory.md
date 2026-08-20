# Memory

Living snapshot of project state. Update this whenever something moves from
open to done, or priorities change — this is meant to be the first thing
read before picking up work, so it needs to stay accurate rather than
aspirational.

**Last verified against actual code:** current

---

## What's been completed

**Foundation (Phase 1) — done**
- Full-stack scaffold: Vite/React client, Express/MongoDB server, JWT auth.
- Core models: `User`, `Employee`, `JobOrder` (embedded slots), `AuditLog`,
  `Specialization`.
- Employee Directory and Job Orders pages with create and Excel-import flows.

**Deployment pipeline & audit trail (Phase 2) — done**
- Full slot pipeline with mandatory audit-gated transitions (reason +
  authorizer required on every change).
- Admin Override hard-lock on Booked/Mobilized slots.
- Audit Log viewer page wired into navigation.
- Auto-Suggest drawer working correctly.
- Fixed: Auto-Suggest query-key mismatch, duplicate AuditModal mount,
  dead component files, StatusBadge HALTED handling.

**Data integrity (Phase 3) — done**
- `Specialization.trades[]` — array, supports multi-trade specializations
  (e.g. "E&I" → Technician + Foreman). Pre-save hook bug fixed (`next`
  now correctly passed as parameter).
- `Trade` model — trades are DB-managed via `TradesPage`, seeded on first
  boot from `TRADES` constant via `seedTrades.js`. No longer a hardcoded enum.
- `Staff` model — admin-managed lookup for audit "Authorized By" field,
  with designation. Managed via `StaffPage`.
- Employee import validates trade against the active `Trade` collection.
- `updateEmployee` emiratesId sparse-index bug fixed — empty emiratesId is
  omitted from `$set` instead of being set to `null`.
- `calculate90DayDemob` correctly scoped — demob date applies to employees
  (`currentAssignment.targetDemobDate` and `slot.demobDate`), not to job
  orders. `targetDemobDate` removed from `JobOrder` model and schema.
- `startDate` made optional on job order creation.
- Duplicate `requirements` key in `createJobOrder` removed.
- `startdate` typo in `importJobOrdersFromExcel` fixed to `startDate`.

**Architecture refactor — done**
- Server restructured from flat to modular: `server/modules/operations/`,
  `server/modules/users/`, `server/modules/finance/`, `server/core/`,
  `server/shared/`.
- RBAC replaced: old flat `ROLE_LEVELS` (1–4) replaced with a per-module
  permission matrix (`operations`, `finance`, `superAdmin`) on `User`.
  `MODULE_LEVELS`: 0=none, 1=viewer, 2=operator, 3=admin.
- `requireModuleLevel(module, level)` middleware replaces `requireLevel(n)`.
- `usePermissions(moduleName)` hook + `ProtectedRoute` component mirror
  the same logic client-side.
- Module registry (`modules.config.js`) is the single source of truth for
  nav items, routes, and required permission levels per module.
- `useModuleStore` (Zustand) tracks the active module for the topbar
  module switcher.
- Startup migrations run automatically on boot: `migrateEmployeeDocuments`,
  `migrateUserPermissions`.

**UI additions — done**
- `DashboardPage` added as the root `/` route.
- `EditJobOrderPage` — full job order edit with trade allocation management.
  Trade dropdowns filter out already-used trades; "Add Trade" disabled when
  all trades are exhausted.
- `TradesPage` — admin UI for managing the Trade lookup list.
- `StaffPage` — admin UI for managing the Staff lookup list.
- `Topbar` with module switcher.
- `CertificationsSection` component in employee forms.
- Site name shown beneath status badge in `DirectoryPage`.

**Finance module (initial) — done**
- `Timesheet` model: per job order per month, per-employee daily records
  with standard + overtime hours. Unique index on `(jobOrderId, month, year)`.
- `/api/finance/timesheets` routes wired up.
- `TimesheetsPage` scaffolded with lazy loading, gated behind `finance >= 1`.

---

## What should be worked on next

In priority order:

1. **Finance module depth** — `TimesheetsPage` is scaffolded; timesheet
   creation, editing (day selection, standard/overtime hours), approval flow
   (`DRAFT → SUBMITTED → APPROVED`), and export need to be built out.
2. **Dashboard real data** — `DashboardPage` exists; wire up actual summary
   stats (workforce counts, open slots, expiring documents, mobilized count).
3. **Role-aware UI** — `usePermissions` hook exists; audit all pages to
   hide/disable actions the current user's level can't perform, rather than
   relying on server 403 alone.
4. **Server-side pagination** — employee list has no pagination; backend
   already accepts `trade`/`status`/`search` query params.
5. **Security hardening** — `seedAdmin.js` credentials should be env-sourced
   for any real deployment; JWT in `localStorage` is accepted debt for now.
6. **Tailwind migration** — still present in several files; new code should
   use `tokens.css` tokens only.
