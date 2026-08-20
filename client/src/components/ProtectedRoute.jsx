import { Navigate } from 'react-router-dom';
import usePermissions from '../hooks/usePermissions';

/**
 * Route-level RBAC wrapper.
 * Redirects unauthenticated users or users without required permission to '/'.
 *
 * Props:
 *   module        {string}  - Module to check ('operations' | 'finance')
 *   level         {number}  - Minimum required level (default: 1 = viewer)
 *   superAdminOnly {boolean} - If true, only superAdmin: true passes
 *   children      {ReactNode}
 *
 * Usage in App.jsx:
 *   <ProtectedRoute module="operations" level={3}>
 *     <TradesPage />
 *   </ProtectedRoute>
 *
 *   <ProtectedRoute superAdminOnly>
 *     <UsersPage />
 *   </ProtectedRoute>
 */
export default function ProtectedRoute({
  children,
  module: moduleName,
  level = 1,
  superAdminOnly = false,
}) {
  const perms = usePermissions(moduleName);

  if (superAdminOnly && !perms.isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  if (moduleName && !perms.hasLevel(level)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
