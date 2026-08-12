import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import DashboardLayout from "./layouts/DashboardLayout";
import AuditLogPage from "./pages/AuditLogPage";
import DirectoryPage from "./pages/DirectoryPage";
import ErrorPage, { PageErrorElement } from "./pages/ErrorPage";
import JobOrdersPage from "./pages/JobOrdersPage";
import LoginPage from "./pages/LoginPage";
import SpecializationsPage from "./pages/SpecializationsPage";
import UsersPage from "./pages/UserPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <DashboardLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Navigate to="/directory" replace /> },
      {
        path: "directory",
        element: <DirectoryPage />,
        errorElement: <PageErrorElement />,
      },
      {
        path: "job-orders",
        element: <JobOrdersPage />,
        errorElement: <PageErrorElement />,
      },
      {
        path: "audit-log",
        element: <AuditLogPage />,
        errorElement: <PageErrorElement />,
      },
      {
        path: "users",
        element: <UsersPage />,
        errorElement: <PageErrorElement />,
      },
      {
        path: "specializations",
        element: <SpecializationsPage />,
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
