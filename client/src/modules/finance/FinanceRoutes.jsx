import { Routes, Route, Navigate } from "react-router-dom";
import TimesheetsPage from "./pages/TimesheetsPage";

export default function FinanceRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="timesheets" replace />} />
      <Route path="timesheets" element={<TimesheetsPage />} />
    </Routes>
  );
}
