import { useQuery } from "@tanstack/react-query";
import { CircleCheck, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { fetchEmployees } from "../api/services";
import ComplianceDot from "../components/ComplianceDot";
import StatusBadge from "../components/StatusBadge";
import AssignToJobModal from "../components/manpower/AssignToJobModal";
import CreateEmployeeModal from "../components/manpower/CreateEmployeeModal";
import EmployeeDetailModal from "../components/manpower/EmployeeDetailModal";
import ImportModal from "../components/manpower/ImportModal";
import useTrades from "../hooks/useTrades";
import {
  getLevel,
  hasDoc,
  isMobReady,
} from "../components/manpower/employeeUtils";

const STATUSES = ["AVAILABLE", "RESERVED", "BOOKED", "MOBILIZED", "VACATION"];
const STATUS_LABELS = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  BOOKED: "Booked",
  MOBILIZED: "Mobilized",
  VACATION: "Vacation / Halted",
};

const DOC_OPTIONS = [
  ["", "All"],
  ["HSE", "HSE Available"],
  ["CICPA", "CICPA Available"],
  ["BOTH", "Both Documents"],
  ["NONE", "Missing Both"],
];

const btnBase =
  "inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-label-md whitespace-nowrap";
const btnOutline = `${btnBase} border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low`;
const btnPrimary = `${btnBase} bg-primary-container text-on-primary font-semibold hover:bg-primary`;
const iconBtn =
  "px-2.5 py-1.5 rounded border border-outline-variant bg-surface-container-lowest text-label-sm text-on-surface-variant hover:bg-surface-container-low mr-1 disabled:hover:bg-surface-container-lowest";

function DocCell({ doc }) {
  const isAvailable = Boolean(doc?.available);
  if (!isAvailable) {
    return <span className="text-outline font-semibold">—</span>;
  }
  return (
    <div
      className="flex items-center gap-1.5"
      title={`Available (No: ${doc?.number || "N/A"})`}
    >
      <div className="w-5 h-5 rounded-full bg-green/10 flex items-center justify-center text-green shrink-0">
        <CircleCheck
          size={13}
          className="text-green-500"
          title={`Available (No: ${doc?.number || "N/A"})`}
        />
      </div>
    </div>
  );
}

