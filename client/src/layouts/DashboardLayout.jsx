import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Outlet } from "react-router-dom";
import { assignSlot, releaseSlot } from "../api/services";
import AdminOverrideModal from "../components/modals/AdminOverrideModal";
import AuditModal from "../components/modals/AuditModal";
import SuggestDrawer from "../components/modals/SuggestDrawer";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/layout/Topbar";
import useDashboardStore from "../store/useDashboardStore";

// Add this to services.js if not present:
// export const updateSlotPipeline = (jobOrderId, payload) =>
//   api.put(`/job-orders/${jobOrderId}/update-slot-pipeline`, payload);

import { updateSlotPipeline } from "../api/services";

export default function DashboardLayout() {
  const qc = useQueryClient();
  const closeAuditModal = useDashboardStore((s) => s.closeAuditModal);

  const assignMutation = useMutation({
    mutationFn: ({ joId, payload }) => assignSlot(joId, payload),
    onSuccess: () => {
      qc.invalidateQueries(["jobOrders"]);
      qc.invalidateQueries(["employees"]);
      closeAuditModal();
    },
  });

  const pipelineMutation = useMutation({
    mutationFn: ({ joId, payload }) => updateSlotPipeline(joId, payload),
    onSuccess: () => {
      qc.invalidateQueries(["jobOrders"]);
      qc.invalidateQueries(["employees"]);
      closeAuditModal();
    },
  });

  const releaseMutation = useMutation({
    mutationFn: ({ joId, payload }) => releaseSlot(joId, payload),
    onSuccess: () => {
      qc.invalidateQueries(["jobOrders"]);
      qc.invalidateQueries(["employees"]);
      closeAuditModal();
    },
  });

  const handleAuditConfirm = ({ pending, reasonForChange, authorizedBy }) => {
    const { action } = pending;
    if (action.type === "assign") {
      assignMutation.mutate({
        joId: action.joId,
        payload: {
          slotId: action.slotIdx,
          employeeId: action.empId,
          reasonForChange,
          authorizedBy,
        },
      });
    } else if (action.type === "advance") {
      pipelineMutation.mutate({
        joId: action.joId,
        payload: {
          slotId: action.slotIdx,
          targetStatus: action.targetStatus,
          reasonForChange,
          authorizedBy,
        },
      });
    } else if (action.type === "release") {
      releaseMutation.mutate({
        joId: action.joId,
        payload: { slotId: action.slotIdx, reasonForChange, authorizedBy },
      });
    }
  };

  return (
    <div className="grid grid-cols-[232px_1fr] min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col min-h-screen">
        <Topbar />
        <main className="p-[24px_30px_60px] max-w-[1360px] w-full">
          <Outlet />
        </main>
      </div>
      <SuggestDrawer />
      <AuditModal onConfirm={handleAuditConfirm} />
      <AdminOverrideModal />
    </div>
  );
}
