import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  ChevronDown,
  Minus,
  Plus,
  Save,
  Trash2,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchJobOrders, updateJobOrder } from "../api/services";
import useTrades from "../hooks/useTrades";

const CLIENT_CATEGORIES = [
  "ADNOC Onshore",
  "ADNOC Offshore",
  "Internal Production",
  "Other",
];
const JO_STATUSES = ["Planned", "Active", "Completed"];

const inputCls =
  "w-full h-10 px-3 border border-outline-variant rounded bg-surface-bright text-body-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all";

const selectCls = `${inputCls} appearance-none cursor-pointer pr-8`;

function toDateInput(d) {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}

function StatusPill({ status }) {
  const map = {
    Planned: "bg-surface-container-high text-on-surface border-outline-variant",
    Active: "bg-primary-fixed/40 text-primary border-primary-fixed-dim",
    Completed: "bg-green-100 text-green-800 border-green-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border text-label-sm font-semibold uppercase ${map[status] || "bg-surface-container text-on-surface"}`}
    >
      {status}
    </span>
  );
}

// Summarize slot counts per trade
function getSlotStats(slots = []) {
  const stats = {};
  for (const s of slots) {
    if (!stats[s.trade])
      stats[s.trade] = { total: 0, assigned: 0, mobilized: 0 };
    stats[s.trade].total++;
    if (s.status !== "UNASSIGNED") stats[s.trade].assigned++;
    if (s.status === "MOBILIZED") stats[s.trade].mobilized++;
  }
  return stats;
}

