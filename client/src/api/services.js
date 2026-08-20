/**
 * Barrel re-export — maintains backward compatibility for all existing
 * `import { x } from '../api/services'` statements across page and
 * component files. No page files need to change.
 *
 * New code should import directly from the domain API files:
 *   import { fetchEmployees } from '../api/operations.api';
 *   import { getUsers }       from '../api/users.api';
 *   import { fetchAuditLogs } from '../api/shared.api';
 */
export * from "./operations.api.js";
export * from "./users.api.js";
export * from "./shared.api.js";
export * from "./finance.api.js";
