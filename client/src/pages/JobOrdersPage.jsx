import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createJobOrder, fetchJobOrders } from "../api/services";
import CreateJobOrderModal from "../components/jobOrders/CreateJobOrdersModal";
import JobOrderImportModal from "../components/jobOrders/JobOrderImportModal";
import StatusBadge from "../components/StatusBadge";
import useDashboardStore, { STAGES } from "../store/useDashboardStore";

const btnBase =
  "inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-label-md whitespace-nowrap";
const btnOutline = `${btnBase} border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low`;
const btnPrimary = `${btnBase} bg-primary-container text-on-primary font-semibold hover:bg-primary`;
const iconBtn =
  "px-2.5 py-1.5 rounded border border-outline-variant bg-surface-container-lowest text-label-sm text-on-surface-variant hover:bg-surface-container-low";

// Job-order health isn't a stored field — derived from fulfillment so the
// badge means something real rather than an invented status. Kept to three
// states with clear, checkable criteria (not a fabricated "critical"
// threshold based on dates we'd otherwise have to guess at).
function healthBadge(filled, total, mobilized) {
  if (total > 0 && filled === total)
    return ["FULFILLED", "bg-green-50 text-green-700 border-green-200"];
  if (mobilized > 0)
    return [
      "MOBILIZING",
      "bg-[#eff4ff] text-primary-container border-primary-container/20",
    ];
  if (filled === 0)
    return ["PLANNING", "bg-surface-container-low text-on-surface-variant border-outline-variant"];
  return ["IN PROGRESS", "bg-amber-50 text-amber-700 border-amber-200"];
}

export default function JobOrdersPage() {
  const qc = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const { data: jobOrders = [], isLoading } = useQuery({
    queryKey: ["jobOrders"],
    queryFn: async () => {
      const res = await fetchJobOrders();
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: createJobOrder,
    onSuccess: () => {
      qc.invalidateQueries(["jobOrders"]);
      setIsCreateOpen(false);
    },
  });

  return (
    <div>
      <div className="flex items-start justify-between gap-5 flex-wrap mb-1">
        <div>
          <h1 className="text-headline-sm text-on-background">
            Job Order &amp; Site Fulfillment
          </h1>
          <div className="text-body-sm text-on-surface-variant mt-1">
            Expand any job order to manage trade slots and mobilise personnel.
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button className={btnOutline} onClick={() => setImportOpen(true)}>
            ↑ Import Excel Data
          </button>
          <button className={btnPrimary} onClick={() => setIsCreateOpen(true)}>
            + Create Job Order
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-outline text-body-sm py-8">
          Loading job orders…
        </div>
      ) : jobOrders.length === 0 ? (
        <div className="text-center text-outline text-body-sm py-8">
          No job orders found. Create one to get started.
        </div>
      ) : (
        <div className="flex flex-col gap-3 mt-4">
          {jobOrders.map((jo) => (
            <JobOrderCard key={jo._id} jo={jo} />
          ))}
        </div>
      )}

      <CreateJobOrderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={(payload) => createMutation.mutate(payload)}
        isPending={createMutation.isPending}
      />
      {importOpen && (
        <JobOrderImportModal onClose={() => setImportOpen(false)} />
      )}
    </div>
  );
}

