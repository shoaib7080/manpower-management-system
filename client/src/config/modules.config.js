import {
  Briefcase,
  ClipboardList,
  History,
  LayoutDashboard,
  Receipt,
  ShieldCheck,
  Tags,
  UserCheck,
  Users,
  HardHat,
  CalendarDays,
} from "lucide-react";

/**
 * Central module registry — single source of truth for:
 *   - Which modules exist in the ERP
 *   - What permission level is required to access each
 *   - What nav items appear in the Sidebar per module
 *   - What route the module switcher navigates to on selection
 *
 * To add a new module (e.g. Phase 4 Finance routes):
 *   1. Populate the `nav` / `adminNav` arrays below
 *   2. Add routes to App.jsx
 *   — The Topbar dropdown and Sidebar automatically pick up the changes.
 */
export const MODULES = [
  {
    id: "operations",
    label: "Operations",
    Icon: HardHat,
    rootRoute: "/",
    // Minimum permissions[id] level required to see this module in the switcher
    requiredLevel: 1,
    superAdminOnly: false,
    nav: [
      { to: "/", label: "Dashboard", Icon: LayoutDashboard, end: true },
      { to: "/directory", label: "Personnel Directory", Icon: Users },
      { to: "/job-orders", label: "Job Orders", Icon: ClipboardList },
      { to: "/audit-log", label: "Audit Trail", Icon: History },
    ],
    // Shown only when user has operations >= 3 (or superAdmin)
    adminNav: [
      { to: "/trades", label: "Trades", Icon: Briefcase },
      { to: "/specializations", label: "Specializations", Icon: Tags },
      { to: "/staff", label: "Staff", Icon: UserCheck },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    Icon: Receipt,
    rootRoute: "/finance",
    requiredLevel: 1,
    superAdminOnly: false,
    nav: [
      { to: "/finance/timesheets", label: "Timesheets", Icon: CalendarDays },
    ],
    adminNav: [],
  },
  {
    // SuperAdmin module — shown only when permissions.superAdmin === true
    id: "superadmin",
    label: "Super Admin",
    Icon: ShieldCheck,
    rootRoute: "/users",
    requiredLevel: 0, // permission check is overridden by superAdminOnly flag
    superAdminOnly: true,
    nav: [{ to: "/users", label: "User Management", Icon: Users }],
    adminNav: [],
  },
];

/**
 * Returns the module config object for the given id.
 * Falls back to the operations module if id is not found.
 */
export const getModule = (id) => MODULES.find((m) => m.id === id) ?? MODULES[0];
