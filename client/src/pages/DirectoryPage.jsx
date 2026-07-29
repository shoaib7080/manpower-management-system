import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  assignSlot,
  deleteEmployee as deleteEmployeeApi,
  fetchEmployees,
  fetchJobOrders,
  updateEmployee as updateEmployeeApi,
} from "../api/services";
import ComplianceDot from "../components/ComplianceDot";
import StatusBadge from "../components/StatusBadge";
import ImportModal from "../components/manpower/ImportModal";
import AuditModal from "../components/modals/AuditModal";
import useDashboardStore from "../store/useDashboardStore";

const STATUS_TABS = [
  ["", "All Statuses"],
  ["AVAILABLE", "Available"],
  ["RESERVED", "Reserved"],
  ["BOOKED", "Booked"],
  ["MOBILIZED", "Mobilized"],
  ["VACATION", "Vacation / Halted"],
];

const TRADES = [
  "Supervisor",
  "Foreman",
  "Fabricator",
  "Welder",
  "Fitter",
  "Rigger",
  "Helper",
  "Other",
];

const EMP_STATUSES = [
  "AVAILABLE",
  "RESERVED",
  "BOOKED",
  "MOBILIZED",
  "VACATION",
  "HALTED",
];

function getLevel(date) {
  if (!date) return "gray";
  const now = new Date();
  const d = new Date(date);
  if (d < now) return "red";
  const soon = new Date();
  soon.setDate(now.getDate() + 30);
  if (d < soon) return "yellow";
  return "green";
}

function DocCell({ doc }) {
  const hasDoc = !!(doc?.number || doc?.expiry);
  const level = !hasDoc ? "gray" : getLevel(doc?.expiry);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span
        className="mono"
        style={{
          fontSize: 10.5,
          color: hasDoc ? "var(--ink)" : "var(--text-3)",
        }}
      >
        {doc?.number || "—"}
      </span>
      <ComplianceDot level={level} />
    </div>
  );
}

function toDateInput(val) {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d)) return "";
  return d.toISOString().split("T")[0];
}

