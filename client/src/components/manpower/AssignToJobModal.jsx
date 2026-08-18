import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Calendar, CheckCircle2, Circle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchJobOrders } from "../../api/services";
import useDashboardStore from "../../store/useDashboardStore";
import { isMobReady } from "./employeeUtils";
import {
  Overlay,
  WarnBox,
  btnGhost,
  btnPrimary,
} from "../ui/Modal";

const fmt = (d) => {
  if (!d) return "TBD";
  const date = new Date(d);
  if (isNaN(date)) return "TBD";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const calculate90DayDemob = (date) => {
  const d = new Date(date || Date.now());
  d.setDate(d.getDate() + 90);
  return d;
};

export default function AssignToJobModal({ emp, onClose }) {
  const openAssignAudit = useDashboardStore((s) => s.openAssignAudit);
  const [selectedJoId, setSelectedJoId] = useState(null);

  const { data: jobOrders = [], isLoading } = useQuery({
    queryKey: ["jobOrders"],
    queryFn: async () => {
      const res = await fetchJobOrders();
      return res.data;
    },
  });

  const currentJobOrderId = emp.currentAssignment?.jobOrderId?.toString();

  // Filter to active job orders that have at least 1 UNASSIGNED slot matching the employee's trade
  const matchingJobOrders = jobOrders
    .filter(
      (jo) =>
        jo.status !== "Completed" && jo._id.toString() !== currentJobOrderId,
    )
    .map((jo) => {
      const availableSlots = (jo.slots || []).filter(
        (slot) => slot.trade === emp.trade && slot.status === "UNASSIGNED",
      );
      return { jo, availableSlots };
    })
    .filter((item) => item.availableSlots.length > 0);

  // Auto-select the first matching job order if not selected yet
  useEffect(() => {
    if (matchingJobOrders.length > 0 && !selectedJoId) {
      setSelectedJoId(matchingJobOrders[0].jo._id);
    }
  }, [matchingJobOrders, selectedJoId]);

  const selectedMatch = matchingJobOrders.find(
    (item) => item.jo._id === selectedJoId,
  );
  const firstAvailableSlot = selectedMatch?.availableSlots?.[0] || null;

  const handleAssign = () => {
    if (!selectedMatch || !firstAvailableSlot) return;
    onClose();
    openAssignAudit(selectedMatch.jo._id, firstAvailableSlot._id, emp);
  };

  const mobReady = isMobReady(emp);

  return (
    <Overlay onBackdropClick={onClose}>
      <div className="bg-surface-container-lowest w-full max-w-[620px] rounded-xl flex flex-col shadow-[0_6px_20px_rgba(15,23,42,0.12)] border border-outline-variant overflow-hidden">
        {/* Modal Header */}
        <div className="px-[18px] py-3.5 border-b border-outline-variant flex items-start justify-between">
          <div>
            <h2 className="text-body-lg font-semibold text-on-surface">
              Assign Personnel to Job Order
            </h2>
            <div className="text-body-sm text-on-surface-variant mt-0.5 flex items-center gap-2">
              <span className="font-semibold text-on-surface">{emp.name}</span>
              <span className="text-outline">·</span>
              <span>{emp.employeeId}</span>
              <span className="text-outline">·</span>
              <span className="font-medium text-primary">{emp.trade}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[75vh]">
          {/* Readiness Alert if document is missing */}
          {!mobReady && (
            <div className="p-3 rounded-lg text-body-sm bg-error-container/40 border border-error/30 text-on-error-container flex items-start gap-2.5">
              <AlertCircle size={17} className="text-error shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Mobilization Gated:</span> This
                employee is missing valid HSE Passport or CICPA Pass availability
                and cannot be deployed until documents are confirmed.
              </div>
            </div>
          )}

          {currentJobOrderId && (
            <div className="text-body-sm text-on-surface-variant p-2.5 bg-surface-container-low border border-outline-variant/60 rounded-lg">
              Currently assigned to:{" "}
              <b className="text-on-surface font-semibold">
                {emp.currentAssignment?.siteName}
              </b>
              . Showing other available matching job orders only.
            </div>
          )}

          {/* Section Header: Matching Active Job Orders */}
          <div className="flex items-center justify-between">
            <h3 className="text-label-sm uppercase text-on-surface-variant">
              Matching Active Job Orders
            </h3>
            <span className="px-2 py-0.5 rounded border border-outline-variant text-outline text-[10px] font-semibold tracking-wide">
              {emp.trade}
            </span>
          </div>

          {isLoading ? (
            <div className="text-center text-outline text-body-sm py-10">
              Loading active job orders…
            </div>
          ) : matchingJobOrders.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-outline-variant rounded-xl text-outline text-body-sm bg-surface-container-low/30">
              No active job orders currently have open slots requiring{" "}
              <b className="text-on-surface">{emp.trade}</b>.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1">
              {matchingJobOrders.map(({ jo, availableSlots }) => {
                const isSelected = selectedJoId === jo._id;
                const startDateStr = fmt(jo.startDate);
                const demobDateStr = fmt(
                  jo.targetDemobDate || calculate90DayDemob(jo.startDate),
                );
                const slotsCount = availableSlots.length;
                const isAmple = slotsCount >= 3;

                return (
                  <div
                    key={jo._id}
                    onClick={() => setSelectedJoId(jo._id)}
                    className={`p-2.5 rounded-lg border cursor-pointer flex flex-col gap-1.5 transition-colors ${
                      isSelected
                        ? "border-primary-container bg-surface-container-low"
                        : "border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-on-surface text-body-sm truncate">
                          {jo.siteName}
                        </div>
                        <div className="text-label-sm text-on-surface-variant mt-0.5">
                          {jo.clientCategory || "ADNOC Offshore"}
                        </div>
                      </div>
                      <div className="shrink-0 mt-0.5">
                        {isSelected ? (
                          <div className="w-4 h-4 rounded-full bg-primary-container flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-on-primary" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-outline-variant" />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-label-sm text-on-surface-variant">
                      <Calendar size={11} className="text-outline shrink-0" />
                      <span>{startDateStr} – {demobDateStr}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-outline-variant/60">
                      <span className="text-[10px] font-mono-data text-outline">{jo.jobOrderNumber}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                        isAmple
                          ? "bg-teal-50 text-teal-700 border-teal-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {slotsCount} {slotsCount === 1 ? "slot" : "slots"}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="text-[10px] text-primary-container font-semibold">
                        Assigns Slot #{availableSlots[0]?.slotNumber}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-[18px] py-3 border-t border-outline-variant bg-surface-container-low flex justify-end gap-2 shrink-0">
          <button type="button" onClick={onClose} className={btnGhost}>
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedMatch || !mobReady}
            onClick={handleAssign}
            className={`${btnPrimary} disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {selectedMatch
              ? `Assign to Slot #${firstAvailableSlot?.slotNumber || 1}`
              : "Select a Job Order"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}
