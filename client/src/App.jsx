import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import AuditLogPage from "./pages/AuditLogPage";
import DirectoryPage from "./pages/DirectoryPage";
import ErrorPage, { PageErrorElement } from "./pages/ErrorPage";
import JobOrdersPage from "./pages/JobOrdersPage";
import EditJobOrderPage from "./pages/EditJobOrderPage";
import LoginPage from "./pages/LoginPage";
import SpecializationsPage from "./pages/SpecializationsPage";
import StaffPage from "./pages/StaffPage";
import TradesPage from "./pages/TradesPage";
import UsersPage from "./pages/UserPage";
import DashboardPage from "./pages/DashboardPage";

const TimesheetsPage = lazy(
  () => import("./modules/finance/pages/TimesheetsPage"),
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <DashboardLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute module="operations" level={1}>
            <DashboardPage />
          </ProtectedRoute>
        ),
        errorElement: <PageErrorElement />,
      },
      {
        path: "directory",
        element: (
          <ProtectedRoute module="operations" level={1}>
            <DirectoryPage />
          </ProtectedRoute>
        ),
        errorElement: <PageErrorElement />,
      },
      {
        path: "job-orders",
        element: (
          <ProtectedRoute module="operations" level={1}>
            <JobOrdersPage />
          </ProtectedRoute>
        ),
        errorElement: <PageErrorElement />,
      },
      {
        path: "job-orders/:id/edit",
        element: (
          <ProtectedRoute module="operations" level={2}>
            <EditJobOrderPage />
          </ProtectedRoute>
        ),
        errorElement: <PageErrorElement />,
      },
      {
        path: "audit-log",
        element: (
          <ProtectedRoute module="operations" level={1}>
            <AuditLogPage />
          </ProtectedRoute>
        ),
        errorElement: <PageErrorElement />,
      },
      {
        path: "trades",
        element: (
          <ProtectedRoute module="operations" level={3}>
            <TradesPage />
          </ProtectedRoute>
        ),
        errorElement: <PageErrorElement />,
      },
      {
        path: "specializations",
        element: (
          <ProtectedRoute module="operations" level={3}>
            <SpecializationsPage />
          </ProtectedRoute>
        ),
        errorElement: <PageErrorElement />,
      },
      {
        path: "staff",
        element: (
          <ProtectedRoute module="operations" level={3}>
            <StaffPage />
          </ProtectedRoute>
        ),
        errorElement: <PageErrorElement />,
      },
      {
        path: "users",
        element: (
          <ProtectedRoute superAdminOnly>
            <UsersPage />
          </ProtectedRoute>
        ),
        errorElement: <PageErrorElement />,
      },

      // ── Finance ───────────────────────────────────────────────────────────
      {
        path: "finance",
        element: <Navigate to="/finance/timesheets" replace />,
      },
      {
        path: "finance/timesheets",
        element: (
          <ProtectedRoute module="finance" level={1}>
            <Suspense
              fallback={
                <div className="p-6 text-xs text-slate-500">Loading…</div>
              }
            >
              <TimesheetsPage />
            </Suspense>
          </ProtectedRoute>
        ),
        errorElement: <PageErrorElement />,
      },
    ],
  },
]);

function MainLayout() {
  const { isAuthenticated, loading } = useAuth();
  if (loading)
    return <div className="p-6 text-xs text-slate-500">Loading Session...</div>;
  if (!isAuthenticated) return <LoginPage />;
  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
