import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getStaff } from '../../api/services';
import useDashboardStore, { STAGES } from '../../store/useDashboardStore';
import StatusBadge from '../StatusBadge';
import {
  Field,
  ModalBody,
  ModalFoot,
  ModalHead,
  ModalShell,
  Overlay,
  btnGhost,
  btnPrimary,
  inputCls,
} from '../ui/Modal';

export default function AuditModal({ onConfirm }) {
  const { open, pending } = useDashboardStore((s) => s.ui.audit);
  const closeAuditModal = useDashboardStore((s) => s.closeAuditModal);

  const [reason, setReason] = useState('');
  const [authBy, setAuthBy] = useState('');
  const [targetStatus, setTargetStatus] = useState('');
  const [mobDate, setMobDate] = useState('');

  // Fetch active staff from DB for the "Authorized By" dropdown
  const { data: staffList = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => getStaff().then((r) => r.data),
    enabled: open,
  });

  useEffect(() => {
    if (open && pending) {
      setReason('');
      setAuthBy('');
      setTargetStatus(pending.to || 'RESERVED');
      setMobDate('');
    }
  }, [open, pending]);

  if (!open || !pending) return null;

  const isAssignOrAdvance = pending.action?.type === 'assign' || pending.action?.type === 'advance';
  const isRelease = pending.action?.type === 'release';

  // For assign/advance, show status dropdown; for release, status is fixed to AVAILABLE
  const displayTo = isAssignOrAdvance ? targetStatus : pending.to;

  // Available forward statuses depend on the current status
  const currentIdx = STAGES.indexOf(pending.from);
  const availableStatuses = isAssignOrAdvance
    ? (pending.from === 'AVAILABLE' || pending.from === 'UNASSIGNED')
      ? STAGES // All three options for fresh assignments
      : STAGES.slice(currentIdx + 1) // Only forward statuses for advances
    : [];

  const canSave = reason.trim().length > 0 && authBy !== '';

  const handleSave = () => {
    const auditData = {
      pending: {
        ...pending,
        to: displayTo,
        action: {
          ...pending.action,
          targetStatus: displayTo,
        },
      },
      reasonForChange: reason,
      authorizedBy: authBy,
    };

    // Include mobDate if provided
    if (mobDate) {
      auditData.mobDate = mobDate;
    }

    onConfirm(auditData);
  };

  return (
    <Overlay onBackdropClick={closeAuditModal}>
      <ModalShell>
        <ModalHead title="Confirm Status Change" onClose={closeAuditModal} />
        <ModalBody>
          <div className="text-body-sm text-on-surface-variant mb-3">
            Worker: <b className="text-on-surface font-semibold">{pending.workerName}</b>{" "}
            · <span className="font-mono-data">{pending.workerTrade}</span>
          </div>
          <div className="flex items-center justify-center gap-2.5 bg-surface-container-low border border-outline-variant rounded px-3 py-2.5 mb-3.5">
            <StatusBadge status={pending.from} />
            <span className="text-outline text-label-md">→</span>
            <StatusBadge status={displayTo} />
          </div>

          {/* Target Status Dropdown — for assign/advance only */}
          {isAssignOrAdvance && availableStatuses.length > 0 && (
            <Field label="Target Status" required>
              <select
                className={inputCls}
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
              >
                {availableStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
          )}

          {/* Mobilized Date — shown when target status is MOBILIZED */}
          {isAssignOrAdvance && targetStatus === 'MOBILIZED' && (
            <Field label="Mobilized Date" hint="(leave blank for today)">
              <input
                type="date"
                className={inputCls}
                value={mobDate}
                onChange={(e) => setMobDate(e.target.value)}
              />
            </Field>
          )}

          <Field label="Reason for Change" required>
            <textarea
              rows={3}
              className={inputCls}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Client confirmed headcount, mobilizing per site schedule…"
            />
          </Field>
          <Field label="Authorized By" required>
            <select className={inputCls} value={authBy} onChange={(e) => setAuthBy(e.target.value)}>
              <option value="">Select engineer / manager…</option>
              {staffList.map((s) => (
                <option key={s._id} value={`${s.name} — ${s.designation}`}>
                  {s.name} — {s.designation}
                </option>
              ))}
            </select>
          </Field>
        </ModalBody>
        <ModalFoot>
          <button className={btnGhost} onClick={closeAuditModal}>Cancel</button>
          <button className={btnPrimary} disabled={!canSave} onClick={handleSave}>Save Change</button>
        </ModalFoot>
      </ModalShell>
    </Overlay>
  );
}
