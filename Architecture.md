# Architecture

## 1. Tech stack

**Client** (`/client`)
| Package | Version | Purpose |
|---|---|---|
| react / react-dom | 19.2.7 | UI |
| react-router-dom | 6.26.2 | Routing |
| @tanstack/react-query | 5.101.4 | Server-state cache, fetching, mutations |
| zustand | 4.5.4 | Local UI-only state (overlays, drawers) |
| axios | 1.18.1 | HTTP client |
| lucide-react | 1.25.0 | Icons |
| vite | 8.1.1 | Build tool / dev server |
| tailwindcss | 3.4.19 | Legacy — still present in some files, see Rules.md |

**Server** (`/server`)
| Package | Version | Purpose |
|---|---|---|
| express | 5.2.1 | HTTP framework |
| mongoose | 9.8.0 | MongoDB ODM |
| jsonwebtoken | 9.0.3 | Auth tokens |
| bcryptjs | 3.0.3 | Password hashing |
| multer | 2.2.0 | File upload handling (Excel import) |
| xlsx | 0.18.5 | Excel parsing — see Rules.md re: known advisories |
| cors | 2.8.6 | CORS handling |
| dotenv | 17.4.2 | Env config |

**Database:** MongoDB, accessed via `MONGO_URI` in `.env` (see `server/core/config/db.js`).

**Auth:** JWT, issued on login, sent as `Authorization: Bearer <token>`,
stored client-side in `localStorage`, attached automatically by an axios
request interceptor.

---

## 2. App flow

### Request lifecycle
1. Client action → React Query mutation → `axiosInstance` (attaches JWT) →
   Express route.
2. Route → `authMiddleware.protect` (verifies JWT, loads `req.user`) →
   `requireModuleLevel(module, level)` if the route needs a minimum
   permission level → controller.
3. Controller validates input, talks to Mongoose models, returns JSON.
4. On success, the client invalidates the relevant React Query cache keys
   (`["employees"]`, `["jobOrders"]`, etc.) so the UI refetches automatically.

### The deployment pipeline flow (the core interaction loop)
1. A slot action is triggered from `JobOrdersPage` (assign / advance /
   release) or via the Auto-Suggest drawer.
2. `useDashboardStore` (Zustand) records which action is pending — it does
   not hold real employee/job-order data, only UI/overlay state.
3. If the worker's current status is `BOOKED` or `MOBILIZED`, the Admin
   Override modal gates the flow first (operations level 3 or superAdmin only).
4. The Audit modal always follows — no transition saves without a reason and
   an authorizer.
5. On confirm, `DashboardLayout` fires the corresponding mutation
   (`assign-slot` / `release-slot` / `update-slot-pipeline`), the backend
   re-validates everything server-side, updates the slot + employee, and
   writes an `AuditLog` entry.

### State management split (a deliberate rule, not an accident)
- **React Query** owns anything that comes from the server: employees, job
  orders, specializations, audit logs, trades, staff, timesheets.
- **Zustand** (`useDashboardStore`) owns only ephemeral UI state: which
  drawer/modal is open, and what pending action it's confirming. It never
  duplicates server data.
- **`useModuleStore`** (Zustand) tracks the active module for the sidebar/
  topbar module switcher — UI state only.

---

## 3. Permission system

The old 4-level `ROLE_LEVELS` hierarchy has been replaced with a per-module
permission matrix on each `User` document:

```js
permissions: {
  operations: 0–3,  // 0=none, 1=viewer, 2=operator, 3=module admin
  finance:    0–3,
  superAdmin: Boolean  // bypasses all module-level checks
}
```

- `requireModuleLevel(module, level)` middleware enforces this server-side.
- `usePermissions(moduleName)` hook mirrors the same logic client-side for
  conditional rendering.
- `ProtectedRoute` wraps routes in `App.jsx` with module + level checks.
- `superAdmin: true` bypasses all module checks — used for User Management.
- `ROLE_LEVELS` is kept in `constants.js` but marked `@deprecated` — it
  will be removed once all legacy `requireLevel()` callsites are gone.

---

## 4. API surface

| Base path | Module | Covers |
|---|---|---|
| `/api/auth` | users | login, register, user CRUD |
| `/api/audit-logs` | users | read audit history |
| `/api/manpower` | operations | employee CRUD, Excel import |
| `/api/job-orders` | operations | job order CRUD, Excel import, slot assign/release/pipeline, auto-suggest |
| `/api/specializations` | operations | list, create, deactivate specializations |
| `/api/staff` | operations | list, create, deactivate authorized staff (audit "Authorized By" lookup) |
| `/api/trades` | operations | list, create, deactivate trades |
| `/api/finance/timesheets` | finance | timesheet CRUD per job order/month |

---

## 5. Folder structure

