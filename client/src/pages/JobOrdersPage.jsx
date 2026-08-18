import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createJobOrder, fetchJobOrders } from "../api/services";
import CreateJobOrderModal from "../components/jobOrders/CreateJobOrdersModal";
import JobOrderImportModal from "../components/jobOrders/JobOrderImportModal";
import StatusBadge from "../components/StatusBadge";
import useDashboardStore, { STAGES } from "../store/useDashboardStore";

const btnBase =
  "inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-label-md whitespace-nowrap";
const btnOutline = `${btnBase} border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low`;
const btnPrimary = `${btnBase} bg-primary-container text-on-primary font-semibold hover:bg-primary`;

// Job-order health isn't a stored field — derived from fulfillment so the
// badge means something real rather than an invented status. Kept to three
// states with clear, checkable criteria (not a fabricated "critical"
// threshold based on dates we'd otherwise have to guess at).
function healthBadge(filled, total, mobilized) {
  if (total > 0 && filled === total)
    return ["ON TRACK", "bg-green-100 text-green-800"];
  if (mobilized > 0)
    return ["MOBILIZING", "bg-primary-fixed text-on-primary-fixed"];
  if (filled === 0)
    return ["PLANNING", "bg-surface-container-high text-on-surface"];
  return ["IN PROGRESS", "bg-orange-100 text-orange-800"];
}

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export default function JobOrdersPage() {
  const qc = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedJoId, setSelectedJoId] = useState(null);

  const { data: jobOrders = [], isLoading } = useQuery({
    queryKey: ["jobOrders"],
    queryFn: async () => (await fetchJobOrders()).data,
  });

  const createMutation = useMutation({
    mutationFn: createJobOrder,
    onSuccess: () => {
      qc.invalidateQueries(["jobOrders"]);
      setIsCreateOpen(false);
    },
  });

  const selectedJo = jobOrders.find((j) => j._id === selectedJoId) || null;

  return (
    <div>
      <div className="flex items-start justify-between gap-5 flex-wrap mb-1">
        <div>
          <h1 className="text-headline-sm text-on-background">
            Active Job Orders
          </h1>
          <div className="text-body-sm text-on-surface-variant mt-1">
            Manage manpower fulfillment across active offshore and onshore
            sites.
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
          {jobOrders.map((jo) => (
            <JobOrderCard
              key={jo._id}
              jo={jo}
              selected={jo._id === selectedJoId}
              onOpen={() => setSelectedJoId(jo._id)}
            />
          ))}
        </div>
      )}

      {selectedJo && (
        <JobOrderDrawer jo={selectedJo} onClose={() => setSelectedJoId(null)} />
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

function JobOrderCard({ jo, selected, onOpen }) {
  const navigate = useNavigate();
  const total = jo.slots.length;
  const filled = jo.slots.filter((s) => s.status !== "UNASSIGNED").length;
  const mobilized = jo.slots.filter((s) => s.status === "MOBILIZED").length;
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
  const [healthLabel, healthCls] = healthBadge(filled, total, mobilized);
  const shortfall = total - filled;

  return (
    <div
      onClick={onOpen}
      className={`bg-surface-container-lowest border rounded-lg p-4 cursor-pointer hover:bg-surface-container-low transition-colors ${
        selected ? "border-primary-container" : "border-outline-variant"
      }`}
    >
      <div className="flex justify-between items-start mb-3 gap-2">
        <div className="min-w-0">
          <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">
            {jo.clientCategory}
          </span>
          <h4 className="text-headline-sm text-on-surface mt-1 truncate">
            {jo.siteName}
          </h4>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold ${healthCls}`}
          >
            {healthLabel}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/job-orders/${jo._id}/edit`);
            }}
            className="w-7 h-7 rounded flex items-center justify-center border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary hover:bg-primary-fixed/20 transition-colors"
            title="Edit Job Order"
          >
            <Edit2 size={12} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-on-surface-variant mb-4 text-label-sm">
        <span className="font-mono-data">
          {fmt(jo.startDate)} – {fmt(jo.targetDemobDate)}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-label-md">
          <span className="text-on-surface">Fulfillment</span>
          <span
            className={
              shortfall === 0
                ? "text-on-surface-variant"
                : "text-primary-container"
            }
          >
            {filled} / {total}
          </span>
        </div>
        <div className="w-full bg-surface-container-high rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full ${pct === 100 ? "bg-green-600" : "bg-primary-container"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function JobOrderDrawer({ jo, onClose }) {
  const [activeSlot, setActiveSlot] = useState(null); // { slot, slotIdx } for a filled-slot popover
  const openDrawer = useDashboardStore((s) => s.openDrawer);

  const total = jo.slots.length;
  const filled = jo.slots.filter((s) => s.status !== "UNASSIGNED").length;
  const shortfall = total - filled;

  const byTrade = jo.slots.reduce((acc, slot, idx) => {
    if (!acc[slot.trade]) acc[slot.trade] = [];
    acc[slot.trade].push({ ...slot, _idx: idx });
    return acc;
  }, {});

  // Real-data timeline: only the two dates the app actually tracks
  // (startDate / targetDemobDate). Not fabricating "Medicals"/"Visas"
  // checkpoints the way the design reference shows — those aren't fields
  // this app tracks anywhere, and inventing them would put dates in front
  // of a coordinator with nothing real behind them.
  const start = jo.startDate ? new Date(jo.startDate) : null;
  const end = jo.targetDemobDate ? new Date(jo.targetDemobDate) : null;
  const now = new Date();
  let todayPct = 0;
  if (start && end && end > start) {
    todayPct = Math.min(
      100,
      Math.max(0, ((now - start) / (end - start)) * 100),
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-on-background/30 z-40"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-surface-container-lowest border-l border-outline-variant shadow-[-4px_0_24px_rgba(15,23,42,0.08)] flex flex-col z-50">
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center sticky top-0 bg-surface-container-lowest z-10">
          <div>
            <h3 className="text-headline-sm text-on-surface">{jo.siteName}</h3>
            <span className="font-mono-data text-[11px] text-on-surface-variant">
              {jo.jobOrderNumber} · {jo.clientCategory}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-container-low rounded-full text-on-surface-variant"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 relative">
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-outline-variant rounded p-3 bg-surface-container-low">
              <span className="text-label-sm text-on-surface-variant block mb-1">
                TOTAL REQ.
              </span>
              <span className="text-headline-md font-mono-data text-on-surface block">
                {total}
              </span>
            </div>
            <div className="border border-outline-variant rounded p-3 bg-surface-container-low">
              <span className="text-label-sm text-on-surface-variant block mb-1">
                FULFILLED
              </span>
              <span className="text-headline-md font-mono-data text-primary-container block">
                {filled}
              </span>
            </div>
            <div className="border border-outline-variant rounded p-3 bg-surface-container-low">
              <span className="text-label-sm text-on-surface-variant block mb-1">
                SHORTFALL
              </span>
              <span
                className={`text-headline-md font-mono-data block ${shortfall > 0 ? "text-orange-600" : "text-on-surface-variant"}`}
              >
                {shortfall}
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-label-md text-on-surface mb-3 uppercase tracking-wider">
              Mobilization Timeline
            </h4>
            <div className="relative pt-6 pb-2">
              <div className="absolute h-1 bg-surface-container-high w-full top-8 rounded" />
              <div
                className="absolute h-1 bg-primary-container top-8 rounded-l"
                style={{ width: `${todayPct}%` }}
              />
              <div className="flex justify-between relative z-10">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-primary-container border-2 border-surface-container-lowest mb-2" />
                  <span className="text-label-sm text-on-surface">
                    Mob Date
                  </span>
                  <span className="font-mono-data text-on-surface-variant text-[10px]">
                    {fmt(jo.startDate)}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-outline-variant border-2 border-surface-container-lowest mb-2" />
                  <span className="text-label-sm text-on-surface-variant">
                    Demob
                  </span>
                  <span className="font-mono-data text-on-surface-variant text-[10px]">
                    {fmt(jo.targetDemobDate)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-end mb-4 border-b border-outline-variant pb-2">
              <h4 className="text-label-md text-on-surface uppercase tracking-wider">
                Trade Allocation
              </h4>
              <span className="text-label-sm text-on-surface-variant">
                Click a tile to manage
              </span>
            </div>

            {Object.entries(byTrade).map(([trade, slots]) => {
              const tradeFilled = slots.filter(
                (s) => s.status !== "UNASSIGNED",
              ).length;
              return (
                <div className="mb-6" key={trade}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-label-md text-on-surface">
                      {trade}
                    </span>
                    <span
                      className={`font-mono-data text-label-sm ${tradeFilled === slots.length ? "text-green-600" : "text-on-surface-variant"}`}
                    >
                      {tradeFilled}/{slots.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {slots.map((slot) =>
                      slot.status === "UNASSIGNED" ? (
                        <button
                          key={slot._id}
                          onClick={() =>
                            openDrawer(jo._id, slot._idx, slot._id)
                          }
                          className="aspect-square bg-surface-container-lowest border-2 border-dashed border-outline-variant rounded flex items-center justify-center hover:border-primary-container hover:bg-surface-container-low transition-colors group"
                          title={`Unassigned — Slot ${slot.slotNumber}`}
                        >
                          <span className="text-outline-variant group-hover:text-primary-container text-lg leading-none">
                            +
                          </span>
                        </button>
                      ) : (
                        <button
                          key={slot._id}
                          onClick={() =>
                            setActiveSlot({ slot, slotIdx: slot._idx })
                          }
                          className="aspect-square bg-surface border border-outline-variant rounded flex flex-col items-center justify-center p-1 relative hover:border-primary-container transition-colors"
                          title={
                            slot.assignedEmployee?.name ||
                            slot.externalWorker?.name
                          }
                        >
                          <div
                            className={`w-6 h-6 rounded-full mb-1 flex items-center justify-center text-[10px] font-bold ${
                              slot.externalWorker?.isExternal
                                ? "bg-amber-500/20 text-amber-800 border border-amber-500/30"
                                : "bg-surface-container-high text-on-surface-variant"
                            }`}
                          >
                            {initials(
                              slot.assignedEmployee?.name ||
                                slot.externalWorker?.name,
                            )}
                          </div>
                          <span className="font-mono-data text-[9px] truncate w-full text-center text-on-surface-variant">
                            {slot.assignedEmployee?.employeeId ||
                              (slot.externalWorker?.isExternal ? "EXT" : "—")}
                          </span>
                          <div
                            className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${STATUS_DOT[slot.status] || "bg-outline"}`}
                          />
                        </button>
                      ),
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-outline-variant sticky bottom-0 bg-surface-container-lowest flex justify-end">
          <button className={btnOutline} onClick={onClose}>
            Close
          </button>
        </div>

        {activeSlot && (
          <SlotActionPopover
            joId={jo._id}
            slot={activeSlot.slot}
            slotIdx={activeSlot.slotIdx}
            onClose={() => setActiveSlot(null)}
          />
        )}
      </div>
    </>
  );
}

const STATUS_DOT = {
  RESERVED: "bg-amber-500",
  BOOKED: "bg-indigo-500",
  MOBILIZED: "bg-blue-500",
  VACATION: "bg-purple-500",
};

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

// Small anchored popover for a filled slot tile — worker detail + status change/release actions
function SlotActionPopover({ joId, slot, onClose }) {
  const requestAdvance = useDashboardStore((s) => s.requestAdvance);
  const requestSwap = useDashboardStore((s) => s.requestSwap);
  const [selectedStatus, setSelectedStatus] = useState("");
  const emp = slot.assignedEmployee;
  const isExt = Boolean(slot.externalWorker?.isExternal);
  const workerObj = emp || {
    name: slot.externalWorker?.name || "Subcontractor Worker",
    trade: slot.trade,
  };
  const stageIdx = STAGES.indexOf(slot.status);

  // Forward statuses available from current position
  const forwardStatuses = STAGES.slice(stageIdx + 1);

  return (
    <div
      className="absolute w-64 bg-surface-container-lowest border border-outline-variant shadow-[0_4px_12px_rgba(15,23,42,0.12)] rounded z-50 p-3"
      style={{ top: "18%", right: 24 }}
    >
      <div className="flex justify-between items-start mb-2 pb-2 border-b border-outline-variant">
        <div>
          <div className="text-body-sm font-semibold text-on-surface flex items-center gap-1.5">
            <span>
              {slot.assignedEmployee?.name || slot.externalWorker?.name}
            </span>
            {isExt && (
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-800 border border-amber-500/30">
                EXT
              </span>
            )}
          </div>
          <div className="font-mono-data text-[10px] text-on-surface-variant">
            {slot.assignedEmployee
              ? `${slot.assignedEmployee.employeeId} · Slot ${slot.slotNumber}`
              : `${slot.externalWorker?.company || "Subcontractor"} · Slot ${slot.slotNumber}`}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-on-surface-variant hover:text-on-surface"
        >
          <X size={14} />
        </button>
      </div>

      <div className="mb-2.5">
        <StatusBadge status={slot.status} />
      </div>

      <div className="flex items-center gap-0.5 mb-3">
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

      {forwardStatuses.length > 0 ? (
        <div className="mb-2">
          <label className="text-[10px] font-medium text-on-surface-variant block mb-1">
            Change Status To
          </label>
          <div className="flex gap-1.5">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="flex-1 h-8 px-2 text-label-sm border border-outline-variant rounded bg-surface-container-lowest focus:border-primary focus:outline-none"
            >
              <option value="">Select status…</option>
              {forwardStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              className="h-8 px-2.5 rounded border border-outline-variant bg-surface-container-lowest text-label-sm text-on-surface hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={!selectedStatus}
              onClick={() => {
                requestAdvance(
                  joId,
                  slot._id,
                  workerObj,
                  slot.status,
                  selectedStatus,
                );
                onClose();
              }}
            >
              →
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-2 text-center text-label-sm text-on-surface-variant font-semibold">
          ✓ Mobilized
        </div>
      )}

      <button
        className="w-full px-2.5 py-1.5 rounded border border-outline-variant bg-surface-container-lowest text-label-sm text-on-surface-variant hover:bg-surface-container-low"
        title="Release worker"
        onClick={() => {
          requestSwap(joId, slot._id, workerObj, slot.status);
          onClose();
        }}
      >
        ✕ Release Worker
      </button>
    </div>
  );
}
