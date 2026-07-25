import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { createJobOrder, fetchJobOrders } from '../api/services';
import CreateJobOrderModal from '../components/jobOrders/CreateJobOrdersModal';
import StatusBadge from '../components/StatusBadge';
import useDashboardStore, { STAGES } from '../store/useDashboardStore';

export default function JobOrdersPage() {
  const qc = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: jobOrders = [], isLoading } = useQuery({
    queryKey: ['jobOrders'],
    queryFn: async () => { const res = await fetchJobOrders(); return res.data; },
  });

  const createMutation = useMutation({
    mutationFn: createJobOrder,
    onSuccess: () => { qc.invalidateQueries(['jobOrders']); setIsCreateOpen(false); },
  });

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Job Order &amp; Site Fulfillment</h1>
          <div className="sub">Expand any job order to manage trade slots and mobilise personnel.</div>
        </div>
        <div className="btn-row">
          <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
            + Create Job Order
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="empty-state">Loading job orders…</div>
      ) : jobOrders.length === 0 ? (
        <div className="empty-state">No job orders found. Create one to get started.</div>
      ) : (
        <div className="jo-grid">
          {jobOrders.map((jo) => <JobOrderCard key={jo._id} jo={jo} />)}
        </div>
      )}

      <CreateJobOrderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={(payload) => createMutation.mutate(payload)}
        isPending={createMutation.isPending}
      />
    </div>
  );
}

function JobOrderCard({ jo }) {
  const [expanded, setExpanded] = useState(false);

  const total = jo.slots.length;
  const filled = jo.slots.filter((s) => s.status !== 'UNASSIGNED').length;
  const mobilized = jo.slots.filter((s) => s.status === 'MOBILIZED').length;
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;

  // Group slots by trade for the expanded view
  const byTrade = jo.slots.reduce((acc, slot, idx) => {
    if (!acc[slot.trade]) acc[slot.trade] = [];
    acc[slot.trade].push({ ...slot, _idx: idx });
    return acc;
  }, {});

  return (
    <div className="jo-card">
      {/* ── Collapsed header — always visible ── */}
      <div className="jo-card-head">
        <div className="jo-head-top">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="jo-id">{jo.jobOrderNumber}</div>
            <div className="jo-title">{jo.siteName}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
              <span className="jo-client">{jo.clientCategory}</span>
              <span style={{ fontSize: 11, color: 'var(--text-2)' }}>
                Eng: {jo.projectEngineer}
              </span>
            </div>
          </div>

          {/* Right side: stats + toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <Pill color="var(--teal)" bg="var(--green-bg)" label={`${mobilized} Mobilized`} />
              <Pill color="var(--text-2)" bg="var(--gray-bg)" label={`${total - filled} Open`} />
            </div>
            <button className="jo-toggle" onClick={() => setExpanded((v) => !v)}>
              {expanded ? 'Hide Slots' : 'Manage Slots'}
              <span className="chev">{expanded ? '▲' : '▼'}</span>
            </button>
          </div>
        </div>

        <div className="jo-dates">
          <div>Mob: <b>{jo.startDate ? fmt(jo.startDate) : '—'}</b></div>
          <div>Demob: <b>{jo.targetDemobDate ? fmt(jo.targetDemobDate) : '—'}</b></div>
        </div>

        <div className="progress-wrap">
          <div className="progress-top">
            <span>Team Fulfillment</span>
            <span>{filled} / {total} filled ({pct}%)</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* ── Expanded slot section ── */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--line)' }}>
          {Object.entries(byTrade).map(([trade, slots]) => (
            <TradeGroup key={trade} trade={trade} slots={slots} joId={jo._id} />
          ))}
        </div>
      )}
    </div>
  );
}

function TradeGroup({ trade, slots, joId }) {
  const filled = slots.filter((s) => s.status !== 'UNASSIGNED').length;

  return (
    <div style={{ borderBottom: '1px solid var(--line)' }}>
      {/* Trade header row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '9px 16px', background: 'var(--paper)',
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '.03em' }}>
          {trade.toUpperCase()}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
          {filled} / {slots.length} filled
        </span>
      </div>

      {/* Slot cards for this trade */}
      <div className="slot-grid" style={{ borderTop: 'none', marginTop: 0, paddingTop: 12 }}>
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
  const isUnassigned = slot.status === 'UNASSIGNED';
  const locked = slot.status === 'BOOKED' || slot.status === 'MOBILIZED';
  const stageIdx = STAGES.indexOf(slot.status);

  if (isUnassigned) {
    return (
      <div className="slot empty">
        <div className="slot-top">
          <div>
            <div className="slot-trade">Slot {slot.slotNumber}</div>
            <div className="slot-placeholder">Unassigned</div>
          </div>
          <StatusBadge status="AVAILABLE" />
        </div>
        <button className="btn-suggest" onClick={() => openDrawer(joId, slotIdx, slot._id)}>
          ⚡ Auto-Suggest
        </button>
      </div>
    );
  }

  return (
    <div className={`slot${locked ? ' locked' : ''}`}>
      <div className="slot-top">
        <div>
          <div className="slot-trade">Slot {slot.slotNumber}</div>
          <div className="slot-worker">{emp?.name || '—'}</div>
          {emp?.employeeId && (
            <div className="mono" style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 1 }}>
              {emp.employeeId}
            </div>
          )}
        </div>
        <StatusBadge status={slot.status} />
      </div>

      <div>
        <div className="stepper">
          {STAGES.map((_, i) => (
            <div key={i} className={`step${i < stageIdx ? ' done' : i === stageIdx ? ' current' : ''}`} />
          ))}
        </div>
        <div className="stepper-labels">
          {STAGES.map((st, i) => (
            <span key={st} className={i === stageIdx ? 'active' : ''}>
              {st[0]}{st.slice(1, 3).toLowerCase()}
            </span>
          ))}
        </div>
      </div>

      <div className="slot-actions">
        {stageIdx < STAGES.length - 1 ? (
          <button
            className="btn btn-outline btn-sm"
            style={{ flex: 1 }}
            onClick={() => requestAdvance(joId, slot._id, emp, slot.status)}
          >
            → {STAGES[stageIdx + 1]}
          </button>
        ) : (
          <span className="lock-tag" style={{ flex: 1 }}>✓ Mobilized</span>
        )}
        <button
          className="icon-btn"
          title="Release worker"
          onClick={() => requestSwap(joId, slot._id, emp, slot.status)}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// Small inline pill for the card header stats
function Pill({ color, bg, label }) {
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 600, color, background: bg,
      padding: '2px 8px', borderRadius: 3,
    }}>
      {label}
    </span>
  );
}

function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
