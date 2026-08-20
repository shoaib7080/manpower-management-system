import { useAuth } from '../context/AuthContext';

/**
 * Frontend mirror of the backend requireModuleLevel middleware.
 * Reads the logged-in user's permissions object and returns
 * computed booleans for conditional rendering.
 *
 * @param {string} moduleName - e.g. 'operations' | 'finance'
 * @returns {{
 *   level: number,
 *   canView: boolean,
 *   canOperate: boolean,
 *   isAdmin: boolean,
 *   isSuperAdmin: boolean,
 *   hasLevel: (n: number) => boolean
 * }}
 *
 * Usage:
 *   const { canOperate, isAdmin } = usePermissions('operations');
 *   {canOperate && <button>Add Employee</button>}
 *   {isAdmin && <button>Delete</button>}
 */
export default function usePermissions(moduleName) {
  const { user } = useAuth();
  const permissions = user?.permissions ?? {};
  const isSuperAdmin = permissions.superAdmin === true;

  // SuperAdmins always get the maximum level (3) for any module check
  const level = isSuperAdmin ? 3 : (permissions[moduleName] ?? 0);

  return {
    level,
    canView:    isSuperAdmin || level >= 1,
    canOperate: isSuperAdmin || level >= 2,
    isAdmin:    isSuperAdmin || level >= 3,
    isSuperAdmin,
    hasLevel: (n) => isSuperAdmin || level >= n,
  };
}