export default function EditJobOrderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { trades = [] } = useTrades();

  const { data: jobOrders = [], isLoading } = useQuery({
    queryKey: ["jobOrders"],
    queryFn: async () => (await fetchJobOrders()).data,
  });

  const jo = jobOrders.find((j) => j._id === id) || null;

  // Form state
  const [siteName, setSiteName] = useState("");
  const [clientCategory, setClientCategory] = useState("ADNOC Offshore");
  const [projectEngineer, setProjectEngineer] = useState("");
  const [startDate, setStartDate] = useState("");
  const [joStatus, setJoStatus] = useState("Active");
  const [requirements, setRequirements] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Seed form from fetched data
  useEffect(() => {
    if (jo) {
      setSiteName(jo.siteName || "");
      setClientCategory(jo.clientCategory || "ADNOC Offshore");
      setProjectEngineer(jo.projectEngineer || "");
      setStartDate(toDateInput(jo.startDate));
      setJoStatus(jo.status || "Active");
      setRequirements(
        (jo.requirements || []).map((r) => ({
          trade: r.trade,
          requiredQty: r.requiredQty,
        })),
      );
      setDirty(false);
    }
  }, [jo?._id]);

  const slotStats = getSlotStats(jo?.slots || []);

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateJobOrder(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobOrders"] });
      setDirty(false);
      setSaveError("");
    },
    onError: (e) =>
      setSaveError(e.response?.data?.message || "Failed to save changes."),
  });

  const markDirty = () => setDirty(true);

  const handleQtyChange = (idx, delta) => {
    setRequirements((prev) => {
      const next = [...prev];
      const current = next[idx].requiredQty;
      const assigned = slotStats[next[idx].trade]?.assigned || 0;
      const newQty = Math.max(assigned, current + delta);
      next[idx] = { ...next[idx], requiredQty: newQty };
      return next;
    });
    markDirty();
  };

  const usedTrades = new Set(requirements.map((r) => r.trade));

  const handleAddTrade = () => {
    const unused = trades.find((t) => !usedTrades.has(t));
    if (!unused) return; // all trades already added
    setRequirements((prev) => [...prev, { trade: unused, requiredQty: 1 }]);
    markDirty();
  };

  const handleRemoveTrade = (idx) => {
    const req = requirements[idx];
    const assigned = slotStats[req.trade]?.assigned || 0;
    if (assigned > 0) return; // block removal of active trade
    setRequirements((prev) => prev.filter((_, i) => i !== idx));
    markDirty();
  };

  const handleTradeChange = (idx, newTrade) => {
    setRequirements((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], trade: newTrade };
      return next;
    });
    markDirty();
  };

  const handleSave = () => {
    if (!siteName.trim() || !projectEngineer.trim()) {
      setSaveError("Site Name and Project Engineer are required.");
      return;
    }
    setSaveError("");
    updateMutation.mutate({
      id,
      payload: {
        siteName,
        clientCategory,
        projectEngineer,
        startDate,
        status: joStatus,
        requirements,
      },
    });
  };

  const handleDiscard = () => {
    if (jo) {
      setSiteName(jo.siteName || "");
      setClientCategory(jo.clientCategory || "ADNOC Offshore");
      setProjectEngineer(jo.projectEngineer || "");
      setStartDate(toDateInput(jo.startDate));
      setJoStatus(jo.status || "Active");
      setRequirements(
        (jo.requirements || []).map((r) => ({
          trade: r.trade,
          requiredQty: r.requiredQty,
        })),
      );
      setDirty(false);
      setSaveError("");
    }
  };

  if (isLoading)
    return (
      <div className="text-body-sm text-outline text-center py-12">
        Loading job order…
      </div>
    );
  if (!jo)
    return (
      <div className="text-body-sm text-error text-center py-12">
        Job order not found.
      </div>
    );

  const totalReq = requirements.reduce((s, r) => s + (r.requiredQty || 0), 0);
  const totalAssigned = jo.slots.filter(
    (s) => s.status !== "UNASSIGNED",
  ).length;
  const shortfall = totalReq - totalAssigned;

  return (
    <div className="flex flex-col gap-5">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/job-orders")}
            className="w-8 h-8 rounded flex items-center justify-center border border-outline-variant text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
            title="Back to Job Orders"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-headline-sm font-bold text-on-surface">
                {jo.siteName}
              </h1>
              <StatusPill status={dirty ? "Active" : jo.status} />
              {dirty && (
                <span className="inline-flex items-center gap-1 text-label-sm text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-semibold">
                  ✎ Unsaved Changes
                </span>
              )}
            </div>
            <div className="text-body-sm text-on-surface-variant mt-0.5">
              <span className="font-mono-data text-[11px]">
                {jo.jobOrderNumber}
              </span>{" "}
              · Update requisition details and trade allocations.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {dirty && (
            <button
              onClick={handleDiscard}
              className="h-9 px-4 border border-outline-variant rounded text-on-surface text-label-md hover:bg-surface-container transition-colors"
            >
              Discard Changes
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!dirty || updateMutation.isPending}
            className="h-9 px-4 rounded bg-primary-container text-on-primary text-label-md font-semibold flex items-center gap-1.5 hover:bg-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <Save size={15} />
            {updateMutation.isPending ? "Saving…" : "Save & Validate"}
          </button>
        </div>
      </div>

      {/* ── Save Error ── */}
      {saveError && (
        <div className="flex items-center gap-2.5 bg-error-container/40 border-l-4 border-error rounded px-4 py-3 text-body-sm text-on-error-container">
          <AlertTriangle size={16} className="text-error shrink-0" />
          {saveError}
        </div>
      )}

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Total Required",
            value: totalReq,
            sub: `${requirements.length} trades`,
            icon: <Briefcase size={14} />,
            accent: "text-on-surface",
          },
          {
            label: "Assigned",
            value: totalAssigned,
            sub: `of ${totalReq} slots`,
            icon: null,
            accent: "text-primary",
          },
          {
            label: "Shortfall",
            value: shortfall > 0 ? `-${shortfall}` : "0",
            sub: shortfall > 0 ? "Editing" : "Fulfilled",
            icon: shortfall > 0 ? <AlertTriangle size={14} /> : null,
            accent: shortfall > 0 ? "text-error" : "text-green-700",
          },
          {
            label: "Mobilized",
            value: jo.slots.filter((s) => s.status === "MOBILIZED").length,
            sub: "on site",
            icon: <Zap size={14} />,
            accent: "text-secondary",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`bg-surface border border-outline-variant rounded-lg p-4 ${
              stat.label === "Shortfall" && shortfall > 0
                ? "border-error/30 relative overflow-hidden"
                : ""
            }`}
          >
            {stat.label === "Shortfall" && shortfall > 0 && (
              <div className="absolute inset-0 bg-error/4 animate-pulse" />
            )}
            <div className="relative">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-label-sm text-on-surface-variant uppercase tracking-wide">
                  {stat.label}
                </span>
                {stat.icon && <span className={stat.accent}>{stat.icon}</span>}
              </div>
              <div className={`text-headline-md font-bold ${stat.accent}`}>
                {stat.value}
              </div>
              <div className="text-label-sm text-on-surface-variant">
                {stat.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Requisition Details */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <div className="bg-surface border border-outline-variant rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-outline-variant bg-surface-container-low flex items-center gap-2">
              <Briefcase size={16} className="text-primary" />
              <h3 className="text-headline-sm font-semibold text-on-surface">
                Requisition Details
              </h3>
            </div>
            <div className="p-5 space-y-4">
              {/* Client Category */}
              <div>
                <label className="block text-label-sm uppercase tracking-wide text-on-surface-variant mb-1.5">
                  Client / Operator
                </label>
                <div className="relative">
                  <select
                    value={clientCategory}
                    onChange={(e) => {
                      setClientCategory(e.target.value);
                      markDirty();
                    }}
                    className={selectCls}
                  >
                    {CLIENT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
                  />
                </div>
              </div>

              {/* Site Name */}
              <div>
                <label className="block text-label-sm uppercase tracking-wide text-on-surface-variant mb-1.5">
                  Site Name
                </label>
                <input
                  type="text"
                  className={inputCls}
                  value={siteName}
                  onChange={(e) => {
                    setSiteName(e.target.value);
                    markDirty();
                  }}
                  placeholder="e.g. Umm Shaif Field, Sector 4"
                />
              </div>

              {/* Internal Req ID (read-only) */}
              <div>
                <label className="block text-label-sm uppercase tracking-wide text-on-surface-variant mb-1.5">
                  Internal Req ID
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-outline text-[13px] font-mono-data font-bold">
                    #
                  </span>
                  <input
                    type="text"
                    className={`${inputCls} pl-7 font-mono-data bg-surface-container-low text-on-surface-variant cursor-not-allowed`}
                    value={jo.jobOrderNumber}
                    disabled
                  />
                </div>
              </div>

              {/* Project Engineer */}
              <div>
                <label className="block text-label-sm uppercase tracking-wide text-on-surface-variant mb-1.5">
                  Lead Project Engineer
                </label>
                <input
                  type="text"
                  className={inputCls}
                  value={projectEngineer}
                  onChange={(e) => {
                    setProjectEngineer(e.target.value);
                    markDirty();
                  }}
                  placeholder="Eng. Ahmed Al-Mansoori"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-label-sm uppercase tracking-wide text-on-surface-variant mb-1.5">
                    Mob Date
                  </label>
                  <input
                    type="date"
                    className={inputCls}
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      markDirty();
                    }}
                  />
                </div>
                <div>
                  <label className="block text-label-sm uppercase tracking-wide text-on-surface-variant mb-1.5">
                    Status
                  </label>
                  <div className="relative">
                    <select
                      value={joStatus}
                      onChange={(e) => {
                        setJoStatus(e.target.value);
                        markDirty();
                      }}
                      className={selectCls}
                    >
                      {JO_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Trade Allocation */}
        <div className="lg:col-span-8 bg-surface border border-outline-variant rounded-lg overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-primary text-[18px]">⚙</span>
              <h3 className="text-headline-sm font-semibold text-on-surface">
                Trade Allocation Setup
              </h3>
            </div>
            <button
              onClick={handleAddTrade}
              disabled={usedTrades.size >= trades.length}
              className="flex items-center gap-1 text-primary text-label-sm hover:underline disabled:opacity-30 disabled:cursor-not-allowed disabled:no-underline"
            >
              <Plus size={14} /> Add New Trade
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-outline-variant">
            {requirements.map((req, idx) => {
              const stats = slotStats[req.trade] || {
                total: 0,
                assigned: 0,
                mobilized: 0,
              };
              const hasAssigned = stats.assigned > 0;
              const tradeShortfall = req.requiredQty - stats.assigned;
              const isOverfilled = tradeShortfall < 0;

              return (
                <div
                  key={idx}
                  className="p-5 hover:bg-surface-bright transition-colors"
                >
                  {/* Trade Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between mb-4">
                    <div className="flex items-center gap-2.5 flex-1">
                      {/* Trade name — editable if no assigned slots */}
                      {hasAssigned ? (
                        <div>
                          <h4 className="text-headline-sm font-bold text-on-surface">
                            {req.trade}
                          </h4>
                          <p className="text-body-sm text-on-surface-variant mt-0.5">
                            {stats.assigned} assigned · {stats.mobilized}{" "}
                            mobilized
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-1">
                          <div className="relative flex-1 max-w-xs">
                            <select
                              value={req.trade}
                              onChange={(e) =>
                                handleTradeChange(idx, e.target.value)
                              }
                              className="w-full h-9 px-3 pr-8 border border-outline-variant rounded bg-surface-bright text-body-sm font-semibold text-on-surface appearance-none focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                            >
                              {trades
                                .filter(
                                  (t) => t === req.trade || !usedTrades.has(t),
                                )
                                .map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                            </select>
                            <ChevronDown
                              size={13}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
                            />
                          </div>
                          <p className="text-body-sm text-on-surface-variant whitespace-nowrap">
                            No assignments yet
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Quantity Control */}
                    <div
                      className={`flex items-center border rounded-lg p-1 shrink-0 ${
                        tradeShortfall > 0
                          ? "bg-surface-container-low border-primary/40 ring-2 ring-primary/10"
                          : "bg-surface border-outline-variant"
                      }`}
                    >
                      <div className="flex flex-col px-3 border-r border-outline-variant/60">
                        <span className="text-[9px] text-on-surface-variant uppercase font-semibold mb-0.5">
                          Total Req
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleQtyChange(idx, -1)}
                            disabled={
                              req.requiredQty <= Math.max(1, stats.assigned)
                            }
                            className="w-6 h-6 flex items-center justify-center rounded bg-surface border border-outline-variant hover:bg-surface-container text-on-surface transition-colors disabled:opacity-30"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="font-mono-data text-headline-sm font-bold text-primary w-8 text-center">
                            {req.requiredQty}
                          </span>
                          <button
                            onClick={() => handleQtyChange(idx, 1)}
                            className="w-6 h-6 flex items-center justify-center rounded bg-surface border border-outline-variant hover:bg-surface-container text-on-surface transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col px-3 justify-center min-w-[52px]">
                        <span className="text-[9px] text-on-surface-variant uppercase font-semibold mb-0.5">
                          Shortfall
                        </span>
                        <span
                          className={`font-mono-data text-headline-sm font-bold ${
                            tradeShortfall > 0
                              ? "text-error"
                              : isOverfilled
                                ? "text-amber-600"
                                : "text-outline-variant"
                          }`}
                        >
                          {tradeShortfall > 0
                            ? `-${tradeShortfall}`
                            : tradeShortfall}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Slot Bubbles Preview */}
                  <div className="bg-surface-container-lowest border border-outline-variant rounded px-4 py-3">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-label-sm text-on-surface-variant uppercase">
                        Current Assignments ({stats.assigned}/{req.requiredQty})
                        {stats.assigned === req.requiredQty && (
                          <span className="ml-1.5 text-green-700 font-semibold">
                            — Fulfilled
                          </span>
                        )}
                      </span>
                      {!hasAssigned && (
                        <button
                          onClick={() => handleRemoveTrade(idx)}
                          className="text-outline hover:text-error transition-colors"
                          title="Remove this trade"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {/* Assigned slots preview */}
                      {(jo.slots || [])
                        .filter(
                          (s) =>
                            s.trade === req.trade && s.status !== "UNASSIGNED",
                        )
                        .slice(0, 6)
                        .map((s) => {
                          const initials = (
                            s.assignedEmployee?.name ||
                            s.externalWorker?.name ||
                            "?"
                          )
                            .split(" ")
                            .slice(0, 2)
                            .map((w) => w[0])
                            .join("")
                            .toUpperCase();
                          const isExt = Boolean(s.externalWorker?.isExternal);
                          const isMob = s.status === "MOBILIZED";
                          return (
                            <div
                              key={s._id}
                              title={`${s.assignedEmployee?.name || s.externalWorker?.name} — ${s.status}`}
                              className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-bold relative ${
                                isMob
                                  ? "bg-primary-fixed text-on-primary-fixed border-primary-fixed-dim"
                                  : isExt
                                    ? "bg-amber-500/20 text-amber-800 border-amber-500/30"
                                    : "bg-surface-container-high text-on-surface border-outline-variant"
                              }`}
                            >
                              {initials}
                              {isMob && (
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-white" />
                              )}
                            </div>
                          );
                        })}

                      {/* Unassigned / shortfall slots */}
                      {Array.from({
                        length: Math.max(
                          0,
                          Math.min(3, req.requiredQty - stats.assigned),
                        ),
                      }).map((_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="w-8 h-8 rounded-full border border-dashed border-outline-variant bg-surface flex items-center justify-center text-outline"
                        >
                          <Plus size={10} />
                        </div>
                      ))}

                      {/* "More" label */}
                      {req.requiredQty - stats.assigned > 3 && (
                        <div className="flex items-center justify-center px-2 text-label-sm text-outline-variant">
                          +{req.requiredQty - stats.assigned - 3} more slots
                        </div>
                      )}
                      {stats.assigned > 6 && (
                        <div className="flex items-center justify-center px-2 text-label-sm text-outline-variant">
                          +{stats.assigned - 6} more assigned
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add Trade Placeholder */}
            <button
              onClick={handleAddTrade}
              disabled={usedTrades.size >= trades.length}
              className="w-full p-6 flex flex-col items-center justify-center gap-2 text-outline-variant hover:text-primary hover:bg-surface-container-lowest transition-colors border-dashed border-t border-outline-variant min-h-[100px] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-outline-variant disabled:hover:bg-transparent"
            >
              <Plus size={28} strokeWidth={1.5} />
              <span className="text-label-md font-medium">
                Add Another Trade to Requisition
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Bottom save bar — shows when dirty ── */}
      {dirty && (
        <div className="sticky bottom-0 bg-surface border-t border-outline-variant px-5 py-3 flex items-center justify-between gap-4 rounded-b-lg shadow-md z-10">
          <span className="text-body-sm text-on-surface-variant">
            You have unsaved changes.
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleDiscard}
              className="h-9 px-4 border border-outline-variant rounded text-on-surface text-label-md hover:bg-surface-container transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="h-9 px-4 rounded bg-primary-container text-on-primary text-label-md font-semibold flex items-center gap-1.5 hover:bg-primary transition-colors disabled:opacity-50 shadow-sm"
            >
              <Save size={14} />
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