export default function DirectoryPage() {
  const { trades: availableTrades = [] } = useTrades();
  const [statuses, setStatuses] = useState([]);
  const [docFilter, setDocFilter] = useState("");
  const [trades, setTrades] = useState([]);
  const [search, setSearch] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [viewEmp, setViewEmp] = useState(null);
  const [assignEmp, setAssignEmp] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await fetchEmployees({});
      return res.data;
    },
  });

  const allEmployees = useMemo(() => data?.employees || [], [data]);
  const summary = data?.summary || {};

  const tradeCounts = useMemo(() => {
    const counts = {};
    for (const e of allEmployees) counts[e.trade] = (counts[e.trade] || 0) + 1;
    return counts;
  }, [allEmployees]);

  const filtered = allEmployees.filter((e) => {
    if (statuses.length && !statuses.includes(e.status)) return false;
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
  const toggleStatus = (st) =>
    setStatuses((prev) =>
      prev.includes(st) ? prev.filter((s) => s !== st) : [...prev, st],
    );
  const resetFilters = () => {
    setStatuses([]);
    setTrades([]);
    setDocFilter("");
  };

  const vacationCount =
    (summary.total ?? 0) -
    (summary.available ?? 0) -
    (summary.booked ?? 0) -
    (summary.mobilized ?? 0) -
    (summary.reserved ?? 0);

  return (
    <div>
      <div className="flex items-start justify-between gap-5 flex-wrap mb-1">
        <div>
          <h1 className="text-headline-sm text-on-background">
            Master Personnel Directory
          </h1>
          <div className="text-body-sm text-on-surface-variant mt-1">
            Single source of truth for every tradesman — status, trade & safety
            clearance at a glance.
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button className={btnOutline} onClick={() => setImportOpen(true)}>
            ↑ Import Excel Data
          </button>
          <button className={btnPrimary} onClick={() => setCreateOpen(true)}>
            + Add New Employee
          </button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap my-[18px]">
        {[
          ["Expired Certs", summary.expiredTrainings ?? 0, "text-error"],
          ["Vacation / Halted", vacationCount, "text-error"],
          ["Reserved", summary.reserved ?? 0, "text-amber-600"],
          ["Total Workforce", summary.total ?? 0, "text-indigo-600"],
        ].map(([label, num, numCls]) => (
          <div
            key={label}
            className="flex-1 min-w-[180px] bg-surface-container-lowest border border-outline-variant rounded-xl p-4"
          >
            <div className="text-label-sm uppercase text-on-surface-variant mb-1.5">
              {label}
            </div>
            <div className={`text-headline-md ${numCls}`}>{num}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 items-start">
        <div className="w-[220px] shrink-0 bg-surface-container-lowest border border-outline-variant rounded-xl p-4 self-start">
          <div className="flex items-center justify-between mb-3">
            <span className="text-label-sm uppercase text-on-surface-variant">
              Filters
            </span>
            <button
              onClick={resetFilters}
              className="text-primary text-label-sm font-semibold"
            >
              Reset
            </button>
          </div>

          <div className="pb-3.5 mb-3.5 border-b border-outline-variant">
            <div className="text-label-sm uppercase text-on-surface-variant mb-2">
              Trade
            </div>
            {availableTrades.map((tr) => (
              <label
                key={tr}
                className="flex items-center gap-2 text-body-sm text-on-surface py-1 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 accent-primary-container"
                  checked={trades.includes(tr)}
                  onChange={() => toggleTrade(tr)}
                />
                {tr}
                <span className="ml-auto text-label-sm text-outline">
                  {tradeCounts[tr] ?? 0}
                </span>
              </label>
            ))}
          </div>

          <div className="pb-3.5 mb-3.5 border-b border-outline-variant">
            <div className="text-label-sm uppercase text-on-surface-variant mb-2">
              Status
            </div>
            {STATUSES.map((st) => (
              <label
                key={st}
                className="flex items-center gap-2 text-body-sm text-on-surface py-1 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 accent-primary-container"
                  checked={statuses.includes(st)}
                  onChange={() => toggleStatus(st)}
                />
                {STATUS_LABELS[st]}
              </label>
            ))}
          </div>

          <div>
            <div className="text-label-sm uppercase text-on-surface-variant mb-2">
              Compliance Documents
            </div>
            {DOC_OPTIONS.map(([val, label]) => (
              <label
                key={val || "all"}
                className="flex items-center gap-2 text-body-sm text-on-surface py-1 cursor-pointer"
              >
                <input
                  type="radio"
                  name="docFilter"
                  className="w-3.5 h-3.5 accent-primary-container"
                  checked={docFilter === val}
                  onChange={() => setDocFilter(val)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 max-w-[320px] mb-3 px-3 py-1.5 rounded border border-outline-variant bg-surface-container-low text-outline">
            <Search size={15} className="shrink-0" />
            <input
              type="text"
              placeholder="Search name or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-body-sm text-on-surface w-full placeholder:text-outline"
            />
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
            {isLoading ? (
              <div className="text-center text-outline text-body-sm py-8">
                Loading personnel registry…
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {[
                      "Employee ID",
                      "Name & Trade",
                      "Emirates ID / Passport",
                      "Status",
                      "HSE Passport",
                      "CICPA Pass",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left text-label-sm uppercase text-on-surface-variant bg-surface-container-low px-3.5 py-2.5 border-b border-outline-variant whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr key={e._id} className="hover:bg-surface-container-low">
                      <td className="font-mono-data text-body-sm px-3.5 py-2.5 border-b border-outline-variant">
                        {e.employeeId}
                      </td>
                      <td className="px-3.5 py-2.5 border-b border-outline-variant">
                        <div className="font-semibold text-on-surface text-body-sm">
                          {e.name}
                        </div>
                        <div className="text-label-sm text-on-surface-variant">
                          {e.trade}
                          {e.specialization && (
                            <span className="text-outline font-normal">
                              {" — "}
                              {e.specialization}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="font-mono-data text-body-sm px-3.5 py-2.5 border-b border-outline-variant">
                        {e.emiratesId || e.passportNumber || "—"}
                      </td>
                      <td className="px-3.5 py-2.5 border-b border-outline-variant">
                        <StatusBadge status={e.status} />
                      </td>
                      <td className="px-3.5 py-2.5 border-b border-outline-variant">
                        <DocCell doc={e.documents?.hsePassport} />
                      </td>
                      <td className="px-3.5 py-2.5 border-b border-outline-variant">
                        <DocCell doc={e.documents?.cicpaPass} />
                      </td>
                      <td className="px-3.5 py-2.5 border-b border-outline-variant whitespace-nowrap">
                        <button
                          className={iconBtn}
                          onClick={() => setViewEmp(e)}
                        >
                          View
                        </button>
                        <button
                          className={`${iconBtn} ${!isMobReady(e) ? "opacity-40 cursor-not-allowed" : ""}`}
                          onClick={() => isMobReady(e) && setAssignEmp(e)}
                          disabled={!isMobReady(e)}
                          title={
                            !isMobReady(e)
                              ? "Missing HSE Passport or CICPA Pass — update documents first"
                              : "Assign to job"
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
              <div className="text-center text-outline text-body-sm py-8">
                No personnel match the current filters.
              </div>
            )}
          </div>
        </div>
      </div>

      {importOpen && <ImportModal onClose={() => setImportOpen(false)} />}
      {viewEmp && (
        <EmployeeDetailModal emp={viewEmp} onClose={() => setViewEmp(null)} />
      )}
      {assignEmp && (
        <AssignToJobModal emp={assignEmp} onClose={() => setAssignEmp(null)} />
      )}
      {createOpen && (
        <CreateEmployeeModal onClose={() => setCreateOpen(false)} />
      )}
    </div>
  );
}