function JobOrderCard({ jo }) {
  const [expanded, setExpanded] = useState(false);

  const total = jo.slots.length;
  const filled = jo.slots.filter((s) => s.status !== "UNASSIGNED").length;
  const mobilized = jo.slots.filter((s) => s.status === "MOBILIZED").length;
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
  const [healthLabel, healthCls] = healthBadge(filled, total, mobilized);

  const byTrade = jo.slots.reduce((acc, slot, idx) => {
    if (!acc[slot.trade]) acc[slot.trade] = [];
    acc[slot.trade].push({ ...slot, _idx: idx });
    return acc;
  }, {});

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="font-mono-data text-label-sm text-on-surface-variant">
              {jo.jobOrderNumber}
            </div>
            <h4 className="text-headline-sm text-on-surface mt-0.5">
              {jo.siteName}
            </h4>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary-container/10 text-primary-container">
                {jo.clientCategory}
              </span>
              <span className="text-label-sm text-on-surface-variant">
                Eng: {jo.projectEngineer}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${healthCls}`}
              >
                {healthLabel}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-surface-container-low text-on-surface-variant border border-outline-variant">
                {total - filled} Open
              </span>
            </div>
            <button
              className="inline-flex items-center gap-1.5 border border-outline-variant bg-surface-container-lowest rounded px-2.5 py-1.5 text-label-sm text-on-surface-variant hover:bg-surface-container-low"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Hide Slots" : "Manage Slots"}
              <span className="text-[9px]">{expanded ? "▲" : "▼"}</span>
            </button>
          </div>
        </div>

        <div className="flex gap-5 mt-2.5 text-label-sm text-on-surface-variant flex-wrap">
          <div>
            Mob: <b className="text-on-surface font-semibold">{jo.startDate ? fmt(jo.startDate) : "—"}</b>
          </div>
          <div>
            Demob: <b className="text-on-surface font-semibold">{jo.targetDemobDate ? fmt(jo.targetDemobDate) : "—"}</b>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex justify-between font-label-md text-label-md">
            <span className="text-on-surface">Team Fulfillment</span>
            <span className="text-primary-container">
              {filled} / {total} filled ({pct}%)
            </span>
          </div>
          <div className="w-full bg-surface-container-high rounded-full h-2">
            <div
              className="bg-primary-container h-2 rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-outline-variant">
          {Object.entries(byTrade).map(([trade, slots]) => (
            <TradeGroup key={trade} trade={trade} slots={slots} joId={jo._id} />
          ))}
        </div>
      )}
    </div>
  );
}

function TradeGroup({ trade, slots, joId }) {
  const filled = slots.filter((s) => s.status !== "UNASSIGNED").length;

  return (
    <div className="border-b border-outline-variant last:border-b-0">
      <div className="flex items-center justify-between px-4 py-2 bg-surface-container-low">
        <span className="text-label-sm uppercase text-on-surface-variant">
          {trade}
        </span>
        <span className="text-label-sm text-outline">
          {filled} / {slots.length} filled
        </span>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2 p-3">
        {slots.map((slot) => (
          <Slot key={slot._id} joId={joId} slot={slot} slotIdx={slot._idx} />
        ))}
      </div>
    </div>
  );
}

function Slot({ joId, slot, slotIdx }) {
  const openDrawer = useDashboardStore((s) => s.openDrawer);
  const requestAdvance = useDashboardStore((s) => s.requestAdvance);
  const requestSwap = useDashboardStore((s) => s.requestSwap);

  const emp = slot.assignedEmployee;
  const isUnassigned = slot.status === "UNASSIGNED";
  const locked = slot.status === "BOOKED" || slot.status === "MOBILIZED";
  const stageIdx = STAGES.indexOf(slot.status);

  if (isUnassigned) {
    return (
      <div className="border border-dashed border-outline-variant rounded-lg p-2.5 bg-surface-container-low flex flex-col gap-2">
        <div className="flex justify-between items-start gap-2">
          <div>
            <div className="text-label-sm uppercase text-on-surface-variant">
              Slot {slot.slotNumber}
            </div>
            <div className="text-body-sm text-outline mt-0.5">Unassigned</div>
          </div>
          <StatusBadge status="AVAILABLE" />
        </div>
        <button
          className="w-full py-2 rounded border border-dashed border-outline-variant text-primary-container font-semibold text-label-sm hover:bg-primary-container/10 hover:border-primary-container"
          onClick={() => openDrawer(joId, slotIdx, slot._id)}
        >
          ⚡ Auto-Suggest
        </button>
      </div>
    );
  }

  return (
    <div
      className={`border rounded-lg p-2.5 bg-surface-container-lowest flex flex-col gap-2 ${locked ? "border-on-surface-variant" : "border-outline-variant"}`}
    >
      <div className="flex justify-between items-start gap-2">
        <div>
          <div className="text-label-sm uppercase text-on-surface-variant">
            Slot {slot.slotNumber}
          </div>
          <div className="font-semibold text-body-sm text-on-surface mt-0.5">
            {emp?.name || "—"}
          </div>
          {emp?.employeeId && (
            <div className="font-mono-data text-[10.5px] text-outline mt-0.5">
              {emp.employeeId}
            </div>
          )}
        </div>
        <StatusBadge status={slot.status} />
      </div>

      <div>
        <div className="flex items-center gap-0.5">
          {STAGES.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full ${
                i < stageIdx
                  ? "bg-indigo-500"
                  : i === stageIdx
                    ? "bg-primary-container"
                    : "bg-surface-container-high"
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between text-[8.5px] font-semibold text-outline mt-1">
          {STAGES.map((st, i) => (
            <span
              key={st}
              className={i === stageIdx ? "text-primary-container" : ""}
            >
              {st[0]}
              {st.slice(1, 3).toLowerCase()}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-1.5">
        {stageIdx < STAGES.length - 1 ? (
          <button
            className="flex-1 border border-outline-variant bg-surface-container-lowest rounded px-2.5 py-1.5 text-label-sm text-on-surface hover:bg-surface-container-low"
            onClick={() => requestAdvance(joId, slot._id, emp, slot.status)}
          >
            → {STAGES[stageIdx + 1]}
          </button>
        ) : (
          <span className="flex-1 text-center text-label-sm text-on-surface-variant font-semibold self-center">
            ✓ Mobilized
          </span>
        )}
        <button
          className={iconBtn}
          title="Release worker"
          onClick={() => requestSwap(joId, slot._id, emp, slot.status)}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
