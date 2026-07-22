// Numeric Hierarchy (Lower number = Higher authority)
export const ROLE_LEVELS = {
  ADMIN: 1,                 // Full control, override & direct approvals
  PROJECT_ENGINEER: 2,      // Requests manpower, manages assigned site slots
  PRODUCTION_SUPERVISOR: 3, // Views site status, reports halts/availability
  FIELD_USER: 4            // Read-only / basic viewing
};

// String Enums for clean MongoDB readability
export const EMPLOYEE_STATUS = {
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  BOOKED: 'BOOKED',
  MOBILIZED: 'MOBILIZED',
  VACATION: 'VACATION',
  HALTED: 'HALTED'
};

export const TRADES = [
  'Supervisor', 
  'Foreman', 
  'Fabricator', 
  'Welder', 
  'Fitter', 
  'Rigger', 
  'Helper', 
  'Other'
];
