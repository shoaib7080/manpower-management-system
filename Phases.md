# Phases

Four phases, roughly sequential. Status reflects the actual current state of
the repo, verified against the code — not a guess.

---

## Phase 1 — Foundation
*Get a working, authenticated, role-aware skeleton with the core data model.*

- [x] Vite/React client + Express/MongoDB server scaffold
- [x] JWT auth (login, protected routes)
- [x] 4-level role hierarchy (`ROLE_LEVELS`) with `requireLevel` middleware
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
- [x] Fixed: dead component files removed (`ManpowerTable`, old `JobOrderCard`,
      `SuggestionPanel`, `Navbar`, duplicate `AuditModal`)
- [x] `CreateEmployeeModal` wired up (was previously dead/unreachable)

**Status: complete.** This was the highest-risk phase (matches the
original problem statement most directly) and it's now functioning
end-to-end.

---

## Phase 3 — Data Integrity & Hardening
*Close the gaps that let bad data or bad access into a system that's supposed to prevent exactly that.*

- [x] `Specialization` model + admin CRUD + trade-scoped dropdown assignment
- [x] Import validation: employee trade values checked against `TRADES` +
      `Specialization` before write, unmatched rows reported instead of
      silently written
- [x] Bulk import switched from unvalidated `bulkWrite` to validated
      `findOneAndUpdate`
- [x] One-time cleanup script for pre-existing invalid trade data
      (`fixEmployeeTrades.js`)
- [ ] **`updateEmployee` bug**: computes the correct update payload
      (including trade/specialization) but writes a different, stale object
      — trade/specialization edits currently don't persist. *Highest
      priority open item — small fix, blocks a real feature.*
- [ ] **Specialization single-trade limitation**: `trade: String` needs to
      become `trades: [String]` so one specialization (e.g. "E&I") can span
      multiple trades. Schema + controller changes identified, not yet
      applied. Requires a small migration for any existing records.
- [ ] Request-body validation on `level` at user creation (reject anything
      outside the known `ROLE_LEVELS` values)
- [ ] Audit-log entry on user/account creation, especially new Admins
- [ ] `User.level` schema default changed from Admin to lowest privilege
- [ ] `seedAdmin.js` credentials rotated / sourced from env for any real
      deployment
- [ ] Finalize the canonical `TRADES` list for EPC O&G scope (draft already
      produced — Scaffolder, Painter/Blaster, Electrician, Instrument
      Technician, and civil trades are the notable gaps)

**Status: in progress — this is the current phase.**

---

## Phase 4 — Scale & Usability
*Everything that matters once the core is trustworthy and the team is actually using it daily.*

- [ ] Server-side filtering/pagination for the employee list (backend
      already accepts the query params; frontend doesn't send them yet)
- [ ] Role-aware UI — hide/disable actions the current user's level can't
      perform, instead of relying on the server 403 alone
- [ ] Finish Tailwind → `tokens.css` migration across remaining files
- [ ] User management UI (list/view/deactivate accounts — currently there's
      no way to see existing users at all outside the database)
- [ ] Reporting/export (e.g. compliance-expiry report, deployment history
      export)
- [ ] Notifications for upcoming document/training expiries
- [ ] Anything beyond this is a new scope decision, not an assumed next
      step — see PRD.md §6 for what's explicitly out of scope today.

**Status: not started.**
