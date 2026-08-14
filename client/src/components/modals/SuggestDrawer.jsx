import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import useDashboardStore from "../../store/useDashboardStore";
import { isMobReady } from "../manpower/employeeUtils";

function docLevel(doc) {
  if (!doc?.number && !doc?.expiry) return "gray";
  if (!doc.expiry) return "green";
  const now = new Date();
  const d = new Date(doc.expiry);
  if (d < now) return "red";
  const soon = new Date();
  soon.setDate(now.getDate() + 30);
  if (d < soon) return "yellow";
  return "green";
}

const CERT_TEXT = {
  green: "text-green-600",
  yellow: "text-amber-600",
  red: "text-error",
  gray: "text-outline",
};

export default function SuggestDrawer() {
  const { open, joId, slotId } = useDashboardStore((s) => s.ui.drawer);
  const closeDrawer = useDashboardStore((s) => s.closeDrawer);
  const openAssignAudit = useDashboardStore((s) => s.openAssignAudit);

  const qc = useQueryClient();
  const jobOrders = qc.getQueryData(["jobOrders"]) || [];
  const jo = open ? jobOrders.find((j) => j._id === joId) : null;
  const slot = jo ? jo.slots.find((s) => s._id === slotId) : null;

  if (!open || !slot) return null;

  const allEmployees = qc.getQueryData(["employees"])?.employees || [];
  const candidates = allEmployees.filter(
    (e) => e.trade === slot.trade && e.status === "AVAILABLE" && isMobReady(e),
  );
  const shown = candidates.slice(0, 4);

  return (
    <div
      className="absolute w-64 bg-surface-container-lowest border border-outline-variant shadow-[0_4px_12px_rgba(15,23,42,0.12)] rounded z-50 p-3"
      style={{ top: "40%", right: 24 }}
    >
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-outline-variant">
        <span className="text-label-sm uppercase tracking-wider text-on-surface">
          Suggested {slot.trade}s
        </span>
        <button
          className="text-on-surface-variant hover:text-on-surface"
          onClick={closeDrawer}
        >
          <X size={16} />
        </button>
      </div>

      {shown.length === 0 ? (
        <div className="text-center text-outline text-body-sm py-4">
          No available {slot.trade.toLowerCase()}s with both HSE Passport and
          CICPA Pass on record.
        </div>
      ) : (
        <div className="space-y-1">
          {shown.map((c) => {
            const hseLvl = docLevel(c.documents?.hsePassport);
            const cicpaLvl = docLevel(c.documents?.cicpaPass);
            const worst =
              hseLvl === "red" || cicpaLvl === "red"
                ? "red"
                : hseLvl === "yellow" || cicpaLvl === "yellow"
                  ? "yellow"
                  : "green";
            return (
              <div
                key={c._id}
                className="flex justify-between items-center p-2 hover:bg-surface-container-low rounded cursor-pointer group border border-transparent hover:border-outline-variant"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 bg-surface-container-high rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                    {c.name
                      ?.split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-label-sm text-on-surface truncate">
                      {c.name}
                    </div>
                    <div
                      className={`font-mono-data text-[9px] ${CERT_TEXT[worst]}`}
                    >
                      HSE &amp; CICPA {worst === "green" ? "valid" : "check"}
                    </div>
                  </div>
                </div>
                <button
                  className="w-6 h-6 bg-surface border border-outline-variant rounded flex items-center justify-center shrink-0 group-hover:bg-primary-container group-hover:text-on-primary group-hover:border-primary-container transition-colors"
                  onClick={() => openAssignAudit(joId, slotId, c)}
                >
                  +
                </button>
              </div>
            );
          })}
        </div>
      )}

      {candidates.length > shown.length && (
        <div className="mt-2 pt-2 border-t border-outline-variant text-center text-label-sm text-on-surface-variant">
          +{candidates.length - shown.length} more available
        </div>
      )}
    </div>
  );
}
