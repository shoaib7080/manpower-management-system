import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignSlot, fetchJobOrders } from "../../api/services";
import useDashboardStore from "../../store/useDashboardStore";
import AuditModal from "../modals/AuditModal";
import { isMobReady } from "./employeeUtils";

export default function AssignToJobModal({ emp, onClose }) {
  const qc = useQueryClient();
  const openAssignAudit = useDashboardStore((s) => s.openAssignAudit);
  const closeAuditModal = useDashboardStore((s) => s.closeAuditModal);

  const { data: jobOrders = [], isLoading } = useQuery({
    queryKey: ["jobOrders"],
    queryFn: async () => { const res = await fetchJobOrders(); return res.data; },
  });

  const assignMutation = useMutation({
    mutationFn: ({ joId, payload }) => assignSlot(joId, payload),
    onSuccess: () => {
      qc.invalidateQueries(["jobOrders"]);
      qc.invalidateQueries(["employees"]);
      closeAuditModal();
      onClose();
    },
  });

  const currentJobOrderId = emp.currentAssignment?.jobOrderId?.toString();

  const openSlots = [];
  jobOrders.forEach((jo) => {
    if (jo._id.toString() === currentJobOrderId) return;
    jo.slots.forEach((slot) => {
      if (slot.trade === emp.trade && slot.status === "UNASSIGNED")
        openSlots.push({ jo, slot });
    });
  });

  const handleSlotPick = ({ jo, slot }) => {
    onClose();
    openAssignAudit(jo._id, slot._id, emp);
  };

  const handleAuditConfirm = ({ pending, reasonForChange, authorizedBy }) => {
    const { action } = pending;
    assignMutation.mutate({
      joId: action.joId,
      payload: { slotId: action.slotIdx, employeeId: action.empId, reasonForChange, authorizedBy },
    });
  };

  return (
    <>
      <div className="overlay show" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal">
          <div className="modal-head">
            <h3>Assign {emp.name} — {emp.trade}</h3>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            {!isMobReady(emp) && (
              <div style={{ padding: "8px 12px", borderRadius: 4, fontSize: 12, background: "var(--red-bg)", borderLeft: "3px solid var(--red)", color: "var(--red)", marginBottom: 10 }}>
                This employee is missing a valid HSE Passport or CICPA Pass and cannot be assigned to any job.
              </div>
            )}
            {currentJobOrderId && (
              <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 10, padding: "6px 8px", background: "var(--gray-bg)", borderRadius: 4 }}>
                Currently assigned to: <b>{emp.currentAssignment?.siteName}</b>. Showing other available slots only.
              </div>
            )}
            {isLoading ? (
              <div className="empty-state">Loading job orders…</div>
            ) : openSlots.length === 0 ? (
              <div className="empty-state">No open {emp.trade} slots available in other job orders.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--line)" }}>
                    <th style={{ padding: "6px 8px", textAlign: "left" }}>Job Order</th>
                    <th style={{ padding: "6px 8px", textAlign: "left" }}>Site</th>
                    <th style={{ padding: "6px 8px", textAlign: "left" }}>Slot</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {openSlots.map(({ jo, slot }) => (
                    <tr key={slot._id} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td style={{ padding: "6px 8px" }} className="mono">{jo.jobOrderNumber}</td>
                      <td style={{ padding: "6px 8px" }}>{jo.siteName}</td>
                      <td style={{ padding: "6px 8px" }}>Slot {slot.slotNumber}</td>
                      <td style={{ padding: "6px 8px" }}>
                        <button className="btn btn-primary btn-sm" onClick={() => handleSlotPick({ jo, slot })}>
                          Assign Here
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="modal-foot">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
      <AuditModal onConfirm={handleAuditConfirm} />
    </>
  );
}
