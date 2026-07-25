import { useEffect, useState } from 'react';
import useDashboardStore from '../../store/useDashboardStore';
import StatusBadge from '../StatusBadge';

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
    <div className="overlay show" onClick={(e) => e.target === e.currentTarget && closeAuditModal()}>
      <div className="modal">
        <div className="modal-head">
          <h3>Confirm Status Change</h3>
          <button className="modal-close" onClick={closeAuditModal}>×</button>
        </div>
        <div className="modal-body">
          <div className="worker-line">
            Worker: <b>{pending.workerName}</b> · <span className="mono">{pending.workerTrade}</span>
          </div>
          <div className="transition-box">
            <StatusBadge status={pending.from} />
            <span className="arrow">→</span>
            <StatusBadge status={pending.to} />
          </div>
          <div className="field">
            <label>Reason for Change <span className="req">*</span></label>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Client confirmed headcount, mobilizing per site schedule…" />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Authorized By <span className="req">*</span></label>
            <select value={authBy} onChange={(e) => setAuthBy(e.target.value)}>
              <option value="">Select engineer / manager…</option>
              {AUTH_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={closeAuditModal}>Cancel</button>
          <button className="btn btn-primary" disabled={!canSave} onClick={handleSave}>Save Change</button>
        </div>
      </div>
    </div>
  );
}
