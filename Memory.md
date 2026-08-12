# Memory

Living snapshot of project state. Update this whenever a phase item moves
from open to done, or priorities change — this is meant to be the first
thing read (by a person or another AI) before picking up work, so it needs
to stay accurate rather than aspirational.

**Last verified against actual code:** 10 Aug 2026

---

## What's been completed

**Foundation (Phase 1) — done**
- Full-stack scaffold: Vite/React client, Express/MongoDB server, JWT auth,
  4-level role hierarchy enforced server-side.
- Core models: `User`, `Employee`, `JobOrder` (embedded slots), `AuditLog`,
  `Specialization`.
- Employee Directory and Job Orders pages, both with working create and
  Excel-import flows.

**Deployment pipeline & audit trail (Phase 2) — done**
- Full slot pipeline with mandatory audit-gated transitions (reason +
  authorizer required on every change).
- Admin Override hard-lock on Booked/Mobilized slots.
- Audit Log viewer page, wired into navigation — this closed the biggest gap
  found in the original review (the write-path existed before the read-path
  did).
- Several bugs found during review have since been fixed and verified in
  the current code:
  - Auto-Suggest drawer's query-key mismatch (was always returning zero
    candidates) — fixed, now reads the correct cache key.
  - Duplicate `AuditModal` mount (was rendered both globally and inside
    `AssignToJobModal`) — fixed, only one instance now.
  - `StatusBadge` not handling `HALTED` — fixed, merged into a combined
    "Vacation / Halted" badge.
  - Six dead component files — removed.
  - `CreateEmployeeModal` — now actually wired up to the "+ Add Employee"
    button (previously dead code).

**Data integrity work (Phase 3) — partially done**
- `Specialization` model and admin-managed CRUD flow built and working:
  create, list by trade, deactivate.
- Employee Excel import now validates trade (and specialization, if
  present) against known values before writing, instead of writing
  unvalidated strings — this was the root cause of employees ending up with
  trade values like `"WELDER"` that didn't match the enum.
- Import switched from unvalidated `bulkWrite` to `findOneAndUpdate` with
  `runValidators: true`.
- One-time cleanup script (`server/scripts/fixEmployeeTrades.js`) written
  for pre-existing bad trade data from before validation existed.

---

## What's currently being worked on

**Specialization → trade relationship.** Currently `Specialization.trade`
is a single required string, which makes it impossible for one
specialization to apply to more than one trade — but real cases like "E&I"
genuinely need to span Foreman, Technician, Supervisor, and Fitter at once.
The unique index on `nameLower` alone (not `nameLower` + `trade`) means this
isn't just a design limitation, it's an active bug: creating the same
specialization name under a second trade fails outright today.

The fix is scoped: `trade: String` → `trades: [String]` on the model, plus
matching updates to `getSpecializations`, `createSpecialization`, and
`resolveSpecialization` in the controllers. Not yet applied.

---

## What should be worked on next

In priority order:

1. **Fix `updateEmployee`'s silent no-op bug.** It correctly computes an
   update payload including resolved trade/specialization, then writes a
   different object that excludes both — so trade and specialization edits
   currently never persist through the UI. Small fix, but it blocks a real,
   already-built feature (editing an employee's trade/specialization) and
   should land before anything else on this list.
2. **Apply the Specialization `trades: [String]` migration** described
   above, including a one-time conversion of any existing single-`trade`
   specialization records.
3. **Security/hardening pass:** validate `level` on user creation against
   known `ROLE_LEVELS` values, add an audit-log entry for account creation
   (especially new Admins), fix `User.level`'s schema default (currently
   defaults to Admin), rotate/env-source `seedAdmin.js` credentials.
4. **Finalize the `TRADES` list** for actual EPC O&G scope — a draft
   grouped by discipline (mechanical/piping, civil, surface protection,
   electrical & instrumentation, QA/QC, HSE, supervision, support) has
   already been worked through; Scaffolder, Painter/Blaster, Electrician,
   and Instrument Technician are the clearest gaps in the current list.
5. Everything else in Phase 3/4 (see Phases.md) — request validation layer
   more broadly, Tailwind migration cleanup, server-side pagination, role-
   aware UI.