// ── Employee Edit/View Modal ───────────────────────────────────────────────
function EmployeeDetailModal({ emp, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: emp.name || "",
    trade: emp.trade || "",
    status: emp.status || "AVAILABLE",
    dob: toDateInput(emp.dob),
    emiratesId: emp.emiratesId || "",
    passportNumber: emp.passportNumber || "",
    trainings: {
      adnocInductionExpiry: toDateInput(emp.trainings?.adnocInductionExpiry),
      h2sExpiry: toDateInput(emp.trainings?.h2sExpiry),
      medicalExpiry: toDateInput(emp.trainings?.medicalExpiry),
      seaSurvivalExpiry: toDateInput(emp.trainings?.seaSurvivalExpiry),
    },
    documents: {
      hsePassport: {
        number: emp.documents?.hsePassport?.number || "",
        expiry: toDateInput(emp.documents?.hsePassport?.expiry),
      },
      cicpaPass: {
        number: emp.documents?.cicpaPass?.number || "",
        expiry: toDateInput(emp.documents?.cicpaPass?.expiry),
      },
    },
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  const set = (path, val) =>
    setForm((prev) => {
      const next = { ...prev };
      const keys = path.split(".");
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = { ...cur[keys[i]] };
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = val;
      return next;
    });

  const updateMutation = useMutation({
    mutationFn: (payload) => updateEmployeeApi(emp._id, payload),
    onSuccess: () => {
      qc.invalidateQueries(["employees"]);
      onClose();
    },
    onError: (e) => setError(e.response?.data?.message || "Update failed."),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteEmployeeApi(emp._id),
    onSuccess: () => {
      qc.invalidateQueries(["employees"]);
      onClose();
    },
    onError: (e) => setError(e.response?.data?.message || "Delete failed."),
  });

  const handleSave = () => {
    setError("");
    updateMutation.mutate(form);
  };

  const fieldStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    marginBottom: 12,
  };
  const labelStyle = { fontSize: 11, color: "var(--text-2)", fontWeight: 600 };
  const inputStyle = {
    padding: "6px 8px",
    borderRadius: 4,
    border: "1px solid var(--line)",
    fontSize: 13,
    background: "var(--paper)",
    color: "var(--ink)",
  };
  const sectionStyle = {
    fontSize: 11,
    fontWeight: 700,
    color: "var(--text-3)",
    letterSpacing: ".05em",
    margin: "16px 0 8px",
    textTransform: "uppercase",
  };

  return (
    <div
      className="overlay show"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal"
        style={{
          maxWidth: 520,
          maxHeight: "85vh",
          overflowY: "auto",
          scrollbarWidth: "none",
        }}
      >
        <div className="modal-head">
          <h3>Edit — {emp.name}</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {error && (
            <div
              style={{ color: "var(--red)", fontSize: 12, marginBottom: 10 }}
            >
              {error}
            </div>
          )}

          <div style={sectionStyle}>Identity</div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <div style={fieldStyle}>
              <label style={labelStyle}>Employee ID (read-only)</label>
              <input
                style={{ ...inputStyle, opacity: 0.5 }}
                value={emp.employeeId}
                disabled
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Full Name *</label>
              <input
                style={inputStyle}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Trade *</label>
              <select
                style={inputStyle}
                value={form.trade}
                onChange={(e) => set("trade", e.target.value)}
              >
                {TRADES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Status</label>
              <select
                style={inputStyle}
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {EMP_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Date of Birth</label>
              <input
                type="date"
                style={inputStyle}
                value={form.dob}
                onChange={(e) => set("dob", e.target.value)}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Emirates ID</label>
              <input
                style={inputStyle}
                value={form.emiratesId}
                onChange={(e) => set("emiratesId", e.target.value)}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Passport Number</label>
              <input
                style={inputStyle}
                value={form.passportNumber}
                onChange={(e) => set("passportNumber", e.target.value)}
              />
            </div>
          </div>

          <div style={sectionStyle}>Documents</div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <div style={fieldStyle}>
              <label style={labelStyle}>HSE Passport No.</label>
              <input
                style={inputStyle}
                value={form.documents.hsePassport.number}
                onChange={(e) =>
                  set("documents.hsePassport.number", e.target.value)
                }
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>HSE Passport Expiry</label>
              <input
                type="date"
                style={inputStyle}
                value={form.documents.hsePassport.expiry}
                onChange={(e) =>
                  set("documents.hsePassport.expiry", e.target.value)
                }
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>CICPA No.</label>
              <input
                style={inputStyle}
                value={form.documents.cicpaPass.number}
                onChange={(e) =>
                  set("documents.cicpaPass.number", e.target.value)
                }
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>CICPA Expiry</label>
              <input
                type="date"
                style={inputStyle}
                value={form.documents.cicpaPass.expiry}
                onChange={(e) =>
                  set("documents.cicpaPass.expiry", e.target.value)
                }
              />
            </div>
          </div>

          <div style={sectionStyle}>Trainings</div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            {[
              ["ADNOC Induction Expiry", "trainings.adnocInductionExpiry"],
              ["H2S Expiry", "trainings.h2sExpiry"],
              ["Medical Expiry", "trainings.medicalExpiry"],
              ["Sea Survival Expiry", "trainings.seaSurvivalExpiry"],
            ].map(([label, path]) => (
              <div key={path} style={fieldStyle}>
                <label style={labelStyle}>{label}</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={path.split(".").reduce((o, k) => o?.[k], form) || ""}
                  onChange={(e) => set(path, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="modal-foot" style={{ justifyContent: "space-between" }}>
          {confirmDelete ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--red)" }}>
                Permanently delete?
              </span>
              <button
                className="btn btn-ghost"
                onClick={() => setConfirmDelete(false)}
              >
                No
              </button>
              <button
                className="btn"
                style={{ background: "var(--red)", color: "#fff" }}
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                {deleteMutation.isPending ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          ) : (
            <button
              className="btn btn-ghost"
              style={{ color: "var(--red)" }}
              onClick={() => setConfirmDelete(true)}
            >
              Delete Employee
            </button>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              disabled={updateMutation.isPending}
              onClick={handleSave}
            >
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Assign to Job Modal ────────────────────────────────────────────────────
function AssignToJobModal({ emp, onClose }) {
  const qc = useQueryClient();
  const openAssignAudit = useDashboardStore((s) => s.openAssignAudit);
  const closeAuditModal = useDashboardStore((s) => s.closeAuditModal);

  const { data: jobOrders = [], isLoading } = useQuery({
    queryKey: ["jobOrders"],
    queryFn: async () => {
      const res = await fetchJobOrders();
      return res.data;
    },
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

  // Open slots matching trade, excluding the employee's current job order
  const openSlots = [];
  jobOrders.forEach((jo) => {
    if (jo._id.toString() === currentJobOrderId) return; // skip current assignment
    jo.slots.forEach((slot) => {
      if (slot.trade === emp.trade && slot.status === "UNASSIGNED") {
        openSlots.push({ jo, slot });
      }
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
      payload: {
        slotId: action.slotIdx,
        employeeId: action.empId,
        reasonForChange,
        authorizedBy,
      },
    });
  };

  return (
    <>
      <div
        className="overlay show"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="modal">
          <div className="modal-head">
            <h3>
              Assign {emp.name} — {emp.trade}
            </h3>
            <button className="modal-close" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="modal-body">
            {currentJobOrderId && (
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-2)",
                  marginBottom: 10,
                  padding: "6px 8px",
                  background: "var(--gray-bg)",
                  borderRadius: 4,
                }}
              >
                Currently assigned to: <b>{emp.currentAssignment?.siteName}</b>.
                Showing other available slots only.
              </div>
            )}
            {isLoading ? (
              <div className="empty-state">Loading job orders…</div>
            ) : openSlots.length === 0 ? (
              <div className="empty-state">
                No open {emp.trade} slots available in other job orders.
              </div>
            ) : (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--line)" }}>
                    <th style={{ padding: "6px 8px", textAlign: "left" }}>
                      Job Order
                    </th>
                    <th style={{ padding: "6px 8px", textAlign: "left" }}>
                      Site
                    </th>
                    <th style={{ padding: "6px 8px", textAlign: "left" }}>
                      Slot
                    </th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {openSlots.map(({ jo, slot }) => (
                    <tr
                      key={slot._id}
                      style={{ borderBottom: "1px solid var(--line)" }}
                    >
                      <td style={{ padding: "6px 8px" }} className="mono">
                        {jo.jobOrderNumber}
                      </td>
                      <td style={{ padding: "6px 8px" }}>{jo.siteName}</td>
                      <td style={{ padding: "6px 8px" }}>
                        Slot {slot.slotNumber}
                      </td>
                      <td style={{ padding: "6px 8px" }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleSlotPick({ jo, slot })}
                        >
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
            <button className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
      <AuditModal onConfirm={handleAuditConfirm} />
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function DirectoryPage() {
  const [status, setStatus] = useState("");
  const [compliance, setCompliance] = useState("");
  const [trades, setTrades] = useState([]);
  const [search, setSearch] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [viewEmp, setViewEmp] = useState(null);
  const [assignEmp, setAssignEmp] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["employees", search, trades.join(","), status, compliance],
    queryFn: async () => {
      const res = await fetchEmployees({
        search,
        trade: trades.join(","),
        status,
        compliance,
      });
      return res.data;
    },
  });

  const employees = data?.employees || [];
  const summary = data?.summary || {};

  const toggleTrade = (tr) =>
    setTrades((prev) =>
      prev.includes(tr) ? prev.filter((t) => t !== tr) : [...prev, tr],
    );

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Master Personnel Directory</h1>
          <div className="sub">
            Single source of truth for every tradesman — status, trade & ADNOC
            clearance at a glance.
          </div>
        </div>
        <div className="btn-row">
          <button
            className="btn btn-outline"
            onClick={() => setImportOpen(true)}
          >
            ↑ Import Excel Data
          </button>
          <button className="btn btn-primary">+ Add New Employee</button>
        </div>
      </div>

      <div className="summary-row">
        <div className="summary-card sc-red">
          <div>
            <div className="num">{summary.expiredTrainings ?? 0}</div>
            <div className="lbl">Expired Certs</div>
          </div>
        </div>
        <div className="summary-card sc-red">
          <div>
            <div className="num">
              {(summary.total ?? 0) -
                (summary.available ?? 0) -
                (summary.booked ?? 0) -
                (summary.mobilized ?? 0) -
                (summary.reserved ?? 0)}
            </div>
            <div className="lbl">Vacation / Halted</div>
          </div>
        </div>
        <div className="summary-card sc-yellow">
          <div>
            <div className="num">{summary.reserved ?? 0}</div>
            <div className="lbl">Reserved</div>
          </div>
        </div>
        <div className="summary-card sc-teal">
          <div>
            <div className="num">{summary.total ?? 0}</div>
            <div className="lbl">Total Workforce</div>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-row">
          <span className="filter-label">Status</span>
          {STATUS_TABS.map(([val, label]) => (
            <button
              key={val}
              className={`tab-pill${status === val ? " active" : ""}`}
              onClick={() => setStatus(val)}
            >
              {label.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="filter-row">
          <span className="filter-label">Compliance</span>
          <select
            className="ff"
            value={compliance}
            onChange={(e) => setCompliance(e.target.value)}
          >
            <option value="">All Compliance</option>
            <option value="INCOMPLETE">Not Ready / Incomplete</option>
            <option value="EXPIRED">Expired</option>
            <option value="EXPIRING_SOON">Expiring in 30 Days</option>
            <option value="READY">Compliant / Ready</option>
          </select>
          <span className="filter-label" style={{ marginLeft: 8 }}>
            Trade
          </span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {TRADES.map((tr) => (
              <button
                key={tr}
                className={`chip${trades.includes(tr) ? " active" : ""}`}
                onClick={() => toggleTrade(tr)}
              >
                {tr}
              </button>
            ))}
          </div>
          <input
            className="ff"
            style={{ marginLeft: "auto" }}
            type="text"
            placeholder="Search name or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-wrap">
        {isLoading ? (
          <div className="empty-state">Loading personnel registry…</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name & Trade</th>
                <th>Emirates ID / Passport</th>
                <th>Status</th>
                <th>HSE Passport</th>
                <th>CICPA Pass</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e._id}>
                  <td className="mono">{e.employeeId}</td>
                  <td>
                    <div className="emp-name">{e.name}</div>
                    <div className="emp-trade">{e.trade}</div>
                  </td>
                  <td className="mono">
                    {e.emiratesId || e.passportNumber || "—"}
                  </td>
                  <td>
                    <StatusBadge status={e.status} />
                  </td>
                  <td>
                    <DocCell doc={e.documents?.hsePassport} />
                  </td>
                  <td>
                    <DocCell doc={e.documents?.cicpaPass} />
                  </td>
                  <td>
                    <button className="icon-btn" onClick={() => setViewEmp(e)}>
                      View
                    </button>
                    <button
                      className="icon-btn"
                      onClick={() => setAssignEmp(e)}
                    >
                      Assign
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!isLoading && employees.length === 0 && (
          <div className="empty-state">
            No personnel match the current filters.
          </div>
        )}
      </div>

      {importOpen && <ImportModal onClose={() => setImportOpen(false)} />}
      {viewEmp && (
        <EmployeeDetailModal emp={viewEmp} onClose={() => setViewEmp(null)} />
      )}
      {assignEmp && (
        <AssignToJobModal emp={assignEmp} onClose={() => setAssignEmp(null)} />
      )}
    </div>
  );
}