```
client/src/
├── api/
│   ├── axiosInstance.js       # axios instance + JWT interceptor
│   ├── services.js            # operations + users API calls
│   ├── finance.api.js         # finance module API calls
│   ├── operations.api.js
│   ├── shared.api.js
│   └── users.api.js
├── components/
│   ├── ComplianceDot.jsx
│   ├── ProtectedRoute.jsx     # module + level route guard
│   ├── Sidebar.jsx
│   ├── StatusBadge.jsx
│   ├── jobOrders/
│   │   ├── CreateJobOrdersModal.jsx
│   │   └── JobOrderImportModal.jsx
│   ├── layout/
│   │   └── Topbar.jsx         # module switcher lives here
│   ├── manpower/
│   │   ├── AssignToJobModal.jsx
│   │   ├── CertificationsSection.jsx
│   │   ├── CreateEmployeeModal.jsx
│   │   ├── EmployeeDetailModal.jsx
│   │   ├── ImportModal.jsx
│   │   └── employeeUtils.js
│   ├── modals/
│   │   ├── AdminOverrideModal.jsx
│   │   ├── AuditModal.jsx     # single global instance, mounted in DashboardLayout
│   │   └── SuggestDrawer.jsx  # Auto-Suggest drawer
│   └── ui/
│       └── Modal.jsx          # shared modal primitives (Field, Overlay, btnPrimary, etc.)
├── config/
│   └── modules.config.js      # central module registry — nav, routes, required levels
├── context/
│   └── AuthContext.jsx        # login/logout, current user, isAuthenticated
├── hooks/
│   ├── usePermissions.js      # per-module permission booleans for conditional rendering
│   └── useTrades.js
├── layouts/
│   └── DashboardLayout.jsx    # owns the slot mutations + global overlay mounts
├── modules/
│   └── finance/
│       ├── pages/
│       │   └── TimesheetsPage.jsx
│       └── FinanceRoutes.jsx
├── pages/
│   ├── AuditLogPage.jsx
│   ├── DashboardPage.jsx
│   ├── DirectoryPage.jsx
│   ├── EditJobOrderPage.jsx
│   ├── ErrorPage.jsx
│   ├── JobOrdersPage.jsx
│   ├── LoginPage.jsx
│   ├── SpecializationsPage.jsx
│   ├── StaffPage.jsx
│   ├── TradesPage.jsx
│   └── UserPage.jsx
├── store/
│   ├── useDashboardStore.js   # Zustand — slot pipeline overlay state only
│   └── useModuleStore.js      # Zustand — active module for nav/topbar switcher
├── styles/
│   ├── global.css
│   └── tokens.css             # design tokens — see Design.md
├── App.jsx                    # router + ProtectedRoute wiring
└── main.jsx

server/
├── core/
│   ├── config/
│   │   ├── cloudinaryConfig.js
│   │   ├── constants.js        # ROLE_LEVELS (@deprecated), MODULE_LEVELS, EMPLOYEE_STATUS, TRADES
│   │   └── db.js
│   └── middleware/
│       ├── authMiddleware.js   # protect, requireModuleLevel
│       ├── errorHandler.js
│       └── uploadMiddleware.js # multer config for Excel import
├── modules/
│   ├── finance/
│   │   ├── controllers/
│   │   │   └── timesheetController.js
│   │   ├── models/
│   │   │   └── Timesheet.js
│   │   └── routes/
│   │       └── timesheetRoutes.js
│   ├── operations/
│   │   ├── controllers/
│   │   │   ├── jobOrderController.js
│   │   │   ├── manpowerController.js
│   │   │   ├── specializationController.js
│   │   │   ├── staffController.js
│   │   │   └── tradeController.js
│   │   ├── models/
│   │   │   ├── Employee.js
│   │   │   ├── JobOrder.js     # includes embedded slot sub-schema
│   │   │   ├── Specialization.js
│   │   │   ├── Staff.js        # authorized personnel for audit "Authorized By"
│   │   │   └── Trade.js        # DB-managed trade list (replaces hardcoded TRADES enum)
│   │   └── routes/
│   │       ├── jobOrderRoutes.js
│   │       ├── manpowerRoutes.js
│   │       ├── specializationRoutes.js
│   │       ├── staffRoutes.js
│   │       └── tradeRoutes.js
│   └── users/
│       ├── controllers/
│       │   ├── auditController.js
│       │   └── authController.js
│       ├── models/
│       │   └── User.js         # permissions matrix (operations, finance, superAdmin)
│       └── routes/
│           ├── auditRoutes.js
│           └── authRoutes.js
├── shared/
│   ├── models/
│   │   └── AuditLog.js
│   └── utils/
│       ├── migrateEmployeeDocuments.js  # startup migration, runs once
│       ├── migrateUserPermissions.js    # startup migration, runs once
│       ├── parseDate.js
│       └── seedTrades.js               # seeds initial TRADES list on first boot
├── scripts/
│   ├── Fixemployeetrades.js    # one-time data cleanup, not part of the app
│   └── seedAdmin.js
└── server.js
```

---

## 6. Data model summary

- `Employee.trade` — required, validated against the active `Trade`
  collection (not a hardcoded enum). The only field used to match a worker
  to a job order slot.
- `Employee.specialization` — optional string, validated at controller level
  against the active `Specialization` list. Descriptive only, never part of
  matching logic.
- `Employee.currentAssignment` — tracks active deployment: `jobOrderId`,
  `siteName`, `mobDate`, `targetDemobDate`. The 90-day demob window is
  per-employee, not per-job-order.
- `JobOrder.slots[]` — embedded sub-documents, each with `trade`, `status`,
  `assignedEmployee`, `mobDate`, `demobDate`. No `targetDemobDate` on the
  job order itself — demob is an employee-level concept.
- `Specialization.trades[]` — array of trade names, allowing one
  specialization (e.g. "E&I") to span multiple trades.
- `Trade` — DB-managed collection replacing the hardcoded `TRADES` constant.
  Seeded on first boot via `seedTrades.js`, admin-manageable via `TradesPage`.
- `Staff` — lookup list of authorized personnel (name + designation) used in
  the audit "Authorized By" field. Separate from `User` accounts.
- `AuditLog` — one document per status change, with `reasonForChange` and
  `authorizedBy` both required at the schema level.
- `User.permissions` — object with per-module numeric levels (0–3) and a
  `superAdmin` boolean. Replaces the old flat `level` field.
- `Timesheet` — per job order per month, with per-employee daily records
  (standard + overtime hours) and an approval status (`DRAFT → SUBMITTED →
  APPROVED`). Unique index on `(jobOrderId, month, year)`.

Full field-level detail lives in the model files themselves — this section
is a map, not a duplicate of the schema.
