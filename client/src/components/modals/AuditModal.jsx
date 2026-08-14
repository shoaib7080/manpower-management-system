import { useEffect, useState } from 'react';
import useDashboardStore from '../../store/useDashboardStore';
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

const AUTH_OPTIONS = [
  'Ali Hassan — Site Engineer',
  'Fatima Al Zaabi — Mobilisation Lead',
  'Omar Suhail — Operations Manager',
  'Priya Menon — HR Coordinator',
];

export default function AuditModal({ onConfirm }) {
  const { open, pending } = useDashboardStore((s) => s.ui.audit);
  const closeAuditModal = useDashboardStore((s) => s.closeAuditModal);

  const [reason, setReason] = useState('');
  const [authBy, setAuthBy] = useState('');

  useEffect(() => {
    if (open) { setReason(''); setAuthBy(''); }
  }, [open]);

  if (!open || !pending) return null;

  const canSave = reason.trim().length > 0 && authBy !== '';

  const handleSave = () => {
    onConfirm({ pending, reasonForChange: reason, authorizedBy: authBy });
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
            <StatusBadge status={pending.to} />
          </div>
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
              {AUTH_OPTIONS.map((o) => <option key={o}>{o}</option>)}
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
