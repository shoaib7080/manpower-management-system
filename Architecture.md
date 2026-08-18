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
| tailwindcss | 3.4.19 | **Legacy** — being phased out, see Rules.md |

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

**Database:** MongoDB, accessed via `MONGO_URI` in `.env` (see `server/config/db.js`).

**Auth:** JWT, issued on login, sent as `Authorization: Bearer <token>`,
stored client-side in `localStorage`, attached automatically by an axios
request interceptor.

---

## 2. App flow

### Request lifecycle
1. Client action → React Query mutation → `axiosInstance` (attaches JWT) →
   Express route.
2. Route → `authMiddleware.protect` (verifies JWT, loads `req.user`) →
   `requireLevel(n)` if the route needs a minimum role level → controller.
3. Controller validates input, talks to Mongoose models, returns JSON.
4. On success, the client invalidates the relevant React Query cache keys
   (`["employees"]`, `["jobOrders"]`) so the UI refetches automatically.

### The deployment pipeline flow (the core interaction loop)
1. A slot action is triggered from `JobOrdersPage` (assign / advance /
   release) or via the Auto-Suggest drawer.
2. `useDashboardStore` (Zustand) records *which* action is pending — it does
   not hold real employee/job-order data, only UI/overlay state.
3. If the worker's current status is `BOOKED` or `MOBILIZED`, the Admin
   Override modal gates the flow first (Level 1 only).
4. The Audit modal always follows — no transition saves without a reason and
   an authorizer.
5. On confirm, `DashboardLayout` fires the corresponding mutation
   (`assign-slot` / `release-slot` / `update-slot-pipeline`), the backend
   re-validates everything server-side, updates the slot + employee, and
   writes an `AuditLog` entry.

### State management split (a deliberate rule, not an accident)
- **React Query** owns anything that comes from the server: employees, job
  orders, specializations, audit logs.
- **Zustand** (`useDashboardStore`) owns only ephemeral UI state: which
  drawer/modal is open, and what pending action it's confirming. It never
  duplicates server data.

---

## 3. API surface

| Base path | Covers |
|---|---|
| `/api/auth` | login, register (Level 1 only) |
| `/api/manpower` | employee CRUD, Excel import |
| `/api/job-orders` | job order CRUD, Excel import, slot assign/release/pipeline, auto-suggest |
| `/api/audit-logs` | read audit history |
| `/api/specializations` | list, create, deactivate specializations |
| `/api/staff` | list, create, update, deactivate authorized staff |

---

## 4. Folder structure

```
client/src/
├── api/
│   ├── axiosInstance.js       # axios instance + JWT interceptor
│   └── services.js            # all API call functions
├── components/
│   ├── ComplianceDot.jsx
│   ├── Sidebar.jsx
│   ├── StatusBadge.jsx
│   ├── jobOrders/
│   │   ├── CreateJobOrdersModal.jsx
│   │   └── JobOrderImportModal.jsx
│   ├── manpower/
│   │   ├── AssignToJobModal.jsx
│   │   ├── CreateEmployeeModal.jsx
│   │   ├── EmployeeDetailModal.jsx
│   │   ├── ImportModal.jsx
│   │   └── employeeUtils.js
│   └── modals/
│       ├── AdminOverrideModal.jsx
│       ├── AuditModal.jsx     # single global instance, mounted in DashboardLayout
│       └── SuggestDrawer.jsx  # Auto-Suggest drawer
├── context/
│   └── AuthContext.jsx        # login/logout, current user, isAuthenticated
├── layouts/
│   └── DashboardLayout.jsx    # owns the slot mutations + global overlay mounts
├── pages/
│   ├── AuditLogPage.jsx
│   ├── DirectoryPage.jsx
│   ├── ErrorPage.jsx
│   ├── JobOrdersPage.jsx
│   └── LoginPage.jsx
├── store/
│   └── useDashboardStore.js   # Zustand — UI overlay state only
├── styles/
│   ├── global.css
│   └── tokens.css             # design tokens — see Design.md
├── App.jsx                    # router
└── main.jsx

server/
├── config/
│   ├── constants.js            # ROLE_LEVELS, EMPLOYEE_STATUS, TRADES
│   └── db.js
├── controllers/
│   ├── auditController.js
│   ├── authController.js
│   ├── jobOrderController.js
│   ├── manpowerController.js
│   └── specializationController.js
├── middleware/
│   ├── authMiddleware.js       # protect, requireLevel
│   └── uploadMiddleware.js     # multer config for Excel import
├── models/
│   ├── AuditLog.js
│   ├── Employee.js
│   ├── JobOrder.js             # includes embedded slot sub-schema
│   ├── Specialization.js
│   ├── Staff.js                # authorized personnel for audit "Authorized By"
│   ├── Trade.js
│   └── User.js
├── routes/
│   ├── auditRoutes.js
│   ├── authRoutes.js
│   ├── jobOrderRoutes.js
│   ├── manpowerRoutes.js
│   ├── specializationRoutes.js
│   ├── staffRoutes.js
│   └── tradeRoutes.js
├── scripts/
│   └── fixEmployeeTrades.js    # one-time data cleanup, not part of the app
├── utils/
│   └── parseDate.js
├── seedAdmin.js
└── server.js
```

---

## 5. Data model summary

- `Employee.trade` — required, enum-constrained to `TRADES`. This is the
  only field ever used to match a worker to a job order slot.
- `Employee.specialization` — optional free string, validated at the
  controller level (not schema-enum) against the active `Specialization`
  list. Descriptive only, never part of matching logic.
- `JobOrder.slots[]` — embedded sub-documents, each with its own `trade`,
  `status`, and `assignedEmployee` reference. Matching is always
  `employee.trade === slot.trade`.
- `AuditLog` — one document per status change, with `reasonForChange` and
  `authorizedBy` both required at the schema level.
- `User.level` — a plain `Number`, not schema-enum restricted (see Rules.md
  for why, and the associated risk).

Full field-level detail lives in the model files themselves — this section
is a map, not a duplicate of the schema.
