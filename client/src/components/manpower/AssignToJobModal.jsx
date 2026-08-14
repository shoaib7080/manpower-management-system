import { useQuery } from "@tanstack/react-query";
import { fetchJobOrders } from "../../api/services";
import useDashboardStore from "../../store/useDashboardStore";
import { isMobReady } from "./employeeUtils";
import {
  ModalBody,
  ModalFoot,
  ModalHead,
  ModalShell,
  Overlay,
  btnGhost,
} from "../ui/Modal";

const th =
  "px-2 py-1.5 text-left text-label-sm uppercase text-on-surface-variant border-b-2 border-outline-variant";
const td = "px-2 py-1.5 border-b border-outline-variant text-body-sm";

export default function AssignToJobModal({ emp, onClose }) {
  const openAssignAudit = useDashboardStore((s) => s.openAssignAudit);

  const { data: jobOrders = [], isLoading } = useQuery({
    queryKey: ["jobOrders"],
    queryFn: async () => {
      const res = await fetchJobOrders();
      return res.data;
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

  return (
    <Overlay onBackdropClick={onClose}>
      <ModalShell>
        <ModalHead
          title={`Assign ${emp.name} — ${emp.trade}`}
          onClose={onClose}
        />
        <ModalBody>
          {!isMobReady(emp) && (
            <div className="px-3 py-2 rounded text-body-sm bg-error-container/40 border-l-[3px] border-error text-on-error-container mb-2.5">
              This employee is missing a valid HSE Passport or CICPA Pass and
              cannot be assigned to any job.
            </div>
          )}
          {currentJobOrderId && (
            <div className="text-body-sm text-on-surface-variant mb-2.5 px-2 py-1.5 bg-surface-container-low rounded">
              Currently assigned to:{" "}
              <b className="text-on-surface font-semibold">
                {emp.currentAssignment?.siteName}
              </b>
              . Showing other available slots only.
            </div>
          )}
          {isLoading ? (
            <div className="text-center text-outline text-body-sm py-8">
              Loading job orders…
            </div>
          ) : openSlots.length === 0 ? (
            <div className="text-center text-outline text-body-sm py-8">
              No open {emp.trade} slots available in other job orders.
            </div>
          ) : (
            <table className="w-full border-collapse text-body-sm">
              <thead>
                <tr>
                  <th className={th}>Job Order</th>
                  <th className={th}>Site</th>
                  <th className={th}>Slot</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody>
                {openSlots.map(({ jo, slot }) => (
                  <tr key={slot._id}>
                    <td className={`${td} font-mono-data`}>
                      {jo.jobOrderNumber}
                    </td>
                    <td className={td}>{jo.siteName}</td>
                    <td className={td}>Slot {slot.slotNumber}</td>
                    <td className={td}>
                      <button
                        className="px-2.5 py-1 rounded text-label-sm bg-primary-container text-on-primary font-semibold hover:bg-primary"
                        onClick={() => {
                          onClose();
                          openAssignAudit(jo._id, slot._id, emp);
                        }}
                      >
                        Assign Here
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ModalBody>
        <ModalFoot>
          <button className={btnGhost} onClick={onClose}>
            Cancel
          </button>
        </ModalFoot>
      </ModalShell>
    </Overlay>
  );
}
