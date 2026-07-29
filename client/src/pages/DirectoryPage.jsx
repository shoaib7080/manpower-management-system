import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchEmployees } from "../api/services";
import ComplianceDot from "../components/ComplianceDot";
import StatusBadge from "../components/StatusBadge";
import AssignToJobModal from "../components/manpower/AssignToJobModal";
import EmployeeDetailModal from "../components/manpower/EmployeeDetailModal";
import ImportModal from "../components/manpower/ImportModal";
import {
  TRADES,
  getLevel,
  hasDoc,
  isMobReady,
} from "../components/manpower/employeeUtils";

const STATUS_TABS = [
  ["", "All Statuses"],
  ["AVAILABLE", "Available"],
  ["RESERVED", "Reserved"],
  ["BOOKED", "Booked"],
  ["MOBILIZED", "Mobilized"],
  ["VACATION", "Vacation / Halted"],
];

const DOC_TABS = [
  ["", "All"],
  ["HSE", "HSE Available"],
  ["CICPA", "CICPA Available"],
  ["BOTH", "Both Available"],
  ["NONE", "Both Missing"],
];

function DocCell({ doc }) {
  const has = !!(doc?.number || doc?.expiry);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span
        className="mono"
        style={{ fontSize: 10.5, color: has ? "var(--ink)" : "var(--text-3)" }}
      >
        {doc?.number || "—"}
      </span>
      <ComplianceDot level={!has ? "gray" : getLevel(doc?.expiry)} />
    </div>
  );
}

export default function DirectoryPage() {
  const [status, setStatus] = useState("");
  const [docFilter, setDocFilter] = useState("");
  const [trades, setTrades] = useState([]);
  const [search, setSearch] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [viewEmp, setViewEmp] = useState(null);
  const [assignEmp, setAssignEmp] = useState(null);

  // Fetch all employees once — all filtering is frontend-only
  const { data, isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await fetchEmployees({});
      return res.data;
    },
  });

  const allEmployees = data?.employees || [];
  const summary = data?.summary || {};

  const filtered = allEmployees.filter((e) => {
    if (status && e.status !== status) return false;
    if (
      trades.length &&
      !trades.some((tr) => e.trade?.toLowerCase().includes(tr.toLowerCase()))
    )
      return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !e.name?.toLowerCase().includes(q) &&
        !e.employeeId?.toLowerCase().includes(q) &&
        !e.emiratesId?.toLowerCase().includes(q)
      )
        return false;
    }
    if (docFilter) {
      const hse = hasDoc(e.documents?.hsePassport);
      const cicpa = hasDoc(e.documents?.cicpaPass);
      if (docFilter === "HSE" && !hse) return false;
      if (docFilter === "CICPA" && !cicpa) return false;
      if (docFilter === "BOTH" && !(hse && cicpa)) return false;
      if (docFilter === "NONE" && (hse || cicpa)) return false;
    }
    return true;
  });

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
          <span className="filter-label">Documents</span>
          {DOC_TABS.map(([val, label]) => (
            <button
              key={val}
              className={`tab-pill${docFilter === val ? " active" : ""}`}
              onClick={() => setDocFilter(val)}
            >
              {label.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="filter-row">
          <span className="filter-label">Trade</span>
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
              {filtered.map((e) => (
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
                      onClick={() => isMobReady(e) && setAssignEmp(e)}
                      disabled={!isMobReady(e)}
                      title={
                        !isMobReady(e)
                          ? "Missing HSE Passport or CICPA Pass — update documents first"
                          : "Assign to job"
                      }
                      style={
                        !isMobReady(e)
                          ? { opacity: 0.4, cursor: "not-allowed" }
                          : {}
                      }
                    >
                      Assign
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!isLoading && filtered.length === 0 && (
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
