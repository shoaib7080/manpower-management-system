import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Download, Search, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  approveTimesheet,
  fetchJobOrders,
  getStaff,
  getTimesheet,
  saveTimesheet,
} from "../../../api/services";
import {
  Field,
  ModalBody,
  ModalFoot,
  ModalHead,
  ModalShell,
  Overlay,
  btnOutline,
  btnPrimary,
  inputCls,
} from "../../../components/ui/Modal";
import { useAuth } from "../../../context/AuthContext";

// Helper: Get days in month
const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();

// Helper: build a Sun–Sat calendar grid (with leading/trailing blanks) for a month
const getCalendarCells = (month, year, daysInMonth) => {
  const firstDow = new Date(year, month - 1, 1).getDay(); // 0 = Sunday
  const cells = Array(firstDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

const th =
  "text-left text-label-sm uppercase text-on-surface-variant bg-surface-container-low px-3.5 py-2.5 border-b border-outline-variant whitespace-nowrap";
const td = "px-3.5 py-2.5 border-b border-outline-variant align-middle";

export default function TimesheetsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Filters
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Project-level constant — same value for every day, every employee, on
  // this job order. This replaces per-cell standard-hours entry entirely.
  const [standardHoursPerDay, setStandardHoursPerDay] = useState(8);

  // Approval modal
  const [approveOpen, setApproveOpen] = useState(false);
  const [approvedBy, setApprovedBy] = useState("");

  // Timesheet state
  const [timesheetId, setTimesheetId] = useState(null);
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState("DRAFT");
  const [approverName, setApproverName] = useState("");
  const [isModified, setIsModified] = useState(false);

  // List/detail UI state
  const [search, setSearch] = useState("");
  const [activeEmpIdx, setActiveEmpIdx] = useState(null); // which employee's modal is open

  const [standardHoursInput, setStandardHoursInput] = useState("8");

  const { data: jobOrders = [] } = useQuery({
    queryKey: ["jobOrders", "simple-list"],
    queryFn: () => fetchJobOrders().then((r) => r.data.jobOrders || r.data),
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: () => getStaff().then((r) => r.data),
    enabled: approveOpen,
  });

  const { data: serverData, isLoading } = useQuery({
    queryKey: ["timesheet", selectedJobId, selectedMonth, selectedYear],
    queryFn: () =>
      getTimesheet(selectedJobId, {
        month: selectedMonth,
        year: selectedYear,
      }).then((r) => r.data),
    enabled: !!selectedJobId,
  });

  useEffect(() => {
    if (serverData) {
      setTimesheetId(serverData._id || null);
      setStatus(serverData.status || "DRAFT");
      setApproverName(serverData.approvedBy || "");
      // Forward-compatible: reads a real per-job-order constant once the
      // backend supports it; falls back to 8 until then.
      setStandardHoursPerDay(serverData.standardHoursPerDay || 8);
      setStandardHoursInput(String(serverData.standardHoursPerDay || 8));
      setIsModified(false);

      const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
      const normalized = (serverData.records || []).map((rec) => {
        const dayMap = new Map(rec.days?.map((d) => [d.dayNumber, d]) || []);
        const days = Array.from({ length: daysInMonth }, (_, idx) => {
          const dayNumber = idx + 1;
          if (dayMap.has(dayNumber)) return dayMap.get(dayNumber);
          return {
            dayNumber,
            selected: false,
            standardHours: 0,
            overtimeHours: 0,
          };
        });
        return { ...rec, days };
      });
      setRecords(normalized);
    } else {
      setTimesheetId(null);
      setRecords([]);
      setStatus("DRAFT");
      setApproverName("");
      setStandardHoursPerDay(8);
      setStandardHoursInput("8");
      setIsModified(false);
    }
  }, [serverData, selectedMonth, selectedYear]);

  const saveMutation = useMutation({
    mutationFn: saveTimesheet,
    onSuccess: () => {
      qc.invalidateQueries([
        "timesheet",
        selectedJobId,
        selectedMonth,
        selectedYear,
      ]);
      setIsModified(false);
      alert("Timesheet draft saved successfully.");
    },
    onError: (err) => {
      alert(err.response?.data?.message || "Failed to save timesheet.");
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, payload }) => approveTimesheet(id, payload),
    onSuccess: () => {
      qc.invalidateQueries([
        "timesheet",
        selectedJobId,
        selectedMonth,
        selectedYear,
      ]);
      setApproveOpen(false);
      alert("Timesheet approved successfully.");
    },
    onError: (err) => {
      alert(err.response?.data?.message || "Failed to approve timesheet.");
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      jobOrderId: selectedJobId,
      month: selectedMonth,
      year: selectedYear,
      // Not consumed by the backend yet — included so it's already in the
      // payload shape once a standardHoursPerDay field exists on the model.
      standardHoursPerDay,
      records: records.map((rec) => ({
        ...rec,
        days: rec.days.filter((d) => d.selected),
      })),
    });
  };

  const handleApproveSubmit = (e) => {
    e.preventDefault();
    if (!timesheetId) {
      alert("Please save the timesheet as a draft first.");
      return;
    }
    approveMutation.mutate({ id: timesheetId, payload: { approvedBy } });
  };

  // Toggle a single employee/day. Standard hours always come from the
  // project-level constant, never typed in per cell.
  const toggleDay = (empIdx, dayIdx) => {
    if (status === "APPROVED") return;
    setRecords((prev) => {
      const next = [...prev];
      const day = { ...next[empIdx].days[dayIdx] };
      day.selected = !day.selected;
      day.standardHours = day.selected ? standardHoursPerDay : 0;
      if (!day.selected) day.overtimeHours = 0;
      next[empIdx] = { ...next[empIdx], days: [...next[empIdx].days] };
      next[empIdx].days[dayIdx] = day;
      return next;
    });
    setIsModified(true);
  };

  const handleOvertimeChange = (empIdx, dayIdx, val) => {
    if (status === "APPROVED") return;
    const num = Math.max(0, parseFloat(val) || 0);
    setRecords((prev) => {
      const next = [...prev];
      const day = { ...next[empIdx].days[dayIdx], overtimeHours: num };
      next[empIdx] = { ...next[empIdx], days: [...next[empIdx].days] };
      next[empIdx].days[dayIdx] = day;
      return next;
    });
    setIsModified(true);
  };

  const markEmployeeFullMonth = (empIdx, present) => {
    if (status === "APPROVED") return;
    setRecords((prev) => {
      const next = [...prev];
      next[empIdx] = {
        ...next[empIdx],
        days: next[empIdx].days.map((d) => ({
          ...d,
          selected: present,
          standardHours: present ? standardHoursPerDay : 0,
          overtimeHours: present ? d.overtimeHours : 0,
        })),
      };
      return next;
    });
    setIsModified(true);
  };

  // Changing the constant re-applies it to every already-marked-present
  // day across every employee — it's a constant, not a per-day snapshot.
  const handleStandardHoursChange = (val) => {
    const num = Math.max(0, parseFloat(val) || 0);
    setStandardHoursPerDay(num);
    setRecords((prev) =>
      prev.map((rec) => ({
        ...rec,
        days: rec.days.map((d) =>
          d.selected ? { ...d, standardHours: num } : d,
        ),
      })),
    );
    setIsModified(true);
  };

  const exportCsv = () => {
    const header = [
      "Employee",
      "Trade",
      "Day",
      "Present",
      "Standard Hours",
      "Overtime Hours",
    ];
    const rows = [header];
    records.forEach((rec) => {
      rec.days.forEach((d) => {
        if (!d.selected) return;
        rows.push([
          rec.employeeName,
          rec.trade,
          d.dayNumber,
          "Yes",
          d.standardHours,
          d.overtimeHours,
        ]);
      });
    });
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timesheet_${selectedJobId}_${selectedYear}-${String(selectedMonth).padStart(2, "0")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);

  const tradeTotals = {};
  records.forEach((rec) => {
    if (!tradeTotals[rec.trade]) {
      tradeTotals[rec.trade] = { standard: 0, overtime: 0, total: 0 };
    }
    rec.days.forEach((d) => {
      if (d.selected) {
        tradeTotals[rec.trade].standard += d.standardHours;
        tradeTotals[rec.trade].overtime += d.overtimeHours;
        tradeTotals[rec.trade].total += d.standardHours + d.overtimeHours;
      }
    });
  });

  const grandTotals = Object.values(tradeTotals).reduce(
    (acc, t) => ({
      standard: acc.standard + t.standard,
      overtime: acc.overtime + t.overtime,
      total: acc.total + t.total,
    }),
    { standard: 0, overtime: 0, total: 0 },
  );

  const filteredRecords = records
    .map((rec, empIdx) => ({ rec, empIdx }))
    .filter(({ rec }) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        rec.employeeName?.toLowerCase().includes(q) ||
        rec.trade?.toLowerCase().includes(q)
      );
    });

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-start justify-between gap-5 flex-wrap mb-1">
        <div>
          <h1 className="text-headline-sm text-on-background">
            Monthly Timesheets
          </h1>
          <div className="text-body-sm text-on-surface-variant mt-1">
            Review and log monthly man-hours per trade for active job orders.
          </div>
        </div>

        {selectedJobId && !isLoading && records.length > 0 && (
          <div className="flex items-center gap-2">
            <button className={btnOutline} onClick={exportCsv}>
              <Download size={15} className="mr-1.5 inline" />
              Export CSV
            </button>
            {status === "APPROVED" ? (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded px-3 py-2 text-label-md font-semibold text-green-700">
                ✓ Approved by: {approverName}
              </div>
            ) : (
              <>
                <button
                  className={btnOutline}
                  onClick={handleSave}
                  disabled={saveMutation.isPending || !isModified}
                >
                  {saveMutation.isPending ? "Saving Draft…" : "Save Draft"}
                </button>
                <button
                  className={btnPrimary}
                  onClick={() => {
                    setApprovedBy("");
                    setApproveOpen(true);
                  }}
                >
                  Approve Timesheet
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Filters + project constant */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex gap-4 flex-wrap items-end my-5">
        <div className="flex-1 min-w-[240px]">
          <label className="block text-label-sm text-on-surface-variant mb-1.5">
            Job Order
          </label>
          <select
            className={inputCls}
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
          >
            <option value="">Choose a job order…</option>
            {jobOrders.map((j) => (
              <option key={j._id} value={j._id}>
                {j.jobOrderNumber} — {j.siteName}
              </option>
            ))}
          </select>
        </div>

        <div className="w-[160px]">
          <label className="block text-label-sm text-on-surface-variant mb-1.5">
            Month
          </label>
          <select
            className={inputCls}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="w-[110px]">
          <label className="block text-label-sm text-on-surface-variant mb-1.5">
            Year
          </label>
          <select
            className={inputCls}
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="w-[170px]">
          <label className="block text-label-sm text-on-surface-variant mb-1.5">
            Standard Hrs / Day
          </label>
          <input
            type="number"
            min="0"
            max="24"
            step="0.5"
            disabled={status === "APPROVED" || !selectedJobId}
            className={inputCls}
            value={standardHoursInput}
            onChange={(e) => setStandardHoursInput(e.target.value)}
            onBlur={(e) => handleStandardHoursChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
          />
        </div>
        <div className="text-label-sm text-on-surface-variant pb-2 max-w-[220px]">
          One value for the whole job order — applied automatically to every day
          marked present. Only overtime varies day to day.
        </div>
      </div>

      {/* Main content */}
      {!selectedJobId ? (
        <div className="bg-surface-container-lowest border border-outline-variant border-dashed rounded-xl py-12 text-center text-outline text-body-md">
          Select a job order above to view or generate timesheets.
        </div>
      ) : isLoading ? (
        <div className="text-center text-outline text-body-md py-12">
          Loading timesheet records…
        </div>
      ) : records.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant border-dashed rounded-xl py-12 text-center text-outline text-body-md">
          No active mobilization logs found for this job order in{" "}
          {MONTHS.find((m) => m.value === selectedMonth)?.label} {selectedYear}.
        </div>
      ) : (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
              <div className="text-label-sm uppercase text-on-surface-variant mb-1.5">
                Personnel
              </div>
              <div className="text-headline-md font-mono-data text-on-surface">
                {records.length}
              </div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
              <div className="text-label-sm uppercase text-on-surface-variant mb-1.5">
                Standard Hours
              </div>
              <div className="text-headline-md font-mono-data text-on-surface">
                {grandTotals.standard}
              </div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
              <div className="text-label-sm uppercase text-on-surface-variant mb-1.5">
                Overtime Hours
              </div>
              <div className="text-headline-md font-mono-data text-amber-600">
                {grandTotals.overtime}
              </div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
              <div className="text-label-sm uppercase text-on-surface-variant mb-1.5">
                Total Hours
              </div>
              <div className="text-headline-md font-mono-data text-primary-container">
                {grandTotals.total}
              </div>
            </div>
          </div>

          {/* Compact personnel list */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-3.5 border-b border-outline-variant flex items-center gap-2 bg-surface-container-low">
              <Search size={15} className="text-on-surface-variant shrink-0" />
              <input
                type="text"
                placeholder="Search name or trade…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none text-body-sm text-on-surface w-full max-w-xs placeholder:text-outline"
              />
              <span className="ml-auto text-label-sm text-on-surface-variant whitespace-nowrap">
                Click a row to log daily hours
              </span>
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>Employee</th>
                  <th className={th}>Trade</th>
                  <th className={th}>Days Present</th>
                  <th className={th}>Standard</th>
                  <th className={th}>Overtime</th>
                  <th className={th}>Total</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(({ rec, empIdx }) => {
                  const daysPresent = rec.days.filter((d) => d.selected).length;
                  const std = rec.days.reduce(
                    (s, d) => s + (d.selected ? d.standardHours : 0),
                    0,
                  );
                  const ot = rec.days.reduce(
                    (s, d) => s + (d.selected ? d.overtimeHours : 0),
                    0,
                  );
                  return (
                    <tr
                      key={`${rec.employeeName}-${empIdx}`}
                      onClick={() => setActiveEmpIdx(empIdx)}
                      className="hover:bg-surface-container-low cursor-pointer"
                    >
                      <td className={td}>
                        <div className="font-semibold text-on-surface text-body-sm">
                          {rec.employeeName}
                          {rec.isExternal && (
                            <span className="ml-1.5 inline-block text-[9px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                              EXT
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`${td} text-on-surface-variant`}>
                        {rec.trade}
                      </td>
                      <td className={`${td} font-mono-data`}>
                        {daysPresent}/{daysInMonth}
                      </td>
                      <td className={`${td} font-mono-data`}>{std}</td>
                      <td
                        className={`${td} font-mono-data ${ot > 0 ? "text-amber-600" : "text-outline"}`}
                      >
                        {ot}
                      </td>
                      <td
                        className={`${td} font-mono-data font-semibold text-primary-container`}
                      >
                        {std + ot}
                      </td>
                      <td className={td}>
                        <button
                          className="px-2.5 py-1.5 rounded border border-outline-variant bg-surface-container-lowest text-label-sm text-on-surface-variant hover:bg-surface-container-low"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveEmpIdx(empIdx);
                          }}
                        >
                          <Calendar size={13} className="inline mr-1" />
                          View Days
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredRecords.length === 0 && (
              <div className="text-center text-outline text-body-sm py-8">
                No personnel match this search.
              </div>
            )}
          </div>

          {/* Trade breakdown */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
            <h2 className="text-body-lg font-semibold text-on-surface mb-3.5">
              Monthly Summary by Trade
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(tradeTotals).map(([trade, tot]) => (
                <div
                  key={trade}
                  className="border border-outline-variant rounded-lg p-3 bg-surface-container-low"
                >
                  <div className="text-label-sm font-semibold text-on-surface-variant uppercase">
                    {trade}
                  </div>
                  <div className="mt-2 flex justify-between items-baseline text-body-sm">
                    <span className="text-on-surface-variant">Standard:</span>
                    <span className="font-semibold text-on-surface">
                      {tot.standard} hrs
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline mt-1 text-body-sm">
                    <span className="text-on-surface-variant">Overtime:</span>
                    <span className="font-semibold text-on-surface">
                      {tot.overtime} hrs
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline mt-2 pt-2 border-t border-outline-variant font-semibold text-primary-container">
                    <span className="text-body-sm">Total:</span>
                    <span className="text-body-lg font-bold">
                      {tot.total} hrs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Employee day-detail modal */}
      {activeEmpIdx !== null && records[activeEmpIdx] && (
        <EmployeeDayModal
          record={records[activeEmpIdx]}
          empIdx={activeEmpIdx}
          month={selectedMonth}
          year={selectedYear}
          daysInMonth={daysInMonth}
          standardHoursPerDay={standardHoursPerDay}
          status={status}
          onToggleDay={toggleDay}
          onOvertimeChange={handleOvertimeChange}
          onMarkFullMonth={markEmployeeFullMonth}
          onClose={() => setActiveEmpIdx(null)}
        />
      )}

      {/* Approval Modal */}
      {approveOpen && (
        <Overlay onClose={() => setApproveOpen(false)}>
          <ModalShell>
            <ModalHead
              title="Approve Monthly Timesheet"
              onClose={() => setApproveOpen(false)}
            />
            <form onSubmit={handleApproveSubmit}>
              <ModalBody>
                <div className="border border-green-200 rounded-lg bg-green-50 px-3.5 py-3 mb-4">
                  <p className="text-label-sm font-bold uppercase text-green-700 mb-1 tracking-wide">
                    ✓ Approval Confirmation
                  </p>
                  <p className="text-body-sm text-on-surface-variant">
                    You are signing off on the logged hours for the selected job
                    order. Once approved, this timesheet will be locked against
                    further changes.
                  </p>
                </div>
                <Field label="Authorized Approval Signature" required>
                  <select
                    className={inputCls}
                    required
                    value={approvedBy}
                    onChange={(e) => setApprovedBy(e.target.value)}
                  >
                    <option value="">Select signing official…</option>
                    {staffList.map((s) => (
                      <option
                        key={s._id}
                        value={`${s.name} (${s.designation})`}
                      >
                        {s.name} — {s.designation}
                      </option>
                    ))}
                  </select>
                </Field>
              </ModalBody>
              <ModalFoot>
                <button
                  type="button"
                  className={btnOutline}
                  onClick={() => setApproveOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={btnPrimary}
                  disabled={approveMutation.isPending || !approvedBy}
                >
                  {approveMutation.isPending
                    ? "Approving…"
                    : "Confirm Approval"}
                </button>
              </ModalFoot>
            </form>
          </ModalShell>
        </Overlay>
      )}
    </div>
  );
}

// Focused day-by-day calendar for one employee — this is where the old
// giant one-row-per-employee, one-column-per-day table's detail moved to,
// so it has room to be a real calendar instead of a cramped grid.
function EmployeeDayModal({
  record,
  empIdx,
  month,
  year,
  daysInMonth,
  standardHoursPerDay,
  status,
  onToggleDay,
  onOvertimeChange,
  onMarkFullMonth,
  onClose,
}) {
  const cells = getCalendarCells(month, year, daysInMonth);
  const dayByNumber = new Map(record.days.map((d) => [d.dayNumber, d]));
  const daysPresent = record.days.filter((d) => d.selected).length;
  const totalStd = record.days.reduce(
    (s, d) => s + (d.selected ? d.standardHours : 0),
    0,
  );
  const totalOt = record.days.reduce(
    (s, d) => s + (d.selected ? d.overtimeHours : 0),
    0,
  );
  const locked = status === "APPROVED";

  return (
    <Overlay onClose={onClose}>
      <ModalShell width={560}>
        <div className="px-[18px] py-3.5 border-b border-outline-variant flex justify-between items-start">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0">
              <User size={16} />
            </div>
            <div>
              <h3 className="text-body-lg font-semibold text-on-surface">
                {record.employeeName}
                {record.isExternal && (
                  <span className="ml-1.5 inline-block text-[9px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200 align-middle">
                    EXT
                  </span>
                )}
              </h3>
              <div className="text-label-sm text-on-surface-variant">
                {record.trade}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface"
          >
            <X size={18} />
          </button>
        </div>

        <ModalBody>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="border border-outline-variant rounded p-2.5 bg-surface-container-low text-center">
              <div className="text-label-sm text-on-surface-variant">
                Days Present
              </div>
              <div className="font-mono-data text-body-lg font-semibold text-on-surface">
                {daysPresent}/{daysInMonth}
              </div>
            </div>
            <div className="border border-outline-variant rounded p-2.5 bg-surface-container-low text-center">
              <div className="text-label-sm text-on-surface-variant">
                Standard
              </div>
              <div className="font-mono-data text-body-lg font-semibold text-on-surface">
                {totalStd} hrs
              </div>
            </div>
            <div className="border border-outline-variant rounded p-2.5 bg-surface-container-low text-center">
              <div className="text-label-sm text-on-surface-variant">
                Overtime
              </div>
              <div className="font-mono-data text-body-lg font-semibold text-amber-600">
                {totalOt} hrs
              </div>
            </div>
          </div>

          {!locked && (
            <div className="flex gap-2 mb-4">
              <button
                className={`${btnOutline} flex-1`}
                onClick={() => onMarkFullMonth(empIdx, true)}
              >
                Mark Full Month Present
              </button>
              <button
                className={`${btnOutline} flex-1`}
                onClick={() => onMarkFullMonth(empIdx, false)}
              >
                Clear Month
              </button>
            </div>
          )}

          <div className="text-label-sm text-on-surface-variant mb-2">
            Tap a day to toggle presence. Standard hours ({standardHoursPerDay}
            /day) apply automatically — only overtime is entered per day.
          </div>

          <div className="grid grid-cols-7 gap-1.5 mb-1">
            {DOW.map((d) => (
              <div
                key={d}
                className="text-center text-label-sm text-outline uppercase font-semibold"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((dayNumber, idx) => {
              if (!dayNumber) return <div key={`blank-${idx}`} />;
              const dayIdx = dayNumber - 1;
              const day = dayByNumber.get(dayNumber);
              return (
                <div
                  key={dayNumber}
                  onClick={() => !locked && onToggleDay(empIdx, dayIdx)}
                  className={`border rounded-md p-1.5 flex flex-col items-center gap-1 transition-colors ${
                    locked ? "cursor-default" : "cursor-pointer"
                  } ${
                    day?.selected
                      ? "bg-primary-container/10 border-primary-container"
                      : "bg-surface-container-lowest border-outline-variant hover:bg-surface-container-low"
                  }`}
                >
                  <span
                    className={`font-mono-data text-[11px] ${day?.selected ? "text-primary-container font-semibold" : "text-on-surface-variant"}`}
                  >
                    {dayNumber}
                  </span>
                  {day?.selected && (
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      value={day.overtimeHours || ""}
                      placeholder="OT"
                      disabled={locked}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        onOvertimeChange(empIdx, dayIdx, e.target.value)
                      }
                      className="w-full text-center text-[10px] px-0.5 py-0.5 border border-outline-variant rounded bg-surface-container-lowest outline-none disabled:bg-surface-container-low"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </ModalBody>

        <ModalFoot>
          <button className={btnPrimary} onClick={onClose}>
            Done
          </button>
        </ModalFoot>
      </ModalShell>
    </Overlay>
  );
}
