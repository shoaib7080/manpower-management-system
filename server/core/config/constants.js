// @deprecated — use MODULE_LEVELS + requireModuleLevel instead.
// Kept only until all legacy requireLevel() callsites are removed.
export const ROLE_LEVELS = {
  ADMIN: 1, // Full control, override & direct approvals
  PROJECT_ENGINEER: 2, // Requests manpower, manages assigned site slots
  PRODUCTION_SUPERVISOR: 3, // Views site status, reports halts/availability
  FIELD_USER: 4, // Read-only / basic viewing
};

// Unified module permission scale (higher = more access)
// 0 = no access, 1 = viewer, 2 = operator/engineer, 3 = module admin
export const MODULE_LEVELS = {
  NONE: 0,
  VIEWER: 1,
  OPERATOR: 2,
  ADMIN: 3,
};


// String Enums for clean MongoDB readability
export const EMPLOYEE_STATUS = {
  AVAILABLE: "AVAILABLE",
  RESERVED: "RESERVED",
  BOOKED: "BOOKED",
  MOBILIZED: "MOBILIZED",
  VACATION: "VACATION",
  HALTED: "HALTED",
};

export const TRADES = [
  "Supervisor",
  "Foreman",
  "Fabricator",
  "Welder",
  "Fitter",
  "Rigger",
  "Helper",
  "Labourer",
  "Scaffolder",
  "Carpenter",
  "Plumber",
  "Operator",
  "Safety Officer",
  "Technician",
  "Painter",
  "Blaster",
  "Construction Engineer",
  "QC",
  "HSE",
  "Fire Watcher",
  "Habitat Supervisor",
  "Habitat Technician",
  "AP",
  "Other",
];
