import { useQueryClient } from "@tanstack/react-query";
import useDashboardStore from "../../store/useDashboardStore";

// An employee is mobilization-ready if either number or expiry is recorded for BOTH documents
function isMobReady(emp) {
  const hse = emp.documents?.hsePassport;
  const cicpa = emp.documents?.cicpaPass;
  const hasHse = !!(hse?.number || hse?.expiry);
  const hasCicpa = !!(cicpa?.number || cicpa?.expiry);
  return hasHse && hasCicpa;
}

function docLevel(doc) {
  if (!doc?.number && !doc?.expiry) return "gray";
  if (!doc.expiry) return "green"; // number present, no expiry tracked — treat as present
  const now = new Date();
  const d = new Date(doc.expiry);
  if (d < now) return "red";
  const soon = new Date();
  soon.setDate(now.getDate() + 30);
  if (d < soon) return "yellow";
  return "green";
}

const DOC_BADGE_CLS = {
  green: "bg-green-100 text-green-800 border-green-200",
  yellow: "bg-amber-100 text-amber-800 border-amber-200",
  red: "bg-red-100 text-red-800 border-red-200",
  gray: "bg-surface-container-low text-outline border-outline-variant",
};

function DocBadge({ label, doc }) {
  const level = docLevel(doc);
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-semibold border ${DOC_BADGE_CLS[level]}`}
    >
      {level === "gray" ? "✗" : "✓"} {label}
    </span>
  );
}

export default function SuggestDrawer() {
  const { open, joId, slotId } = useDashboardStore((s) => s.ui.drawer);
  const closeDrawer = useDashboardStore((s) => s.closeDrawer);
  const openAssignAudit = useDashboardStore((s) => s.openAssignAudit);

  const qc = useQueryClient();
  const jobOrders = qc.getQueryData(["jobOrders"]) || [];
  const jo = open ? jobOrders.find((j) => j._id === joId) : null;
  const slot = jo ? jo.slots.find((s) => s._id === slotId) : null;

  const allEmployees = qc.getQueryData(["employees"])?.employees || [];
  const candidates = slot
    ? allEmployees.filter(
        (e) =>
          e.trade === slot.trade && e.status === "AVAILABLE" && isMobReady(e),
      )
    : [];

  return (
    <>
      <div
        className={`fixed inset-0 bg-on-background/40 z-40 transition-opacity ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={closeDrawer}
      />
      <div
        className={`fixed top-0 right-0 h-screen w-[380px] max-w-[92vw] bg-surface-container-lowest shadow-[0_4px_12px_rgba(15,23,42,0.08)] z-50 border-l border-outline-variant flex flex-col transition-transform duration-200 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {slot && (
          <>
            <div className="px-[18px] py-4 border-b border-outline-variant">
              <h3 className="text-body-lg font-semibold text-on-surface">
                Suggested {slot.trade}s
              </h3>
              <div className="text-body-sm text-on-surface-variant mt-0.5">
                {jo.jobOrderNumber} · {slot.trade} Slot {slot.slotNumber} · HSE
                Passport & CICPA required
              </div>
            </div>
            <div className="px-[18px] py-3.5 overflow-y-auto flex-1">
              {candidates.length === 0 ? (
                <div className="text-center text-outline text-body-sm py-8">
                  No available {slot.trade.toLowerCase()}s with both HSE
                  Passport and CICPA Pass on record.
                </div>
              ) : (
                candidates.map((c) => (
                  <div
                    className="border border-outline-variant rounded-lg p-3 mb-2.5 flex justify-between items-center gap-2.5"
                    key={c._id}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-body-sm text-on-surface">
                        {c.name}
                      </div>
                      <div className="font-mono-data text-[11px] text-on-surface-variant mt-0.5">
                        {c.employeeId}
                      </div>
                      <div className="flex gap-1.5 mt-1.5">
                        <DocBadge label="HSE" doc={c.documents?.hsePassport} />
                        <DocBadge label="CICPA" doc={c.documents?.cicpaPass} />
                      </div>
                    </div>
                    <button
                      className="px-3 py-1.5 rounded text-label-sm bg-primary-container text-on-primary font-semibold hover:bg-primary shrink-0"
                      onClick={() => openAssignAudit(joId, slotId, c)}
                    >
                      Assign
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
