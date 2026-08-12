# Rules — conventions, anti-patterns, and boundaries

This document exists so future work (by a person or another AI) follows the
same patterns already established in this codebase, instead of
reintroducing problems that have already been found and fixed once.

## 1. What to use

**Categorical data that grows over time → a managed lookup collection, not
a hardcoded enum, not free text.**
This is the `Specialization` model pattern. If you're adding a new field
that represents "one of a set of named things that isn't fixed forever"
(certifications, site names, equipment types, whatever comes up), follow
this shape: a small collection with `name`, an `active` flag for
soft-disable, and controller-level validation against it — not a Mongoose
`enum` (too rigid, needs a deploy to extend) and not an unrestricted string
(recreates the exact data-drift bug this app was built to eliminate).

**Server state → React Query. UI-only state → Zustand. Never mixed.**
`useDashboardStore` holds only "which overlay is open and what it's acting
on." It has never held actual employee/job-order data, and it should not
start now. If a new feature needs both, keep them in their respective
systems and let components read from both rather than duplicating server
data into the store.

**Any write to a Mongoose model → explicit validators.**
`findOneAndUpdate` / `findByIdAndUpdate` with `{ runValidators: true }`, or
`.save()`. Never `bulkWrite` for anything that needs schema enforcement —
Mongoose does not run validators on `bulkWrite` by default, which is exactly
how invalid `trade` values got into the database in the first place.

**Every action that changes a worker's status or assignment → an
`AuditLog` entry.**
This isn't optional per-feature; it's the core product requirement (see
PRD.md §2). If a new mutation changes `Employee.status` or a slot's state,
it writes an audit record in the same request, with a real
`reasonForChange` and `authorizedBy` — not a placeholder.

**Trade matching → exact equality on `trade`, nothing else.**
`employee.trade === slot.trade` is the entire matching rule, everywhere
(Auto-Suggest, assignment eligibility, `/suggest` query). `specialization`
is never part of this comparison.

## 2. What to avoid

**Tailwind utility classes.**
The app has moved to the `tokens.css` design system. Tailwind is still a
dependency and still present in a few files (`LoginPage.jsx`, the loading
state in `App.jsx`, `CreateJobOrdersModal.jsx`) purely as migration debt —
new code should not add more of it, and touching one of those files is a
good moment to convert it rather than leave it mixed.

**Free-text fields for anything that will be matched, filtered, or
reported on.**
If two people could type the same real-world thing two different ways, it
needs normalization at write time (see the lookup-collection pattern
above), not a fuzzy match at read time. Fuzzy matching at query time is
fragile and tends to be patched forever instead of fixed once.

**Trusting `req.body` values without checking them against known-valid
sets.**
`level` on user creation is the clearest example — nothing currently stops
an out-of-range or nonsensical value from being accepted. Any field that
represents a constrained real-world value (a role level, a status, a trade)
should be checked against its valid set explicitly in the controller, not
assumed safe because the schema has an enum somewhere upstream of it.

**Silent no-ops.**
`updateEmployee` currently computes a correct update payload and then
writes a different, incomplete one instead — an intentional-looking bug
that fails silently (200 OK, no error, but the field just doesn't change).
When writing a mutation, make sure the object being validated/logged is the
same object actually being persisted.

## 3. Error handling convention

Use this consistently across controllers:

| Situation | Status | Body |
|---|---|---|
| Validation failure (bad input, unknown enum value, missing required field) | 400 | `{ message: "<specific, actionable message>" }` |
| Not authenticated | 401 | `{ message: "Not authorized" }` |
| Authenticated but insufficient role level | 403 | `{ message: "<what level is required>" }` |
| Resource not found | 404 | `{ message: "<resource> not found." }` |
| Unexpected server error | 500 | `{ message: "<generic message>", error: error.message }` — never leak a stack trace |

Bulk operations (Excel import) are the one exception: partial success is
expected, so return a summary (`{ successCount, errors: [...] }`) rather
than failing the whole request on the first bad row.

## 4. Boundaries — don't touch without a deliberate decision

- **Don't add `specialization` to any matching/filter condition.** It's
  metadata. If a future request wants specialization-aware matching, that's
  a new feature to flag back to the person, not something to wire in as a
  side effect of another change.
- **Don't touch `TRADES` casually.** It's the one enum in this system that
  genuinely should stay small, stable, and code-reviewed — every value in
  it is a real matching key used across job orders and employees. Adding a
  trade is fine; renaming or removing one needs a data migration, not just
  a code change.
- **Don't restrict who can create an Admin account.** The fix for
  admin-creating-admin is validation + an audit trail on the action, not
  blocking the capability — see the reasoning already worked through for
  this in project history. Re-litigating this from scratch wastes a turn.
- **Don't "fix" `User.level`'s schema default in isolation** without also
  checking every place a `User` is created — the goal is consistent
  least-privilege defaults everywhere, not just papering over one call
  site.

## 5. Known, accepted debt (intentionally deferred, not forgotten)

Listed here so it isn't mistaken for something nobody noticed:

- Tailwind still present in a handful of files, pending full migration to
  `tokens.css`.
- JWT stored in `localStorage` rather than an httpOnly cookie — accepted for
  now as an internal tool; revisit if this ever becomes internet-facing.
- `xlsx` (SheetJS) `0.18.5` from npm has known unresolved advisories; the
  maintainers publish patched builds outside the npm registry. Not yet
  addressed.
- No server-side pagination on the employee list — fine at current scale,
  will need `trade`/`status`/`search` query params wired up (the backend
  already accepts them) once the roster grows.
