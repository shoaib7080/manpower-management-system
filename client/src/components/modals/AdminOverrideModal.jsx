import { useEffect, useState } from "react";
import useDashboardStore from "../../store/useDashboardStore";

export default function AdminOverrideModal() {
  const { open, pending } = useDashboardStore((s) => s.ui.admin);
  const closeAdminModal = useDashboardStore((s) => s.closeAdminModal);
  const confirmAdminOverride = useDashboardStore((s) => s.confirmAdminOverride);

  const [pin, setPin] = useState("");

  useEffect(() => {
    if (open) setPin("");
  }, [open]);

  if (!open || !pending) return null;

  return (
    <div className="overlay show" onClick={(e) => e.target === e.currentTarget && closeAdminModal()}>
      <div className="modal">
        <div className="modal-head">
          <h3>Locked Assignment</h3>
          <button className="modal-close" onClick={closeAdminModal}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="warn-box">
            <div className="warn-label">Locked assignment</div>
            <p>
              <b>{pending.workerName}</b> is <b>{pending.status}</b> and locked against swap or cancellation.
              Level 1 Admin authorization is required to override this hard lock.
            </p>
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label>
              Admin Override PIN <span className="req">*</span>
            </label>
            <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Enter Level 1 Admin PIN" />
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={closeAdminModal}>
            Cancel
          </button>
          <button className="btn btn-danger-outline" disabled={pin.trim().length === 0} onClick={confirmAdminOverride}>
            Authorize Override
          </button>
        </div>
      </div>
    </div>
  );
}
