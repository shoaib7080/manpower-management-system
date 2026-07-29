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

function DocBadge({ label, doc }) {
  const level = docLevel(doc);
  const colors = {
    green: {
      bg: "var(--green-bg)",
      color: "var(--green)",
      border: "var(--green)",
    },
    yellow: {
      bg: "var(--yellow-bg)",
      color: "var(--yellow)",
      border: "var(--yellow)",
    },
    red: { bg: "var(--red-bg)", color: "var(--red)", border: "var(--red)" },
    gray: {
      bg: "var(--gray-bg)",
      color: "var(--gray)",
      border: "var(--line-strong)",
    },
  }[level];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 7px",
        borderRadius: 3,
        fontSize: 10.5,
        fontWeight: 600,
        background: colors.bg,
        color: colors.color,
        border: `1px solid ${colors.border}`,
      }}
    >
      {level === "gray" ? "✗" : "✓"} {label}
    </span>
  );
}

function getComplianceLevel(trainings) {
  if (!trainings) return "gray";
  const now = new Date();
  const soon = new Date();
  soon.setDate(now.getDate() + 30);
  const fields = [
    "adnocInductionExpiry",
    "h2sExpiry",
    "medicalExpiry",
    "seaSurvivalExpiry",
  ];
  const dates = fields.map((f) =>
    trainings[f] ? new Date(trainings[f]) : null,
  );
  if (dates.some((d) => !d)) return "gray";
  if (dates.some((d) => d < now)) return "red";
  if (dates.some((d) => d < soon)) return "yellow";
  return "green";
}

export default function SuggestDrawer() {
  const { open, joId, slotIdx, slotId } = useDashboardStore((s) => s.ui.drawer);
  const closeDrawer = useDashboardStore((s) => s.closeDrawer);
  const openAssignAudit = useDashboardStore((s) => s.openAssignAudit);

  const qc = useQueryClient();
  const jobOrders = qc.getQueryData(["jobOrders"]) || [];
  const jo = open ? jobOrders.find((j) => j._id === joId) : null;
  const slot = jo ? jo.slots[slotIdx] : null;

  const allEmployees =
    qc.getQueryData(["employees", "", "", "", ""])?.employees || [];
  const candidates = slot
    ? allEmployees.filter(
        (e) =>
          e.trade === slot.trade && e.status === "AVAILABLE" && isMobReady(e),
      )
    : [];

  return (
    <>
      <div
        className={`drawer-overlay${open ? " show" : ""}`}
        onClick={closeDrawer}
      />
      <div className={`drawer${open ? " show" : ""}`}>
        {slot && (
          <>
            <div className="drawer-head">
              <h3>Suggested {slot.trade}s</h3>
              <div className="sub">
                {jo.jobOrderNumber} · {slot.trade} Slot {slot.slotNumber} · HSE
                Passport & CICPA required
              </div>
            </div>
            <div className="drawer-body">
              {candidates.length === 0 ? (
                <div className="empty-state">
                  No available {slot.trade.toLowerCase()}s with both HSE
                  Passport and CICPA Pass on record.
                </div>
              ) : (
                candidates.map((c) => (
                  <div className="cand-card" key={c._id}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="cand-name">{c.name}</div>
                      <div className="cand-meta mono">{c.employeeId}</div>
                      <div
                        className="cand-check"
                        style={{ marginTop: 6, gap: 5 }}
                      >
                        <DocBadge label="HSE" doc={c.documents?.hsePassport} />
                        <DocBadge label="CICPA" doc={c.documents?.cicpaPass} />
                      </div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
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
